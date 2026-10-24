/**
 * Creates a login user, or resets a user's password (admin recovery path: there is no SMTP yet).
 * Public sign-up is disabled, so this is the only way to create users.
 *
 * Usage (from apps/web; reads DATABASE_URL from the environment or .env.local):
 *   AUTH_PASSWORD='<min 8 chars>' pnpm -s auth:create-user --email a@b.py --name 'Ana Pérez'
 *   AUTH_PASSWORD='<new>' pnpm -s auth:create-user --email a@b.py --reset-password
 * `--password <pw>` also works, but argv is visible in `ps` and pnpm echoes it without `-s`;
 * prefer AUTH_PASSWORD.
 *
 * Uses Better Auth's own context (password hasher + internal adapter), bypassing the
 * sign-up endpoint without weakening `disableSignUp`. A reset also revokes the user's sessions.
 */
import { parseArgs } from "node:util";
import { auth } from "../src/lib/auth";

async function createOrResetUser(opts: {
  email: string;
  password: string;
  name?: string;
  reset?: boolean;
}): Promise<{ userId: string; action: "created" | "reset" }> {
  const ctx = await auth.$context;
  const email = opts.email.trim().toLowerCase();
  const { minPasswordLength, maxPasswordLength } = ctx.password.config;
  if (opts.password.length < minPasswordLength || opts.password.length > maxPasswordLength) {
    throw new Error(`password must be ${minPasswordLength}-${maxPasswordLength} characters`);
  }
  const hash = await ctx.password.hash(opts.password);
  const existing = await ctx.internalAdapter.findUserByEmail(email);

  if (opts.reset) {
    if (!existing) throw new Error(`no user with email ${email}`);
    const userId = existing.user.id;
    if (await ctx.internalAdapter.findCredentialAccount(userId)) {
      await ctx.internalAdapter.updatePassword(userId, hash);
    } else {
      await ctx.internalAdapter.linkAccount({ userId, providerId: "credential", accountId: userId, password: hash });
    }
    await ctx.internalAdapter.deleteUserSessions(userId);
    return { userId, action: "reset" };
  }

  if (existing) throw new Error(`user ${email} already exists (use --reset-password)`);
  if (!opts.name) throw new Error("--name is required");
  const user = await ctx.internalAdapter.createUser({ email, name: opts.name, emailVerified: false }, { method: "admin" });
  await ctx.internalAdapter.linkAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: hash });
  return { userId: user.id, action: "created" };
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      password: { type: "string" },
      name: { type: "string" },
      "reset-password": { type: "boolean", default: false },
    },
  });
  const password = values.password ?? process.env.AUTH_PASSWORD;
  if (!values.email || !password) throw new Error("--email and a password (AUTH_PASSWORD or --password) are required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const r = await createOrResetUser({
    email: values.email,
    password,
    name: values.name,
    reset: values["reset-password"],
  });
  console.log(`${r.action} user ${r.userId}`);
}

main().then(
  () => process.exit(0),
  (e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
