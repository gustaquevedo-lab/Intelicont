import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DB_URL = process.env.DATABASE_URL || "";

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY || !DB_URL) {
    console.error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL");
    process.exit(1);
  }

  console.log("🔐 Sembrando usuario admin + membership...\n");

  // 1. Crear usuario en Supabase Auth via admin API
  const email = "admin@intelicont.com";
  const password = "Admin123!";

  console.log(`   Creando usuario ${email}...`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "Gustavo Admin", role: "admin" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // Ignore "User already exists" error
    if (res.status === 409) {
      console.log(`   ✓ Usuario ya existe (email: ${email})`);
    } else {
      console.error(`   ✗ Error creando usuario: ${res.status} ${body}`);
      process.exit(1);
    }
  } else {
    console.log(`   ✓ Usuario creado: ${email}`);
  }

  // 2. Obtener user ID
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
  });

  if (!listRes.ok) {
    console.error(`   ✗ Error obteniendo usuario: ${listRes.status}`);
    process.exit(1);
  }

  const { users } = await listRes.json();
  if (!users || users.length === 0) {
    console.error("   ✗ Usuario no encontrado después de crear");
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`   ✓ User ID: ${userId}`);

  // 3. Obtener primera entidad
  const sql = postgres(DB_URL, { prepare: false });
  const db = drizzle(sql, { schema });

  const entities = await db.select().from(schema.entities).limit(1);
  if (entities.length === 0) {
    console.error("   ✗ No hay entidades. Ejecutá primero `pnpm db:seed`");
    process.exit(1);
  }

  const entity = entities[0];

  // 4. Crear membership
  const existing = await db
    .select()
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.entityId, entity.id)
      )
    );

  if (existing.length > 0) {
    console.log(`   ✓ Membership ya existe para ${entity.legalName}`);
  } else {
    await db.insert(schema.memberships).values({
      userId,
      entityId: entity.id,
      role: "admin",
    });
    console.log(`   ✓ Membership creada: admin → ${entity.legalName} (${entity.ruc})`);
  }

  console.log("\n✅ Seed de autenticación completado");
  console.log(`\n📝 Podés iniciar sesión con:\n   Email: ${email}\n   Contraseña: ${password}\n`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
