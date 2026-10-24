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
