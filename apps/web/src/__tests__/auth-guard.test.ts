// @vitest-environment node
import { describe, expect, it } from "vitest";
import { guardRedirect } from "@/lib/auth-guard";

describe("guardRedirect", () => {
  const admin = { isAdmin: true, twoFactorEnabled: false };

  it("lets /login through without a session", () => {
    expect(guardRedirect("/login", null)).toBeNull();
  });
  it("sends anonymous users to /login", () => {
    expect(guardRedirect("/asientos", null)).toBe("/login");
    expect(guardRedirect("/seguridad/2fa", null)).toBe("/login");
  });
  it("forces admins without TOTP to enroll, without looping", () => {
    expect(guardRedirect("/", admin)).toBe("/seguridad/2fa");
    expect(guardRedirect("/seguridad/2fa", admin)).toBeNull();
  });
  it("lets admins with TOTP and non-admins through", () => {
    expect(guardRedirect("/", { ...admin, twoFactorEnabled: true })).toBeNull();
    expect(guardRedirect("/", { isAdmin: false, twoFactorEnabled: false })).toBeNull();
  });
});
