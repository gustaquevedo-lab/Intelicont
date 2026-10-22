import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth middleware for InteliCont.
 *
 * Currently in MOCK MODE — all requests pass through.
 * When Supabase Auth is configured, this will:
 * 1. Refresh the session cookie
 * 2. Redirect unauthenticated users to /login
 * 3. Enforce role-based access to admin routes
 */

const PUBLIC_ROUTES = ["/login", "/api/health"];
const ADMIN_ROUTES: string[] = [];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // TODO: Check Supabase session when configured
  // const supabase = createServerClient(...)
  // const { data: { user } } = await supabase.auth.getUser()
  // if (!user) return NextResponse.redirect(new URL("/login", request.url))

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
