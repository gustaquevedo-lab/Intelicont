import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js middleware — runs on every matched request before the page renders.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session (rotate cookies if the token was refreshed).
 *  2. Protect authenticated routes: redirect unauthenticated users to /login.
 *  3. Redirect authenticated users away from /login back to the app.
 *
 * Public routes (no auth required):
 *  - /login
 *  - /auth/callback  (Supabase magic-link / OAuth callback)
 *  - /api/*          (internal API routes)
 *  - /_next/*        (Next.js internals)
 *  - /favicon.ico, /public assets
 */

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always run session refresh so cookies stay fresh
  const { user, response } = await updateSession(request);

  // ── Unauthenticated user hitting a protected route ─────────────────────────
  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated user hitting /login ──────────────────────────────────────
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  /*
   * Match all request paths EXCEPT:
   *  - _next/static  (static files)
   *  - _next/image   (image optimization)
   *  - favicon.ico
   *  - public folder assets (images, fonts, etc.)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)",
  ],
};
