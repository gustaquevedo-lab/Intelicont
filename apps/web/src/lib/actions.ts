"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { revalidatePath } from "next/cache";

import * as schema from "../../../packages/ledger/db/schema";

interface CreateAsientoInput {
  entityId: string;
  periodId: string;
  date: string;
  descripcion: string;
  lineas: {
    accountId: string;
    debit: string;
    credit: string;
    currencyCode: string;
    description: string;
  }[];
}

export async function createAsiento(input: CreateAsientoInput) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    // Si no hay DATABASE_URL, creamos en memoria y retornamos éxito simulado
    console.log("[createAsiento] DATABASE_URL no configurada, usando modo simulación");
    return {
      success: true,
      message: "Asiento creado (modo simulación - configura DATABASE_URL para persistencia real)",
      id: "mock-" + Math.random().toString(36).slice(2, 10),
    };
  }

  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });

  // Validar balance
  const totalDebito = input.lineas.reduce((sum, l) => sum + parseFloat(l.debit), 0);
  const totalCredito = input.lineas.reduce((sum, l) => sum + parseFloat(l.credit), 0);
  if (Math.abs(totalDebito - totalCredito) > 0.01) {
    return { success: false, message: "El asiento no está balanceado" };
  }

  // Crear asiento
  const [entry] = await db
    .insert(schema.journalEntries)
    .values({
      entityId: input.entityId,
      periodId: input.periodId,
      date: new Date(input.date),
      number: `JE-${Date.now().toString().slice(-6)}`,
      source: "manual",
      description: input.descripcion,
      status: "posted",
      postedAt: new Date(),
    })
    .returning();

  // Crear líneas
  await db.insert(schema.journalLines).values(
    input.lineas.map((l) => ({
      entryId: entry.id,
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      currencyCode: l.currencyCode || "PYG",
      description: l.description,
    }))
  );

  revalidatePath("/asientos");

  return {
    success: true,
    message: "Asiento creado exitosamente",
    id: entry.id,
  };
}

export async function getEmpresas() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return [];
  }
  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });
  return db.select().from(schema.entities).orderBy(schema.entities.createdAt);
}

export async function getAsientos() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return [];
  }
  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });
  return db.select().from(schema.journalEntries).orderBy(schema.journalEntries.date);
}

export async function getCuentas(entityId: string) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return [];
  }
  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });
  const coas = await db
    .select()
    .from(schema.chartOfAccounts)
    .where(schema.chartOfAccounts.entityId.eq(entityId));
  if (coas.length === 0) return [];
  return db
    .select()
    .from(schema.accounts)
    .where(schema.accounts.coaId.eq(coas[0].id))
    .orderBy(schema.accounts.code);
}
