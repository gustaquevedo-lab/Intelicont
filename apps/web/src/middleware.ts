import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge middleware: checks session cookie for private routes.
 * If unauthenticated:
 * - Visiting root "/" or "/landing" renders the commercial landing page.
 * - Any other private route redirects to "/login".
 */
const PUBLIC_PAGES = ["/login", "/landing", "/manual"];
const PUBLIC_API = ["/api/auth/", "/api/health", "/api/trpc/", "/api/brand/", "/api/esfl/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!getSessionCookie(request);

  if (PUBLIC_API.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p))) {
    return NextResponse.next();
  }

  // Unauthenticated visitor on root or /landing sees commercial landing
  if (!hasSession && (pathname === "/" || pathname === "/landing")) {
    return NextResponse.rewrite(new URL("/landing/index.html", request.url));
  }

  const isPublic = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Expose the path to server components (root-layout guard).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest|html)$).*)",
  ],
};
