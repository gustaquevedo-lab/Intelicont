import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─── Constants ─────────────────────────────────────────────────────────────

const SESSION_COOKIE = "intelicont_session";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/verify",
  "/auth/signout",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/opengraph-image",
  "/twitter-image",
  "/brand",
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  return (
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||     // auth API routes are public
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "intelicont_railway_secret_key_2026_super_secure";
  return new TextEncoder().encode(secret);
}

// ─── Middleware ────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without any session check
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie
  const jwt = request.cookies.get(SESSION_COOKIE)?.value;

  if (!jwt) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT signature and expiry (lightweight — no DB call in middleware)
    const { payload } = await jwtVerify(jwt, getJwtSecret());

    if (!payload.sessionToken) {
      throw new Error("Invalid session token structure");
    }
  } catch {
    // JWT is invalid or expired — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Forward entity context header for multi-tenancy
  const entityId =
    request.headers.get("x-entity-id") ||
    request.cookies.get("active_entity_id")?.value;

  const response = NextResponse.next();

  if (entityId) {
    response.headers.set("x-entity-id", entityId);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|opengraph-image|twitter-image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)",
  ],
};
