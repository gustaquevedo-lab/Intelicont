import { describe, expect, it } from "vitest";
import { TABLA_4, docCodeFromType, isSupportedInRegistro } from "@intelicont/ledger/registro-codes";

describe("registro-codes", () => {
  it("docCodeFromType maps types to Tabla 4 codes", () => {
    expect(docCodeFromType("invoice", "issued")).toBe(109);
    expect(docCodeFromType("credit_note", "received")).toBe(110);
    expect(docCodeFromType("debit_note", "issued")).toBe(111);
    expect(docCodeFromType("self_invoice", "received")).toBe(101);
    expect(docCodeFromType("import", "received")).toBe(107);
    expect(docCodeFromType("remito", "issued")).toBeNull();
    expect(docCodeFromType("receipt", "issued")).toBeNull();
  });

  it("Tabla 4 has the official 23 codes", () => {
    const codes = Object.keys(TABLA_4).map(Number);
    expect(codes).toHaveLength(23);
    expect(codes).toEqual([...Array.from({ length: 12 }, (_, i) => 101 + i), ...Array.from({ length: 11 }, (_, i) => 201 + i)]);
  });

  it("isSupportedInRegistro respects the register type", () => {
    expect(isSupportedInRegistro(109, "ventas")).toBe(true);
    expect(isSupportedInRegistro(101, "ventas")).toBe(false);
    expect(isSupportedInRegistro(101, "compras")).toBe(true);
    expect(isSupportedInRegistro(107, "ventas")).toBe(false);
    expect(isSupportedInRegistro(201, "compras")).toBe(false);
    expect(isSupportedInRegistro(999, "compras")).toBe(false);
  });
});
