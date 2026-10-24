import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

const handlers = toNextJsHandler(auth);

/** Better Auth handles its own errors; this only catches what escapes it, with no internals in the response. */
const guarded = (handler: (req: Request) => Promise<Response>) => async (req: Request) => {
  try {
    const res = await handler(req);
    if (res.status >= 500) logger.error({ requestId: crypto.randomUUID(), path: new URL(req.url).pathname, status: res.status }, "auth 5xx");
    return res;
  } catch (err) {
    const requestId = crypto.randomUUID();
    logger.error({ requestId, path: new URL(req.url).pathname, errName: err instanceof Error ? err.name : "unknown", errorMessage: err instanceof Error ? err.message : String(err) }, "auth failed");
    return Response.json({ error: "Error interno", requestId }, { status: 500 });
  }
};

export const GET = guarded(handlers.GET);
export const POST = guarded(handlers.POST);
