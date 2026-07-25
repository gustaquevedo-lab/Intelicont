import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const DB_URL = process.env.DATABASE_URL || "";

async function main() {
  if (!DB_URL) {
    console.error("Falta la variable de entorno: DATABASE_URL");
    process.exit(1);
  }

  console.log("🔐 Sembrando usuario admin + membership nativo...\n");

  const email = "admin@intelicont.com";
  const password = "Admin123!";
  const name = "Gustavo Admin";

  const sql = postgres(DB_URL, { prepare: false });
  const db = drizzle(sql, { schema });

  // 1. Check if user already exists
  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));

  if (!user) {
    console.log(`   Creando usuario nativo ${email}...`);
    const passwordHash = await bcrypt.hash(password, 12);
    [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        name,
        emailVerified: true,
      })
      .returning();
    console.log(`   ✓ Usuario creado: ${email}`);
  } else {
    console.log(`   ✓ Usuario ya existe: ${email}`);
  }

  // 2. Obtener primera entidad
  const entities = await db.select().from(schema.entities).limit(1);
  if (entities.length === 0) {
    console.error("   ✗ No hay entidades. Ejecutá primero `pnpm db:seed`");
    process.exit(1);
  }

  const entity = entities[0];

  // 3. Crear membership
  const existing = await db
    .select()
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.userId, user.id),
        eq(schema.memberships.entityId, entity.id)
      )
    );

  if (existing.length > 0) {
    console.log(`   ✓ Membership ya existe para ${entity.legalName}`);
  } else {
    await db.insert(schema.memberships).values({
      userId: user.id,
      entityId: entity.id,
      role: "admin",
    });
    console.log(`   ✓ Membership creada: admin → ${entity.legalName} (${entity.ruc})`);
  }

  console.log("\n✅ Seed de autenticación nativa completado");
  console.log(`\n📝 Podés iniciar sesión con:\n   Email: ${email}\n   Contraseña: ${password}\n`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
