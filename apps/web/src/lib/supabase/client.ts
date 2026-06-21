"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init && init.headers) {
      const sanitize = (val: string) => val.split("").filter(c => c.charCodeAt(0) <= 255).join("");

      if (init.headers instanceof Headers) {
        const nextHeaders = new Headers();
        init.headers.forEach((value, key) => {
          nextHeaders.set(key, sanitize(value));
        });
        init.headers = nextHeaders;
      } else if (Array.isArray(init.headers)) {
        init.headers = init.headers.map(([key, value]) => [key, sanitize(value)] as [string, string]);
      } else {
        const nextHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(init.headers)) {
          nextHeaders[key] = typeof value === "string" ? sanitize(value) : value;
        }
        init.headers = nextHeaders;
      }
    }
    return fetch(input, init);
  };

  _client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: customFetch,
    },
  });
  return _client;
}

export function getSupabaseClient(): SupabaseClient {
  return createClient();
}
