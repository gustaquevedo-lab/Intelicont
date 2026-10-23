import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { request } from "@playwright/test";
import { createTestDb, type TestDb } from "../../../packages/ledger/db/test-db";
import { PY_CHART_OF_ACCOUNTS, flattenTree } from "../src/lib/chart-of-accounts";
import { E2E_BASE_URL, E2E_PORT, STORAGE_STATE, STORAGE_STATE_CREATOR, STORAGE_STATE_SIFEN, SIFEN_EMAIL, CREATOR_EMAIL, USER_EMAIL, ADMIN_EMAIL, USER_ENTITY_NAME } from "./helpers";

const WEB_DIR = process.cwd(); // playwright runs from apps/web (pnpm test:e2e)

/** Creates a login user through the real CLI (scripts/create-admin.ts) against the throwaway DB. */
function createUser(env: NodeJS.ProcessEnv, email: string, password: string, name: string) {
  execFileSync("node_modules/.bin/tsx", ["scripts/create-admin.ts", "--email", email, "--password", password, "--name", name], {
    cwd: WEB_DIR,
    env,
    stdio: "pipe",
  });
}

async function waitForServer(url: string, timeoutMs: number) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`e2e web server did not start at ${url}`);
}

/**
 * Throwaway DB (createTestDb) + users + a dedicated `next dev` on E2E_PORT pointed at the DB's
 * runtime role. Playwright starts `webServer` before globalSetup, so the server is spawned here
 * instead. Returns the teardown. Without TEST_ADMIN_URL nothing starts and the specs skip.
 */
export default async function globalSetup() {
  if (!process.env.TEST_ADMIN_URL) {
    console.warn("[e2e] TEST_ADMIN_URL not set: skipping e2e");
    return;
  }
  if (await fetch(`${E2E_BASE_URL}/api/health`).then(() => true, () => false)) {
    throw new Error(`[e2e] port ${E2E_PORT} is already in use`);
  }

  // `next dev` with a different distDir rewrites these two files; restore them afterwards.
  const generated = ["tsconfig.json", "next-env.d.ts"].map((f) => [f, readFileSync(f, "utf8")] as const);

  let db: TestDb | undefined;
  let server: ChildProcess | undefined;
  const teardown = async () => {
    if (server?.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    for (const [f, content] of generated) writeFileSync(f, content);
    await db?.drop();
  };

  try {
    db = await createTestDb();
    const { TEST_ADMIN_URL: _omit, ...baseEnv } = process.env;
    const env: NodeJS.ProcessEnv = {
      ...baseEnv,
      DATABASE_URL: db.appUrl,
      BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
      BETTER_AUTH_URL: E2E_BASE_URL,
      NEXT_DIST_DIR: ".next-e2e",
      AI_PROVIDER: "rules", // e2e never needs the local model
    };

    const userPassword = randomBytes(12).toString("hex");
    const adminPassword = randomBytes(12).toString("hex");
    createUser(env, USER_EMAIL, userPassword, "Usuario E2E");
    createUser(env, ADMIN_EMAIL, adminPassword, "Admin E2E");
    const creatorPassword = randomBytes(12).toString("hex");
    createUser(env, CREATOR_EMAIL, creatorPassword, "Creador E2E");
    const sifenPassword = randomBytes(12).toString("hex");
    createUser(env, SIFEN_EMAIL, sifenPassword, "SIFEN E2E");

    // Memberships through the owner connection (runtime role cannot write memberships).
    // The user's tenant scope comes only from these rows: it must see its entity, not the admin's.
    const [{ id: entityId }] = await db.owner`insert into entities (ruc, legal_name) values ('80099998-1', 'Empresa E2E') returning id`;
    await db.owner`insert into memberships (user_id, entity_id, role)
      select id, ${entityId}, 'admin' from users where email = ${ADMIN_EMAIL}`;
    const [{ id: userEntityId }] = await db.owner`insert into entities (ruc, legal_name) values ('80099997-3', ${USER_ENTITY_NAME}) returning id`;
    await db.owner`insert into memberships (user_id, entity_id, role)
      select id, ${userEntityId}, 'accountant' from users where email = ${USER_EMAIL}`;
    const [{ id: sifenEntityId }] = await db.owner`insert into entities (ruc, legal_name, tax_regimes) values ('1234567-9', 'Cliente de Prueba E2E', array['IVA_GRAL']) returning id`;
    await db.owner`insert into memberships (user_id, entity_id, role)
      select id, ${sifenEntityId}, 'accountant' from users where email = ${SIFEN_EMAIL}`;
    // Default chart + the fixture's month (2026-08) open, so a suggestion can be approved and posted.
    const [{ id: coaId }] = await db.owner`insert into chart_of_accounts (entity_id, kind, name) values (${sifenEntityId}, 'fiscal_py', 'Plan de Cuentas PY') returning id`;
    const ids = new Map<string, string>();
    for (const a of flattenTree(PY_CHART_OF_ACCOUNTS)) {
      const parentId = a.parentCode ? ids.get(a.parentCode) ?? null : null;
      const [{ id }] = await db.owner`insert into accounts (coa_id, code, name, nature, parent_id, allows_posting)
        values (${coaId}, ${a.code}, ${a.name}, ${a.nature}, ${parentId}, ${a.allowsPosting}) returning id`;
      ids.set(a.code, id);
    }
    await db.owner`insert into fiscal_periods (entity_id, year, month, status) values (${sifenEntityId}, 2026, 8, 'open')`;
    // Reversals are dated today, so they need the open period of the current month (Asunción).
    await db.owner`insert into fiscal_periods (entity_id, year, month, status)
      select ${sifenEntityId}, extract(year from n)::int, extract(month from n)::int, 'open' from (select now() at time zone 'America/Asuncion' as n) t
      on conflict do nothing`;
    // A supplier with an IVA 30 % withholding profile (manual document spec).
    const [{ id: agenteId }] = await db.owner`insert into partners (entity_id, kind, ruc, dv_ruc, legal_name, retention_profile)
      values (${sifenEntityId}, 'supplier', '80005427', '0', 'Proveedor Agente E2E', '{"iva":{"rate":0.3}}'::jsonb) returning id`;
    // A non-electronic purchase alone in 06/2026 (registro spec): the only row of that month's Registro de Comprobantes.
    await db.owner`insert into tax_documents (entity_id, direction, doc_type, number, timbrado, issue_date, partner_id, condition,
        status, sifen_status, gravado_10, total, doc_code, counterparty_id_type, imputa_iva, is_electronic)
      values (${sifenEntityId}, 'received', 'invoice', '001-001-0000099', '12345678', '2026-06-10', ${agenteId}, 'cash',
        'posted', null, 1100000, 1100000, 109, 11, true, false)`;

    server = spawn("node_modules/.bin/next", ["dev", "--turbo", "-p", String(E2E_PORT)], {
      cwd: WEB_DIR,
      env,
      stdio: "ignore",
      detached: true,
    });
    await waitForServer(`${E2E_BASE_URL}/api/health`, 120_000);

    // Logged-in storage state for the non-admin user (used by app.spec.ts).
    const ctx = await request.newContext({ baseURL: E2E_BASE_URL, extraHTTPHeaders: { Origin: E2E_BASE_URL } });
    const res = await ctx.post("/api/auth/sign-in/email", { data: { email: USER_EMAIL, password: userPassword } });
    if (!res.ok()) throw new Error(`[e2e] sign-in for storage state failed: ${res.status()}`);
    await ctx.storageState({ path: STORAGE_STATE });
    await ctx.dispose();

    // Same for the entity creator, then flag 2FA on (the session cookie stays valid; no TOTP step needed).
    const ctx2 = await request.newContext({ baseURL: E2E_BASE_URL, extraHTTPHeaders: { Origin: E2E_BASE_URL } });
    const res2 = await ctx2.post("/api/auth/sign-in/email", { data: { email: CREATOR_EMAIL, password: creatorPassword } });
    if (!res2.ok()) throw new Error(`[e2e] sign-in for creator storage state failed: ${res2.status()}`);
    await ctx2.storageState({ path: STORAGE_STATE_CREATOR });
    await ctx2.dispose();
    await db.owner`update users set two_factor_enabled = true where email = ${CREATOR_EMAIL}`;

    const ctx3 = await request.newContext({ baseURL: E2E_BASE_URL, extraHTTPHeaders: { Origin: E2E_BASE_URL } });
    const res3 = await ctx3.post("/api/auth/sign-in/email", { data: { email: SIFEN_EMAIL, password: sifenPassword } });
    if (!res3.ok()) throw new Error(`[e2e] sign-in for sifen storage state failed: ${res3.status()}`);
    await ctx3.storageState({ path: STORAGE_STATE_SIFEN });
    await ctx3.dispose();

    process.env.E2E_READY = "1";
    process.env.E2E_USER_PASSWORD = userPassword;
    process.env.E2E_ADMIN_PASSWORD = adminPassword;
  } catch (e) {
    await teardown();
    throw e;
  }
  return teardown;
}
