import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ─── Public routes (no auth required) ────────────────────────────────────────
const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/landing",          // static landing HTML
  "/favicon.svg",
  "/logo.svg",
  "/opengraph-image",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")
  );
}

// Skip auth enforcement when Supabase is not configured (local dev / preview)
const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Bypass auth entirely for crawler-facing assets ────────────────────────
  // OG image must be reachable by WhatsApp/Meta/Twitter without any session.
  if (
    pathname === "/opengraph-image" ||
    pathname.startsWith("/opengraph-image/")
  ) {
    return NextResponse.next();
  }

  // ── No Supabase credentials → pass everything through (dev/preview mode) ──
  if (!SUPABASE_CONFIGURED) {
    return NextResponse.next();
  }

  // Refresh the Supabase session on every request (keeps JWT alive)
  const { user, response } = await updateSession(request);

  // ── Already authenticated → redirect away from login ──────────────────────
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Not authenticated → redirect to login ─────────────────────────────────
  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - opengraph-image, twitter-image (crawler-facing OG assets)
     * - favicon.ico, .svg, .png, .jpg, .webp
     */
    "/((?!_next/static|_next/image|opengraph-image|twitter-image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
