import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  console.log("[Auth Callback]", { code: !!code, next, errorParam, errorDesc, origin });

  if (errorParam) {
    console.error("[Auth Callback] Error from Supabase:", errorParam, errorDesc);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDesc || errorParam)}`, origin)
    );
  }

  if (!code) {
    console.error("[Auth Callback] No code provided");
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  let response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          response = NextResponse.redirect(new URL(next, origin));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth Callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  console.log("[Auth Callback] Session established for:", data?.user?.email);
  return response;
}
