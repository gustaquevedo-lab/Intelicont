import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { getDb } from "@ledger/db/index";
import { users, sessions, authAccounts, verifications, twoFactors } from "@ledger/db/schema";

/**
 * Better Auth on the app's own Postgres (runtime role; auth tables have no tenant RLS).
 * Public sign-up is disabled: users are created with `pnpm auth:create-user` (scripts/create-admin.ts).
 */
export const auth = betterAuth({
  appName: "InteliCont",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { users, sessions, auth_accounts: authAccounts, verifications, two_factors: twoFactors },
  }),
  advanced: { database: { generateId: "uuid" } },
  user: { modelName: "users" },
  session: { modelName: "sessions", expiresIn: 60 * 60 * 8 },
  account: { modelName: "auth_accounts" },
  verification: { modelName: "verifications" },
  emailAndPassword: { enabled: true, requireEmailVerification: false, disableSignUp: true },
  plugins: [twoFactor({ issuer: "InteliCont", twoFactorTable: "two_factors" })],
});

/** The only source of identity for server code. Any internal error yields null (fail closed). */
export async function getSession(headers: Headers): Promise<{ userId: string } | null> {
  try {
    const s = await auth.api.getSession({ headers });
    return s?.user?.id ? { userId: s.user.id } : null;
  } catch {
    return null;
  }
}
