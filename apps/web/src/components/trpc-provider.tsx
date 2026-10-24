"use client";

import { useState } from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { api } from "@/trpc/client";
import { redirectIfTwoFactorRequired } from "@/lib/two-factor";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    // Any call rejected with "2FA requerido" sends the user to the 2FA setup page.
    queryCache: new QueryCache({ onError: (e) => { redirectIfTwoFactorRequired(e); } }),
    mutationCache: new MutationCache({ onError: (e) => { redirectIfTwoFactorRequired(e); } }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        // Mutations go one per request so each carries its own Idempotency-Key header
        // (set per action through `useIdempotencyKey().trpc`, see lib/trpc-hooks.ts).
        splitLink({
          condition: (op) => op.type === "mutation",
          true: httpLink({
            url: `${getBaseUrl()}/api/trpc`,
            headers: ({ op }) => {
              const key = op.context.idempotencyKey;
              return typeof key === "string" ? { "Idempotency-Key": key } : {};
            },
          }),
          false: httpBatchLink({ url: `${getBaseUrl()}/api/trpc` }),
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  );
}
