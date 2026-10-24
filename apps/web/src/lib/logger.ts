import pino from "pino";

/** Paths whose values are never written (cookies, credentials, signed XML). */
const REDACT = [
  "req.headers.cookie",
  "req.headers.authorization",
  "*.password",
  "*.token",
  "*.authorization",
  "*.secret",
  "*.xml",
  "headers.cookie",
  "headers.authorization",
  "*.cookie",
  '*["set-cookie"]',
  "password",
  "token",
  "authorization",
  "secret",
  "xml",
];

/**
 * JSON lines to stdout (or `dest`). Level: `LOG_LEVEL`, default `info`; silent under tests unless
 * a test injects its own stream.
 */
export function createLogger(dest?: NodeJS.WritableStream) {
  const level = process.env.LOG_LEVEL ?? (!dest && process.env.NODE_ENV === "test" ? "silent" : "info");
  return pino(
    {
      level,
      base: { service: "intelicont-web" },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: { paths: REDACT, censor: "[redacted]" },
    },
    dest,
  );
}

export const logger = createLogger();

const MAX = 500;
const scrub = (m: string) => {
  const i = m.search(/\n?params:/);
  return (i >= 0 ? m.slice(0, i) : m).slice(0, MAX);
};

/**
 * Loggable view of an unknown error. Never includes Drizzle's query text/params (they carry bound
 * values: RUCs, names, XML) nor pg `detail` (echoes key values): for Drizzle errors only the driver
 * message plus pg `code`/`constraint`. The stack is omitted in production and for Drizzle errors.
 */
export function safeErrorInfo(err: unknown): { errName: string; errorMessage: string; stack?: string } {
  if (!(err instanceof Error)) return { errName: "unknown", errorMessage: String(err).slice(0, 200) };
  const e = err as Error & { query?: unknown; params?: unknown; cause?: unknown };
  if (typeof e.query === "string" && Array.isArray(e.params) && e.cause !== undefined) {
    const c = e.cause as { message?: unknown; code?: unknown; constraint?: unknown; constraint_name?: unknown };
    const parts = [typeof c?.message === "string" ? scrub(c.message) : "query failed"];
    if (c?.code) parts.push(`code=${String(c.code)}`);
    const constraint = c?.constraint ?? c?.constraint_name;
    if (constraint) parts.push(`constraint=${String(constraint)}`);
    return { errName: e.constructor?.name ?? e.name, errorMessage: parts.join(" ") };
  }
  return {
    errName: e.name,
    errorMessage: scrub(e.message),
    ...(process.env.NODE_ENV !== "production" && e.stack && { stack: e.stack.split("\nparams:")[0] }),
  };
}
