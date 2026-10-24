// @vitest-environment node
import { Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const sink = vi.hoisted(() => ({ lines: [] as string[] }));
vi.mock("@/lib/logger", async () => {
  const actual = await vi.importActual<typeof import("@/lib/logger")>("@/lib/logger");
  const dest = new Writable({ write(chunk, _enc, cb) { sink.lines.push(String(chunk)); cb(); } });
  return { ...actual, logger: actual.createLogger(dest) };
});

import { appRouter } from "@/trpc";
import { createLogger, safeErrorInfo } from "@/lib/logger";
import { getEmpresas } from "@/lib/actions";

const sessionMock = vi.hoisted(() => ({ error: undefined as unknown }));
vi.mock("@/lib/session", () => ({ requireUser: async () => { throw sessionMock.error; } }));

/** Shape of drizzle-orm 0.45 DrizzleQueryError: message embeds the bound params. */
function drizzleError() {
  const cause = Object.assign(new Error('duplicate key value violates unique constraint "entities_ruc_key"'), {
    code: "23505", constraint: "entities_ruc_key", detail: "Key (ruc)=(80014066) already exists.",
  });
  class DrizzleQueryError extends Error {
    query = "insert into entities (ruc, name) values ($1, $2)";
    params = ["80014066", "SECRET NAME"];
    constructor(public override cause: Error) {
      super("Failed query: insert into entities (ruc, name) values ($1, $2)\nparams: 80014066,SECRET NAME");
      this.name = "Error";
    }
  }
  return new DrizzleQueryError(cause);
}
import { router, publicProcedure, protectedProcedure, z } from "@/trpc/trpc";

const testRouter = router({
  ok: publicProcedure.input(z.object({ entityId: z.string().optional(), xml: z.string().optional() })).query(() => "done"),
  bad: publicProcedure.mutation(() => { throw new TRPCError({ code: "BAD_REQUEST", message: "entrada inválida" }); }),
  boom: publicProcedure.query(() => { throw new Error("db exploded"); }),
  zod: publicProcedure.input(z.object({ ruc: z.string().regex(/^\\d+$/) })).query(() => 1),
  dbFail: publicProcedure.query(() => { throw drizzleError(); }),
  guarded: protectedProcedure.query(() => "never"),
});
const lines = () => sink.lines.map((l) => JSON.parse(l) as Record<string, unknown>);
const caller = (ctx: { userId?: string } = {}) => testRouter.createCaller({ requestId: "req-1", ...ctx });

afterEach(() => { sink.lines.length = 0; vi.unstubAllEnvs(); });

describe("structured logs", () => {
  it("a successful procedure logs requestId, path, type and duration", async () => {
    await caller({ userId: "u1" }).ok({});
    expect(lines()).toHaveLength(1);
    expect(lines()[0]).toMatchObject({ level: 30, msg: "trpc", service: "intelicont-web", requestId: "req-1", userId: "u1", path: "ok", type: "query", ok: true });
    expect(typeof lines()[0]!.durationMs).toBe("number");
  });

  it("the entityId is logged only when it is a UUID in the input", async () => {
    const id = "6f1c2a5e-8b7d-4c1e-9a3b-0d2e4f6a8b10";
    await caller().ok({ entityId: id });
    await caller().ok({ entityId: "not-a-uuid" });
    expect(lines()[0]!.entityId).toBe(id);
    expect(lines()[1]).not.toHaveProperty("entityId");
  });

  it("inputs are never logged", async () => {
    await caller().ok({ xml: "<rDE>SECRET-XML</rDE>", entityId: "80012345-6" });
    expect(sink.lines.join("")).not.toContain("SECRET-XML");
    expect(sink.lines.join("")).not.toContain("80012345-6");
  });

  it("a TRPCError BAD_REQUEST logs a warn line with its code", async () => {
    await expect(caller().bad()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(lines()[0]).toMatchObject({ level: 40, ok: false, code: "BAD_REQUEST", errorMessage: "entrada inválida", type: "mutation" });
  });

  it("an unexpected error logs an error line without leaking the stack in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(caller().boom()).rejects.toThrow("db exploded");
    expect(lines()[0]).toMatchObject({ level: 50, ok: false, code: "INTERNAL_SERVER_ERROR", errName: "Error", errorMessage: "db exploded" });
    expect(lines()[0]).not.toHaveProperty("stack");
    vi.stubEnv("NODE_ENV", "development");
    await expect(caller().boom()).rejects.toThrow();
    expect(lines()[1]).toHaveProperty("stack");
  });

  it("an unauthenticated call logs without userId", async () => {
    await expect(caller().guarded()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(lines()[0]).toMatchObject({ level: 40, code: "UNAUTHORIZED", requestId: "req-1", path: "guarded" });
    expect(lines()[0]).not.toHaveProperty("userId");
  });

  it("LOG_LEVEL controls which lines are written", () => {
    const out: string[] = [];
    const dest = new Writable({ write(c, _e, cb) { out.push(String(c)); cb(); } });
    vi.stubEnv("LOG_LEVEL", "warn");
    const log = createLogger(dest);
    log.info("hidden");
    log.warn("shown");
    expect(out).toHaveLength(1);
    expect(JSON.parse(out[0]!)).toMatchObject({ msg: "shown" });
  });

  it("redact removes cookies and tokens", () => {
    const out: string[] = [];
    const dest = new Writable({ write(c, _e, cb) { out.push(String(c)); cb(); } });
    createLogger(dest).info({ req: { headers: { cookie: "sid=abc123" } }, body: { password: "hunter2", token: "tok-9", xml: "<x/>" } }, "x");
    const text = out.join("");
    for (const secret of ["abc123", "hunter2", "tok-9", "<x/>"]) expect(text).not.toContain(secret);
    expect(text).toContain("[redacted]");
  });

  it("a failing query never logs its SQL parameters", async () => {
    await expect(caller().dbFail()).rejects.toBeDefined();
    const text = sink.lines.join("");
    for (const leak of ["SECRET NAME", "80014066", "params:"]) expect(text).not.toContain(leak);
    expect(lines()[0]).toMatchObject({ level: 50, code: "INTERNAL_SERVER_ERROR" });
    expect(text).toContain("23505");
    expect(lines()[0]).not.toHaveProperty("stack");
  });

  it("safeErrorInfo scrubs params from plain errors", () => {
    const info = safeErrorInfo(new Error("boom\nparams: 80014066,SECRET NAME"));
    expect(info.errorMessage).toBe("boom");
    expect(JSON.stringify(info)).not.toContain("SECRET");
    expect(safeErrorInfo(new Error("x".repeat(900))).errorMessage).toHaveLength(500);
    expect(safeErrorInfo("plain")).toMatchObject({ errName: "unknown", errorMessage: "plain" });
  });

  it("safeErrorInfo omits the stack for Drizzle errors and keeps it in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(safeErrorInfo(drizzleError())).not.toHaveProperty("stack");
    expect(safeErrorInfo(new Error("x"))).toHaveProperty("stack");
    vi.stubEnv("NODE_ENV", "production");
    expect(safeErrorInfo(new Error("x"))).not.toHaveProperty("stack");
  });

  it("a zod validation failure logs paths and codes but not values", async () => {
    await expect(caller().zod({ ruc: "80014066-SECRETVALUE" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const text = sink.lines.join("");
    expect(text).not.toContain("SECRETVALUE");
    expect(lines()[0]).toMatchObject({ level: 40, code: "BAD_REQUEST", issues: [{ path: "ruc", code: "invalid_format" }] });
  });

  it("scoped skips Next redirect errors and logs other failures", async () => {
    sessionMock.error = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/login;307;" });
    await expect(getEmpresas()).rejects.toBe(sessionMock.error);
    expect(lines()).toHaveLength(0);
    sessionMock.error = new Error("no session");
    await expect(getEmpresas()).rejects.toThrow("no session");
    expect(lines()[0]).toMatchObject({ level: 40, msg: "action failed", errorMessage: "no session" });
  });

  it("redact covers a top-level headers.cookie", () => {
    const out: string[] = [];
    createLogger(new Writable({ write(c, _e, cb) { out.push(String(c)); cb(); } })).info({ headers: { cookie: "sid=zzz", "set-cookie": "s=qqq" } }, "x");
    expect(out.join("")).not.toMatch(/zzz|qqq/);
  });

  it("pg invalid input syntax messages do not echo the value", () => {
    const e = drizzleError();
    e.cause = new Error('invalid input syntax for type uuid: "80014066-SECRET"');
    const info = safeErrorInfo(e);
    expect(info.errorMessage).toBe("invalid input syntax for type uuid");
    expect(JSON.stringify(info)).not.toContain("SECRET");
  });

  it("driver messages with Key (...) details are cut", () => {
    const e = drizzleError();
    e.cause = Object.assign(new Error("duplicate key value Key (ruc)=(80014066) already exists"), { code: "23505" });
    const info = safeErrorInfo(e);
    expect(JSON.stringify(info)).not.toContain("80014066");
    e.cause = new Error("x".repeat(500));
    expect(safeErrorInfo(e).errorMessage.length).toBeLessThanOrEqual(200);
  });
});

describe("client error shape", () => {
  // The formatter runs in the fetch adapter, so go through it for the JSON the browser sees.
  const call = async (path: string) => {
    const { fetchRequestHandler } = await import("@trpc/server/adapters/fetch");
    const res = await fetchRequestHandler({ endpoint: "/t", req: new Request(`http://x/t/${path}`), router: testRouter, createContext: () => ({ requestId: "abcd1234-0000" }) });
    return (await res.json()) as { error: { message: string; data: Record<string, unknown> } };
  };

  it("internal errors are masked for the client and carry a requestId", async () => {
    const { error } = await call("boom");
    expect(error.message).toBe("Error interno del servidor");
    expect(error.data.requestId).toBe("abcd1234-0000");
    expect(error.data).not.toHaveProperty("stack");
  });

  it("non-internal errors keep their message", async () => {
    const { error } = await call("guarded");
    expect(error.message).toBe("UNAUTHORIZED");
    expect(error.data).not.toHaveProperty("requestId");
  });

  it("a DrizzleQueryError never reaches the client message", async () => {
    const { error } = await call("dbFail");
    expect(JSON.stringify(error)).not.toMatch(/SECRET NAME|80014066|params:|Failed query/);
  });
});
