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

import { createLogger } from "@/lib/logger";
import { router, publicProcedure, protectedProcedure, z } from "@/trpc/trpc";

const testRouter = router({
  ok: publicProcedure.input(z.object({ entityId: z.string().optional(), xml: z.string().optional() })).query(() => "done"),
  bad: publicProcedure.mutation(() => { throw new TRPCError({ code: "BAD_REQUEST", message: "entrada inválida" }); }),
  boom: publicProcedure.query(() => { throw new Error("db exploded"); }),
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
});
