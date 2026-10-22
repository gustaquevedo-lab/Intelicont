// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { parseSifenDE } from "@intelicont/ledger/sifen";
import { parseSifenXML } from "@/lib/sifen-parser";

const xml = readFileSync(
  path.resolve(__dirname, "../__fixtures__/sifen/fac_024-004-0049994.xml"),
  "utf-8",
);

function unwrap<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

describe("parseSifenDE (real v150 invoice)", () => {
  it("parses header, issuer, amounts and lines exactly", () => {
    const d = unwrap(parseSifenDE(xml));
    expect(d.cdc).toBe("01800140664024004004999422026080911264669314");
    expect(d.docType).toBe("invoice");
    expect(d.timbrado).toBe("16284685");
    expect(d.number).toBe("024-004-0049994");
    expect(d.issueDate).toBe("2026-08-09");
    expect(d.currency).toBe("PYG");
    expect(d.condition).toBe("cash");
    expect(d.issuer).toEqual({ ruc: "80014066", dv: 4, name: "SERVICIOS RAPIDOS DEL PARAGUAY S.A." });
    expect(d.receiver).toEqual({ ruc: "1234567", dv: 9, name: "CLIENTE DE PRUEBA" });
    expect(d.gravado10).toBe(58000);
    expect(d.gravado5).toBe(0);
    expect(d.exento).toBe(0);
    expect(d.iva10).toBe(5273);
    expect(d.iva5).toBe(0);
    expect(d.total).toBe(58000);
    expect(d.isElectronic).toBe(true);
    expect(d.lines).toHaveLength(2);
    expect(d.lines.map((l) => l.amount)).toEqual([12000, 46000]);
    expect(d.lines.every((l) => l.ivaRate === 10 && l.quantity === 1)).toBe(true);
    expect(d.lines[0]).toMatchObject({ code: "9450", description: "Recargo12Mil", unitPrice: 12000 });
  });

  it("keeps the date as a string even with a time at 23:59:59", () => {
    const d = unwrap(parseSifenDE(xml.replace("2026-08-09T12:22:07", "2026-08-09T23:59:59")));
    expect(d.issueDate).toBe("2026-08-09");
  });

  it("normalizes a single gCamItem and rounds decimals", () => {
    const single = xml.replace(/<gCamItem>[\s\S]*?<\/gCamItem>\s*(?=<gCamItem>)/, "");
    const d = unwrap(parseSifenDE(single.replace("46000.00000000</dTotOpeItem>", "45999.6000</dTotOpeItem>")));
    expect(d.lines).toHaveLength(1);
    expect(d.lines[0].amount).toBe(46000);
  });

  it("returns err for malformed XML", () => {
    for (const bad of ["<rLoteDE><rDE>", "not xml", ""]) {
      const r = parseSifenDE(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/^(Malformed XML|Not a SIFEN DE document)/);
    }
  });

  it("returns err for an unsupported document type", () => {
    const r = parseSifenDE(xml.replace("<iTiDE>1</iTiDE>", "<iTiDE>8</iTiDE>"));
    expect(r).toEqual({ ok: false, error: "Unsupported document type: 8" });
  });

  it("returns err when dTotGralOpe is missing", () => {
    const r = parseSifenDE(xml.replace(/<dTotGralOpe>.*?<\/dTotGralOpe>/, ""));
    expect(r).toEqual({ ok: false, error: "Missing required field: dTotGralOpe" });
  });

  it("returns err when issuer RUC or DV is missing", () => {
    expect(parseSifenDE(xml.replace(/<dDVEmi>.*?<\/dDVEmi>/, ""))).toEqual({ ok: false, error: "Missing required field: dDVEmi" });
    expect(parseSifenDE(xml.replace(/<dRucEm>.*?<\/dRucEm>/, ""))).toEqual({ ok: false, error: "Missing required field: dRucEm" });
  });

  it("gives receiver.dv null when dDVRec is absent", () => {
    const noDv = xml.replace(/<dDVRec>.*?<\/dDVRec>/, "");
    expect(unwrap(parseSifenDE(noDv)).receiver.dv).toBeNull();
    expect(parseSifenXML(noDv)!.receptor.ruc).toBe("1234567");
  });

  it("returns err on non-numeric quantity", () => {
    const r = parseSifenDE(xml.replace("<dCantProSer>1.0000</dCantProSer>", "<dCantProSer>abc</dCantProSer>"));
    expect(r).toEqual({ ok: false, error: "Invalid quantity: abc" });
  });

  it("maps credit condition and credit note type", () => {
    const d = unwrap(
      parseSifenDE(xml.replace("<iCondOpe>1</iCondOpe>", "<iCondOpe>2</iCondOpe>").replace("<iTiDE>1</iTiDE>", "<iTiDE>5</iTiDE>")),
    );
    expect(d.condition).toBe("credit");
    expect(d.docType).toBe("credit_note");
  });
});

describe("parseSifenXML adapter", () => {
  it("adapts the real invoice for the UI", () => {
    const inv = parseSifenXML(xml)!;
    expect(inv.cdc).toBe("01800140664024004004999422026080911264669314");
    expect(inv.numero).toBe("024-004-0049994");
    expect(inv.fechaEmision).toBe("2026-08-09");
    expect(inv.tipoDoc).toBe("factura");
    expect(inv.condicion).toBe("contado");
    expect(inv.emisor.ruc).toBe("80014066-4");
    expect(inv.receptor.ruc).toBe("1234567-9");
    expect(inv.montos).toMatchObject({ gravado10: 58000, iva10: 5273, totalIva: 5273, total: 58000 });
    expect(inv.items).toHaveLength(2);
  });

  it("returns null for invalid XML", () => {
    expect(parseSifenXML("not valid xml")).toBeNull();
    expect(parseSifenXML("")).toBeNull();
  });
});
