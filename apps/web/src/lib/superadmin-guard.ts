import { headers } from "next/headers";
import { getSession } from "./auth";
import { isMockMode } from "@ledger/db";
import { DEFAULT_SUPERADMIN_EMAILS } from "./superadmin-constants";

export { DEFAULT_SUPERADMIN_EMAILS };

export function getSuperadminEmails(): string[] {
  const allowedRaw = process.env.SUPERADMIN_EMAILS ?? "";
  const allowed = allowedRaw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.length > 0 ? allowed : DEFAULT_SUPERADMIN_EMAILS;
}

export function isSuperadmin(email?: string | null): boolean {
  if (!email) return false;
  const list = getSuperadminEmails();
  return list.includes(email.toLowerCase().trim());
}

/**
 * Call as the FIRST line of every superadmin server action — before any DB access.
 * Throws so Next.js surfaces a generic error boundary (no leak of internal detail).
 *
 * Bypass in test/mock mode (existing codebase pattern).
 */
export async function requireSuperadmin(): Promise<void> {
  if (isMockMode() || process.env.NODE_ENV === "test") return;

  const h = await headers();
  const session = await getSession(h);
  if (!session?.userId) throw new Error("UNAUTHORIZED");

  const userEmail = (session.user?.email ?? "").toLowerCase();
  if (!isSuperadmin(userEmail)) {
    throw new Error("FORBIDDEN");
  }
}
