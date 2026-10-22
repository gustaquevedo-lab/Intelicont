import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { request } from "@playwright/test";
import { createTestDb, type TestDb } from "../../../packages/ledger/db/test-db";
import { E2E_BASE_URL, E2E_PORT, STORAGE_STATE, STORAGE_STATE_CREATOR, CREATOR_EMAIL, USER_EMAIL, ADMIN_EMAIL, USER_ENTITY_NAME } from "./helpers";

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
    };

    const userPassword = randomBytes(12).toString("hex");
    const adminPassword = randomBytes(12).toString("hex");
    createUser(env, USER_EMAIL, userPassword, "Usuario E2E");
    createUser(env, ADMIN_EMAIL, adminPassword, "Admin E2E");
    const creatorPassword = randomBytes(12).toString("hex");
    createUser(env, CREATOR_EMAIL, creatorPassword, "Creador E2E");

    // Memberships through the owner connection (runtime role cannot write memberships).
    // The user's tenant scope comes only from these rows: it must see its entity, not the admin's.
    const [{ id: entityId }] = await db.owner`insert into entities (ruc, legal_name) values ('80099998-1', 'Empresa E2E') returning id`;
    await db.owner`insert into memberships (user_id, entity_id, role)
      select id, ${entityId}, 'admin' from users where email = ${ADMIN_EMAIL}`;
    const [{ id: userEntityId }] = await db.owner`insert into entities (ruc, legal_name) values ('80099997-3', ${USER_ENTITY_NAME}) returning id`;
    await db.owner`insert into memberships (user_id, entity_id, role)
      select id, ${userEntityId}, 'accountant' from users where email = ${USER_EMAIL}`;

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

    process.env.E2E_READY = "1";
    process.env.E2E_USER_PASSWORD = userPassword;
    process.env.E2E_ADMIN_PASSWORD = adminPassword;
  } catch (e) {
    await teardown();
    throw e;
  }
  return teardown;
}
