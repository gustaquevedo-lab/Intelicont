import { headers } from "next/headers";
import { getSession } from "./auth";
import { isMockMode } from "@ledger/db";

/**
 * Call as the FIRST line of every superadmin server action — before any DB access.
 * Throws so Next.js surfaces a generic error boundary (no leak of internal detail).
 *
 * Bypass in test/mock mode (existing codebase pattern).
 *
 * Env: SUPERADMIN_EMAILS=email1@example.com,email2@example.com
 */
export async function requireSuperadmin(): Promise<void> {
  if (isMockMode() || process.env.NODE_ENV === "test") return;

  const h = await headers();
  const session = await getSession(h);
  if (!session?.userId) throw new Error("UNAUTHORIZED");

  const allowedRaw = process.env.SUPERADMIN_EMAILS ?? "";
  const allowed = allowedRaw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

  if (allowed.length === 0) {
    // shortcut: no whitelist = open in dev, closed in prod
    if (process.env.NODE_ENV === "production") throw new Error("SUPERADMIN_EMAILS not configured");
    return;
  }

  const userEmail = ((session as Record<string, any>).user?.email ?? "").toLowerCase();
  if (!allowed.includes(userEmail)) throw new Error("FORBIDDEN");
}
