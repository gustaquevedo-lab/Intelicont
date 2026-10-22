import { sql } from "drizzle-orm";
import { getDb } from "@ledger/db/index";
import { auth } from "./auth";

export const LOGIN_PATH = "/login";
export const TOTP_SETUP_PATH = "/seguridad/2fa";

type GuardUser = { isAdmin: boolean; twoFactorEnabled: boolean } | null;

/** Where a page request must be sent instead, or null to render it. */
export function guardRedirect(path: string, user: GuardUser): string | null {
  if (path === LOGIN_PATH) return null;
  if (!user) return LOGIN_PATH;
  if (user.isAdmin && !user.twoFactorEnabled && path !== TOTP_SETUP_PATH) return TOTP_SETUP_PATH;
  return null;
}

/** True if the user holds `admin` in any membership (memberships RLS needs app.user_id). */
async function isAdminAnywhere(userId: string): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    const rows = await tx.execute(
      sql`select 1 from memberships where user_id = ${userId} and role = 'admin' limit 1`,
    );
    return rows.length > 0;
  });
}

/**
 * Server-side page guard used by the root layout: validates the session against the DB
 * and enforces mandatory TOTP for admins.
 * shortcut: runs per full page load (root layout), not on client-side navigations; an admin
 * only gets past it after a full load (login does a hard navigation), so this holds for now.
 */
export async function pageGuardRedirect(headers: Headers, path: string): Promise<string | null> {
  if (path === LOGIN_PATH) return null;
  const s = await auth.api.getSession({ headers });
  const user = s
    ? { isAdmin: await isAdminAnywhere(s.user.id), twoFactorEnabled: !!s.user.twoFactorEnabled }
    : null;
  return guardRedirect(path, user);
}
