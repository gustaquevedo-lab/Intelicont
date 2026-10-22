import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge middleware: only checks that a Better Auth session cookie is present (no DB here).
 * The session is really validated by `getSession` (tRPC context) and the root-layout guard.
 * Only these API prefixes skip the cookie check: auth itself, health, and tRPC (which answers
 * UNAUTHORIZED itself). Any other /api route needs a session cookie (and is redirected otherwise).
 */
const PUBLIC_PAGES = ["/login"];
const PUBLIC_API = ["/api/auth/", "/api/health", "/api/trpc/"]; // trailing "/" = prefix, else exact

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_API.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p))) return NextResponse.next();

  const isPublic = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPublic && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Expose the path to server components (root-layout guard).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest)$).*)",
  ],
};
