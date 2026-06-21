import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map((c) => c.name);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "PRESENT (length: " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ")" : "MISSING";

  let debugResult: any = {
    message: "InteliCont Auth Debugger",
    url: request.url,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
    },
    cookiesDetected: cookieNames,
    allCookies: allCookies, // Shows values and options (without sensitive keys, only metadata if needed, but since it's debug let's show them safely)
  };

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    debugResult.authResult = {
      isAuthenticated: !!user,
      userId: user?.id || null,
      email: user?.email || null,
      error: error ? { message: error.message, status: error.status } : null,
    };
  } catch (err: any) {
    debugResult.error = err.message || err;
  }

  return NextResponse.json(debugResult);
}
