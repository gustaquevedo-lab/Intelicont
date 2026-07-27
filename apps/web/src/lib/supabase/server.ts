import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function sanitizeEnv(val: string | undefined): string {
  if (!val) return "";
  return val.replace(/^\uFEFF/, "").trim();
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function setEntityContext(entityId: string) {
  try {
    const { setActiveEntity } = await import("@/lib/session");
    await setActiveEntity(entityId);
  } catch (err) {
    console.error("Failed to set entity context native:", err);
  }
}
