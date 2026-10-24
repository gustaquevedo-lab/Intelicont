// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isTwoFactorRequired, redirectIfTwoFactorRequired } from "@/lib/two-factor";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { PREVIEW_ROOTS, NAV_GROUPS, isPreviewPath, visibleNavGroups } from "@/lib/nav-config";
import { isSwitcherShortcut, nextIndex, switcherAction } from "@/components/entity-switcher";

const forbidden2fa = { message: "2FA requerido", data: { code: "FORBIDDEN" } };

describe("isTwoFactorRequired", () => {
  it("matches the FORBIDDEN '2FA requerido' error", () => {
    expect(isTwoFactorRequired(forbidden2fa)).toBe(true);
  });
  it("ignores other errors", () => {
    expect(isTwoFactorRequired({ message: "2FA requerido", data: { code: "UNAUTHORIZED" } })).toBe(false);
    expect(isTwoFactorRequired({ message: "Empresa no accesible", data: { code: "FORBIDDEN" } })).toBe(false);
    expect(isTwoFactorRequired(new Error("2FA requerido"))).toBe(false);
    expect(isTwoFactorRequired(null)).toBe(false);
    expect(isTwoFactorRequired("2FA requerido")).toBe(false);
  });
  it("redirects once, and never from the 2FA page itself", () => {
    const calls: string[] = [];
    const at = (pathname: string) => ({ pathname, assign: (u: string) => void calls.push(u) });
    expect(redirectIfTwoFactorRequired(forbidden2fa, at("/asientos"))).toBe(true);
    expect(redirectIfTwoFactorRequired(forbidden2fa, at("/seguridad/2fa"))).toBe(false);
    expect(redirectIfTwoFactorRequired(new Error("x"), at("/asientos"))).toBe(false);
    expect(calls).toEqual(["/seguridad/2fa"]);
  });
});

describe("nav-config", () => {
  const paths = (show: boolean) => visibleNavGroups(show).flatMap((g) => g.items.map((i) => i.path));
  it("hides preview items unless the flag is on", () => {
    expect(paths(false)).not.toContain("/banco");
    expect(paths(false)).not.toContain("/impuestos");
    expect(paths(false)).toContain("/documentos/nuevo");
    expect(paths(false)).toContain("/terceros");
    expect(paths(true)).toEqual(expect.arrayContaining(["/banco", "/impuestos", "/reportes", "/sifen/historial"]));
  });
  it("shows every item with the flag on and no preview item without it", () => {
    expect(paths(true)).toHaveLength(NAV_GROUPS.flatMap((g) => g.items).length);
    expect(visibleNavGroups(false).flatMap((g) => g.items).some((i) => i.preview)).toBe(false);
  });
  it("flags preview pages and their sub-pages, but not the real ones", () => {
    for (const p of ["/activos", "/banco", "/banco/conciliacion", "/cierre", "/cobros-pagos", "/cuentas-corrientes", "/rg90", "/multimoneda", "/portal", "/documentos", "/importar", "/impuestos", "/reportes", "/reportes/eeff", "/sifen/historial", "/fiscal/formularios"]) {
      expect(isPreviewPath(p), p).toBe(true);
    }
    expect(isPreviewPath("/sifen/emitir")).toBe(true);
    for (const p of ["/", "/documentos/nuevo", "/terceros", "/sifen", "/asientos", "/asientos/nuevo", "/asientos/6f1c2b1e-8d3a-4c55-9b0e-0a1b2c3d4e5f", "/auditoria", "/fiscal/formulario-104", "/bancos-x"]) {
      expect(isPreviewPath(p), p).toBe(false);
    }
  });
});

describe("entity switcher keys", () => {
  const key = (k: string, extra: Partial<Parameters<typeof isSwitcherShortcut>[0]> = {}) =>
    ({ key: k, ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, target: null, ...extra });
  it("opens on Ctrl/Cmd+E outside inputs only", () => {
    expect(isSwitcherShortcut(key("e"))).toBe(true);
    expect(isSwitcherShortcut(key("E", { ctrlKey: false, metaKey: true }))).toBe(true);
    expect(isSwitcherShortcut(key("e", { ctrlKey: false }))).toBe(false);
    expect(isSwitcherShortcut(key("e", { shiftKey: true }))).toBe(false);
    expect(isSwitcherShortcut(key("e", { target: { tagName: "INPUT" } as unknown as EventTarget }))).toBe(false);
    expect(isSwitcherShortcut(key("e", { target: { tagName: "DIV", isContentEditable: true } as unknown as EventTarget }))).toBe(false);
    expect(isSwitcherShortcut(key("e", { target: { tagName: "DIV" } as unknown as EventTarget }))).toBe(true);
  });
  it("moves the highlight with arrows and wraps", () => {
    expect(nextIndex(0, "ArrowDown", 3)).toBe(1);
    expect(nextIndex(2, "ArrowDown", 3)).toBe(0);
    expect(nextIndex(0, "ArrowUp", 3)).toBe(2);
    expect(nextIndex(0, "a", 3)).toBeNull();
    expect(nextIndex(0, "ArrowDown", 0)).toBeNull();
  });
});

describe("switcherAction", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("Enter selects the highlighted entity after arrow navigation", () => {
    let i = 0;
    for (const k of ["ArrowDown", "ArrowDown"]) {
      const a = switcherAction(i, k, list);
      expect(a?.type).toBe("move");
      i = (a as { index: number }).index;
    }
    expect(switcherAction(i, "Enter", list)).toEqual({ type: "select", entity: list[2] });
  });
  it("Escape closes, other keys do nothing, Enter on an empty list closes", () => {
    expect(switcherAction(0, "Escape", list)).toEqual({ type: "close" });
    expect(switcherAction(0, "x", list)).toBeNull();
    expect(switcherAction(0, "Enter", [])).toEqual({ type: "close" });
  });
});

describe("no real page links to a preview route", () => {
  const appDir = path.resolve(__dirname, "../app");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const full = path.join(dir, f);
      return statSync(full).isDirectory() ? files(full) : /\.tsx?$/.test(f) ? [full] : [];
    });
  const routeOf = (f: string) => "/" + path.relative(appDir, path.dirname(f)).split(path.sep).filter((s) => !/^\(.*\)$/.test(s)).join("/");
  const hits = (src: string) =>
    [...src.matchAll(/(?:href=|href:|push\(|replace\(|link:)\s*[{(]?\s*[`"'](\/[^`"'?#$]*)/g)].map((m) => m[1].replace(/\/$/, "") || "/");
  const inPreview = (p: string) => PREVIEW_ROOTS.some((r) => p === r || p.startsWith(`${r}/`)) && !p.startsWith("/documentos/nuevo");

  it("finds links to preview routes only inside preview pages", () => {
    const bad: string[] = [];
    for (const f of files(appDir)) {
      if (isPreviewPath(routeOf(f))) continue;
      for (const h of hits(readFileSync(f, "utf8"))) if (inPreview(h)) bad.push(`${path.relative(appDir, f)} -> ${h}`);
    }
    expect(bad).toEqual([]);
  });
});

