import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = request.cookies.getAll();
          console.log("[Middleware cookies.getAll]", allCookies.map(c => c.name));
          return allCookies;
        },
        setAll(cookiesToSet) {
          console.log("[Middleware cookies.setAll]", cookiesToSet.map(c => c.name));
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  console.log("[Middleware] Calling getUser()...");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("[Middleware] getUser() result:", { 
    userId: user?.id, 
    email: user?.email,
    error: error?.message 
  });

  return { user, response: supabaseResponse };
}
