import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

/**
 * POST /api/auth/signout
 *
 * Destroys the server-side session (removes from DB) and clears the cookie.
 */
export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true }, { status: 200 });
}
