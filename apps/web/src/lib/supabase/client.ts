import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const IS_CONFIGURED = !!SUPABASE_URL && !SUPABASE_URL.includes("placeholder");

/**
 * Supabase client for Client Components.
 * When Supabase is not configured (dev/preview), returns a no-op client
 * with autoRefreshToken and persistSession disabled to avoid network loops.
 */
export function createClient() {
  return createBrowserClient(
    IS_CONFIGURED ? SUPABASE_URL : "https://placeholder.supabase.co",
    IS_CONFIGURED ? SUPABASE_KEY : "placeholder-anon-key",
    {
      auth: {
        autoRefreshToken: IS_CONFIGURED,
        persistSession:   IS_CONFIGURED,
        detectSessionInUrl: IS_CONFIGURED,
      },
    }
  );
}
