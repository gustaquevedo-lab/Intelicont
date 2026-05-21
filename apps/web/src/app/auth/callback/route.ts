import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback handler.
 * Handles:
 *  - Magic link clicks (email OTP)
 *  - OAuth redirects (Google, GitHub, etc.)
 *
 * Supabase redirects here with ?code=... after auth.
 * We exchange the code for a session and redirect the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code        = searchParams.get("code");
  const next        = searchParams.get("next") ?? "/";
  const redirectTo  = searchParams.get("redirectTo") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Use `next` param from Supabase or `redirectTo` from our login form
      const destination = next !== "/" ? next : redirectTo;
      return NextResponse.redirect(new URL(destination, origin));
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // Something went wrong — send to login with error flag
  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
