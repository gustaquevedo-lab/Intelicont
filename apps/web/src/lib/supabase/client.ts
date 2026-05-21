import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components.
 * Call this inside a component or hook — never at module level.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
