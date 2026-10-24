import { sql } from "drizzle-orm";
import { withTenant, type Db } from "@ledger/db/index";
import { getSession } from "./auth";

export const LOGIN_PATH = "/login";
export const TOTP_SETUP_PATH = "/seguridad/2fa";

type GuardUser = { isAdmin: boolean; twoFactorEnabled: boolean } | null;

/** Where a page request must be sent instead, or null to render it. */
export function guardRedirect(path: string, user: GuardUser): string | null {
  if (path === LOGIN_PATH) return null;
  if (!user) return LOGIN_PATH;
  if (needs2FA(user) && path !== TOTP_SETUP_PATH) return TOTP_SETUP_PATH;
  return null;
}

/**
 * Admin/2FA facts for the mandatory-TOTP policy, read inside a tenant transaction
 * (`withTenant` has set app.user_id, which memberships RLS requires). Shared by the page guard
 * and the tRPC middleware. Unknown user -> null.
 */
export async function loadGuardUser(db: Db, userId: string): Promise<GuardUser> {
  const rows = await db.execute<{ is_admin: boolean; two_factor_enabled: boolean | null }>(sql`
    select coalesce(u.two_factor_enabled, false) as two_factor_enabled,
           exists (select 1 from memberships m where m.user_id = u.id and m.role = 'admin') as is_admin
    from users u where u.id = ${userId}`);
  const r = rows[0];
  return r ? { isAdmin: r.is_admin, twoFactorEnabled: !!r.two_factor_enabled } : null;
}

/** True when the policy blocks the user: admin somewhere without TOTP enabled. */
export function needs2FA(user: GuardUser): boolean {
  return !!user && user.isAdmin && !user.twoFactorEnabled;
}

/**
 * Server-side page guard used by the root layout: validates the session against the DB
 * and enforces mandatory TOTP for admins.
 * shortcut: runs per full page load (root layout), not on client-side navigations; an admin
 * only gets past it after a full load (login does a hard navigation), so this holds for now.
 */
export async function pageGuardRedirect(headers: Headers, path: string): Promise<string | null> {
  if (path === LOGIN_PATH) return null;
  const s = await getSession(headers);
  const user = s ? await withTenant(s.userId, (db) => loadGuardUser(db, s.userId)) : null;
  return guardRedirect(path, user);
}
