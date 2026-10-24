import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc";
import { getSession } from "@/lib/auth";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await getSession(req.headers);
      return {
        userId: session?.userId,
        requestId: crypto.randomUUID(),
        idempotencyKey: req.headers.get("idempotency-key") ?? undefined,
      };
    },
  });

export { handler as GET, handler as POST };
