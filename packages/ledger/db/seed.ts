import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL no está definida. Copia .env.example a .env.local y configura la URL.");
    process.exit(1);
  }

  console.log("🌱 Iniciando seed de base de datos...");

  const sql = postgres(dbUrl, { prepare: false });
  const db = drizzle(sql, { schema });

  // 1. Crear entidad de ejemplo
  console.log("📦 Creando entidad de ejemplo...");
  const [entity] = await db
    .insert(schema.entities)
    .values({
      ruc: "80012345-1",
      legalName: "Importadora del Este S.A.",
      tradeName: "ImportEste",
      taxRegimes: ["IVA_GRAL", "IRE_GRAL"],
      baseCurrency: "PYG",
    })
    .returning();

  console.log(`   ✓ Entidad creada: ${entity.legalName} (${entity.id})`);

  // 2. Crear Chart of Accounts
  console.log("📋 Creando plan de cuentas...");
  const [coa] = await db
    .insert(schema.chartOfAccounts)
    .values({
      entityId: entity.id,
      kind: "fiscal_py",
      name: "Plan de Cuentas PY",
    })
    .returning();

  console.log(`   ✓ COA creado: ${coa.name} (${coa.id})`);

  // 3. Crear cuentas (simplificado para el seed)
  console.log("📝 Creando cuentas contables...");
  const cuentas = [
    { code: "1.1.01", name: "Caja", nature: "asset" as const },
    { code: "1.1.02", name: "Banco Galicia Cta. Cte.", nature: "asset" as const },
    { code: "1.1.03", name: "Banco Itau Cta. Cte.", nature: "asset" as const },
    { code: "1.1.05", name: "Cuentas a Cobrar Clientes", nature: "asset" as const },
    { code: "1.1.06", name: "IVA Crédito Fiscal", nature: "asset" as const },
    { code: "1.1.07", name: "IVA Crédito Fiscal 5%", nature: "asset" as const },
    { code: "1.2.01", name: "Mercaderías", nature: "asset" as const },
    { code: "1.2.02", name: "Rodado", nature: "asset" as const },
    { code: "1.2.03", name: "Mobiliario y Útiles", nature: "asset" as const },
    { code: "1.2.04", name: "Equipo de Computación", nature: "asset" as const },
    { code: "2.1.01", name: "Cuentas a Pagar Proveedores", nature: "liability" as const },
    { code: "2.1.02", name: "IVA Débito Fiscal", nature: "liability" as const },
    { code: "2.1.03", name: "IVA Débito Fiscal 5%", nature: "liability" as const },
    { code: "2.1.05", name: "Retenciones a Pagar", nature: "liability" as const },
    { code: "2.1.06", name: "IRE a Pagar", nature: "liability" as const },
    { code: "3.1.01", name: "Capital Social", nature: "equity" as const },
    { code: "3.1.02", name: "Reserva Legal", nature: "equity" as const },
    { code: "3.1.03", name: "Resultados Acumulados", nature: "equity" as const },
    { code: "3.1.04", name: "Resultado del Ejercicio", nature: "equity" as const },
    { code: "4.1.01", name: "Ventas de Mercaderías", nature: "income" as const },
    { code: "4.1.02", name: "Prestación de Servicios", nature: "income" as const },
    { code: "4.1.03", name: "Otros Ingresos", nature: "income" as const },
    { code: "5.1.01", name: "Costo de Mercaderías Vendidas", nature: "expense" as const },
    { code: "5.1.02", name: "Sueldos y Salarios", nature: "expense" as const },
    { code: "5.1.03", name: "Seguridad Social", nature: "expense" as const },
    { code: "5.1.04", name: "Honorarios Profesionales", nature: "expense" as const },
    { code: "5.1.05", name: "Alquileres", nature: "expense" as const },
    { code: "5.1.06", name: "Servicios Públicos", nature: "expense" as const },
    { code: "5.1.07", name: "Depreciación de Rodado", nature: "expense" as const },
    { code: "5.1.08", name: "Depreciación de Equipo de Computación", nature: "expense" as const },
    { code: "5.1.09", name: "Gastos Financieros", nature: "expense" as const },
    { code: "5.1.10", name: "Otros Gastos", nature: "expense" as const },
  ];

  const insertedAccounts = await db
    .insert(schema.accounts)
    .values(
      cuentas.map((c) => ({
        coaId: coa.id,
        code: c.code,
        name: c.name,
        nature: c.nature,
        allowsPosting: true,
      }))
    )
    .returning();

  console.log(`   ✓ ${insertedAccounts.length} cuentas creadas.`);

  // 4. Crear período fiscal
  console.log("📅 Creando período fiscal Mayo 2026...");
  const [period] = await db
    .insert(schema.fiscalPeriods)
    .values({
      entityId: entity.id,
      year: 2026,
      month: 5,
      status: "open",
    })
    .returning();

  console.log(`   ✓ Período creado: ${period.year}/${period.month}`);

  // 5. Crear un asiento de ejemplo
  console.log("📝 Creando asiento de ejemplo...");
  const cuentaMercaderia = insertedAccounts.find((a) => a.code === "1.2.01")!;
  const cuentaIvaCredito = insertedAccounts.find((a) => a.code === "1.1.06")!;
  const cuentaProveedores = insertedAccounts.find((a) => a.code === "2.1.01")!;

  const [entry] = await db
    .insert(schema.journalEntries)
    .values({
      entityId: entity.id,
      periodId: period.id,
      date: new Date("2026-05-01"),
      number: "001-2026",
      source: "manual",
      description: "Compra mercadería Factura 001-233",
      status: "posted",
      postedAt: new Date(),
    })
    .returning();

  await db.insert(schema.journalLines).values([
    {
      entryId: entry.id,
      accountId: cuentaMercaderia.id,
      debit: "10000000.0000",
      credit: "0.0000",
      currencyCode: "PYG",
      description: "Compra mercadería gravada 10%",
    },
    {
      entryId: entry.id,
      accountId: cuentaIvaCredito.id,
      debit: "1000000.0000",
      credit: "0.0000",
      currencyCode: "PYG",
      description: "IVA 10% compra",
    },
    {
      entryId: entry.id,
      accountId: cuentaProveedores.id,
      debit: "0.0000",
      credit: "11000000.0000",
      currencyCode: "PYG",
      description: "Compra a crédito",
    },
  ]);

  console.log(`   ✓ Asiento creado: ${entry.number}`);

  console.log("\n✅ Seed completado exitosamente!");
  console.log(`   Entidad: ${entity.legalName}`);
  console.log(`   Cuentas: ${insertedAccounts.length}`);
  console.log(`   Período: ${period.year}/${period.month}`);
  console.log(`   Asientos: 1`);

  await sql.end();
}

main().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
