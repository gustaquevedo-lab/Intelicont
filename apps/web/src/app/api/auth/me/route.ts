import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user from the native session cookie.
 * Used by the useUser() client-side hook.
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: session.user,
    activeEntityId: session.activeEntityId,
    expiresAt: session.expiresAt,
  });
}
