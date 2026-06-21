import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/signout",
  "/opengraph-image",
  "/twitter-image",
  "/brand",
];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function isRSCRequest(request: NextRequest): boolean {
  return (
    request.headers.has("RSC") ||
    request.nextUrl.searchParams.has("_rsc") ||
    request.headers.get("x-middleware-prefetch") === "1"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("[Middleware] Request path:", pathname);

  if (isPublic(pathname)) {
    console.log("[Middleware] Public path, skipping auth check:", pathname);
    return NextResponse.next();
  }

  const { user, response } = await updateSession(request);

  if (!user) {
    if (pathname === "/") {
      if (isRSCRequest(request)) {
        console.log("[Middleware] No user, RSC request for '/', redirecting to /login");
        return NextResponse.redirect(new URL("/login", request.url));
      }
      console.log("[Middleware] No user, rewriting '/' to serve landing page");
      return NextResponse.rewrite(new URL("/landing/index.html", request.url));
    }
    console.log("[Middleware] No user, redirecting to /login from:", pathname);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log("[Middleware] Auth successful, proceeding to:", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|opengraph-image|twitter-image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)",
  ],
};
