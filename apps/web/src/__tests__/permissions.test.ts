import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the database module
vi.mock("@ledger/db/index", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
  setEntityContext: vi.fn(),
}));

describe("Permissions System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ROLE_PERMISSIONS", () => {
    it("should define correct permissions for admin role", async () => {
      const { getRolePermissions } = await import("@/lib/permissions");
      const permissions = getRolePermissions("admin");

      expect(permissions).toContain("read");
      expect(permissions).toContain("write");
      expect(permissions).toContain("admin");
      expect(permissions).toContain("audit");
      expect(permissions).toContain("close");
      expect(permissions).toContain("approve");
      expect(permissions).toContain("invite");
      expect(permissions).toContain("remove");
    });

    it("should define correct permissions for accountant role", async () => {
      const { getRolePermissions } = await import("@/lib/permissions");
      const permissions = getRolePermissions("accountant");

      expect(permissions).toContain("read");
      expect(permissions).toContain("write");
      expect(permissions).toContain("audit");
      expect(permissions).toContain("close");
      expect(permissions).toContain("approve");
      expect(permissions).not.toContain("admin");
      expect(permissions).not.toContain("invite");
      expect(permissions).not.toContain("remove");
    });

    it("should define correct permissions for assistant role", async () => {
      const { getRolePermissions } = await import("@/lib/permissions");
      const permissions = getRolePermissions("assistant");

      expect(permissions).toContain("read");
      expect(permissions).toContain("write");
      expect(permissions).not.toContain("admin");
      expect(permissions).not.toContain("audit");
      expect(permissions).not.toContain("close");
      expect(permissions).not.toContain("approve");
    });

    it("should define correct permissions for auditor role", async () => {
      const { getRolePermissions } = await import("@/lib/permissions");
      const permissions = getRolePermissions("auditor");

      expect(permissions).toContain("read");
      expect(permissions).toContain("audit");
      expect(permissions).not.toContain("write");
      expect(permissions).not.toContain("admin");
      expect(permissions).not.toContain("close");
      expect(permissions).not.toContain("approve");
    });

    it("should define correct permissions for client role", async () => {
      const { getRolePermissions } = await import("@/lib/permissions");
      const permissions = getRolePermissions("client");

      expect(permissions).toContain("read");
      expect(permissions).not.toContain("write");
      expect(permissions).not.toContain("admin");
      expect(permissions).not.toContain("audit");
      expect(permissions).not.toContain("close");
      expect(permissions).not.toContain("approve");
    });
  });

  describe("SoD (Segregation of Duties)", () => {
    it("should prevent creator from approving own document", async () => {
      const { checkSoD_createApprove } = await import("@/lib/permissions");

      await expect(
        checkSoD_createApprove("user-1", "user-1", "entity-1")
      ).rejects.toThrow("SoD violation");
    });

    it("should prevent closer from reopening own closed period", async () => {
      const { checkSoD_closeReopen } = await import("@/lib/permissions");

      await expect(
        checkSoD_closeReopen("user-1", "user-1", "entity-1")
      ).rejects.toThrow("SoD violation");
    });
  });
});
