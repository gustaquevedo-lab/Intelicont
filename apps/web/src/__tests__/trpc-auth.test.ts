// @vitest-environment node
import { describe, expect, it } from "vitest";
import { appRouter } from "@/trpc";

describe("tRPC auth", () => {
  const anon = appRouter.createCaller({ requestId: "test" });

  it("rejects unauthenticated calls to protected procedures", async () => {
    await expect(anon.entities.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("health works without a session", async () => {
    await expect(anon.health()).resolves.toMatchObject({ status: "ok" });
  });
});
