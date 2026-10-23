// @vitest-environment node
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { buildRegistro, zipRegistro, type RegistroDoc } from "@intelicont/ledger/registro";

// Rows from the ANEXOS of "Especificación Técnica para registro de comprobantes en Marangatu" (June 2021).
// Ventas: the CSV example verbatim. Compras: the TXT example's values joined with the CSV example's ';'.
const VENTAS_EXAMPLE = "1;11;80024627;MINISTERIO DE HACIENDA;109;05/05/2021;11138251;001-002-0000250;3630000;0;0;3630000;1;N;S;N;N;;";
const COMPRAS_EXAMPLE = "2;11;80024627;MINISTERIO DE HACIENDA;109;05/05/2021;11223369;001-002-0000250;100000;0;0;100000;1;N;S;S;N;N;;";

let seq = 0;
const doc = (o: Partial<RegistroDoc> = {}): RegistroDoc => ({
  documentId: `d${++seq}`, side: "ventas", docCode: 109, counterpartyIdType: 11, counterpartyId: "80024627",
  counterpartyName: "MINISTERIO DE HACIENDA", issueDate: "2021-05-05", timbrado: "11138251", number: "001-002-0000250",
  gravado10: 3_630_000, gravado5: 0, exento: 0, total: 3_630_000, condition: "cash", foreignCurrency: false,
  imputaIva: true, imputaIre: false, imputaIrp: false, noImputa: false, relatedNumber: null, relatedTimbrado: null,
  isElectronic: false, ...o,
});
const compra = (o: Partial<RegistroDoc> = {}) => doc({
  side: "compras", timbrado: "11223369", gravado10: 100_000, total: 100_000, imputaIre: true, ...o,
});
const build = (docs: RegistroDoc[], month = 5, year = 2021) => buildRegistro({ ruc: "80000000", year, month, docs });
const lines = (r: ReturnType<typeof build>) => r.files.flatMap((f) => f.csv.split("\n").filter(Boolean));

/** The single entry of a ZIP written without data descriptors (fflate zipSync): entry count from the EOCD, name and data from the local header. */
function readZip(zip: Uint8Array) {
  const b = Buffer.from(zip);
  const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const entries = b.readUInt16LE(eocd + 10);
  expect(b.readUInt32LE(0)).toBe(0x04034b50);
  const method = b.readUInt16LE(8), size = b.readUInt32LE(18), nameLen = b.readUInt16LE(26), extraLen = b.readUInt16LE(28);
  const name = b.subarray(30, 30 + nameLen).toString("utf-8");
  const raw = b.subarray(30 + nameLen + extraLen, 30 + nameLen + extraLen + size);
  return { entries, name, content: (method === 8 ? inflateRawSync(raw) : raw).toString("utf-8") };
}

describe("registro de comprobantes (obligación 955)", () => {
  it("ventas row matches the official example", () => {
    const r = build([doc()]);
    expect(r.errors).toEqual([]);
    expect(r.files[0].csv).toBe(VENTAS_EXAMPLE + "\n");
  });

  it("compras row matches the official example", () => {
    const r = build([compra()]);
    expect(r.errors).toEqual([]);
    expect(r.files[0].csv).toBe(COMPRAS_EXAMPLE + "\n");
  });

  it("file name follows RUC_REG_MMAAAA_XXXXX with the RUC without DV", () => {
    const r = build([doc()], 1, 2021);
    expect(r.files).toEqual([]); // the doc is from May: not in January
    const jan = build([doc({ issueDate: "2021-01-25" })], 1, 2021);
    expect(jan.files.map((f) => f.name)).toEqual(["80000000_REG_012021_V0001"]);
    expect(jan.files[0].rows).toBe(1);
  });

  it("electronic documents are excluded and counted", () => {
    const r = build([doc(), doc({ isElectronic: true }), compra({ isElectronic: true }), doc({ isElectronic: true, issueDate: "2021-06-01" })]);
    expect(r.excluded).toEqual({ electronic: 2 });
    expect(lines(r)).toEqual([VENTAS_EXAMPLE]);
  });

  it("total different from the sum is reported as an error", () => {
    const r = build([doc({ documentId: "bad", total: 3_630_001 }), compra({ documentId: "bad2", exento: 5 })]);
    expect(r.files).toEqual([]);
    expect(r.errors.map((e) => e.documentId)).toEqual(["bad", "bad2"]);
    expect(r.errors[0].message).toMatch(/total/i);
  });

  it("credit note without related document is an error", () => {
    const nc = { docCode: 110, number: "001-002-0000251" };
    const r = build([
      doc({ ...nc, documentId: "none" }),
      doc({ ...nc, documentId: "noTimbrado", relatedNumber: "001-002-0000250" }),
      doc({ ...nc, documentId: "badNumber", relatedNumber: "1-2-250", relatedTimbrado: "11138251" }),
      compra({ docCode: 111, documentId: "nd" }),
      doc({ ...nc, documentId: "ok", relatedNumber: "001-002-0000250", relatedTimbrado: "11138251" }),
    ]);
    expect(r.errors.map((e) => e.documentId).sort()).toEqual(["badNumber", "nd", "noTimbrado", "none"]);
    expect(lines(r)).toEqual(["1;11;80024627;MINISTERIO DE HACIENDA;110;05/05/2021;11138251;001-002-0000251;3630000;0;0;3630000;1;N;S;N;N;001-002-0000250;11138251"]);
  });

  it("date before 2021-01-01 is an error unless the invoice is on credit", () => {
    const r = build([doc({ documentId: "cash", issueDate: "2020-12-31" }), doc({ documentId: "credit", issueDate: "2020-12-31", condition: "credit" })], 12, 2020);
    expect(r.errors.map((e) => e.documentId)).toEqual(["cash"]);
    expect(lines(r)).toEqual(["1;11;80024627;MINISTERIO DE HACIENDA;109;31/12/2020;11138251;001-002-0000250;3630000;0;0;3630000;2;N;S;N;N;;"]);
  });

  it("5001 rows split into two files V0001 and V0002", () => {
    const docs = Array.from({ length: 5001 }, (_, i) => doc({ number: `001-002-${String(i + 1).padStart(7, "0")}` }));
    const r = build(docs.reverse());
    expect(r.files.map((f) => [f.name, f.rows])).toEqual([["80000000_REG_052021_V0001", 5000], ["80000000_REG_052021_V0002", 1]]);
    expect(r.files[0].csv.split("\n").filter(Boolean)).toHaveLength(5000);
    expect(r.files[0].csv.split("\n")[0]).toContain(";001-002-0000001;");
    expect(r.files[1].csv).toContain(";001-002-0005001;");
  });

  it("counterparty name with delimiter or quotes is sanitized", () => {
    const r = build([doc({ counterpartyIdType: 13, counterpartyId: "AB;123", counterpartyName: ' EMPRESA; "LA\tUNIÓN"\r\nS.A. ' })]);
    expect(r.errors).toEqual([]);
    const fields = lines(r)[0].split(";");
    expect(fields).toHaveLength(19);
    expect(fields[2]).toBe("AB 123");
    expect(fields[3]).toBe("EMPRESA LA UNIÓN S.A.");
    const long = build([doc({ counterpartyIdType: 13, counterpartyName: "x".repeat(300) })]);
    expect(lines(long)[0].split(";")[3]).toHaveLength(250);
  });

  it("date 2026-08-09 is rendered 09/08/2026 without timezone shift", () => {
    const r = build([doc({ issueDate: "2026-08-09" })], 8, 2026);
    expect(lines(r)[0].split(";")[5]).toBe("09/08/2026");
    expect(r.files[0].name).toBe("80000000_REG_082026_V0001");
  });

  it("total-only codes report zeros and the total", () => {
    const r = build([
      compra({ docCode: 104, gravado10: 1_100_000, total: 1_100_000 }),
      compra({ docCode: 105, gravado10: 0, total: 50_000, number: "001-002-0000251" }),
      compra({ docCode: 101, counterpartyIdType: 12, counterpartyId: "1234567", counterpartyName: "", gravado10: 0, total: 70_000, number: "001-002-0000252" }),
    ]);
    expect(r.errors).toEqual([]);
    expect(lines(r).map((l) => l.split(";").slice(8, 12).join(";"))).toEqual(["0;0;0;1100000", "0;0;0;50000", "0;0;0;70000"]);
    // Ventas have no total-only exception in the spec: the total must equal the sum.
    expect(build([doc({ docCode: 105, gravado10: 0, total: 50_000 })]).errors).toHaveLength(1);
    expect(build([compra({ docCode: 104, gravado10: 0, total: 0 })]).errors).toHaveLength(1);
  });

  it("a document without any imputation is an error", () => {
    const r = build([doc({ documentId: "v", imputaIva: false }), compra({ documentId: "c", imputaIva: false, imputaIre: false })]);
    expect(r.files).toEqual([]);
    expect(r.errors.map((e) => e.documentId)).toEqual(["v", "c"]);
    expect(r.errors[0].message).toMatch(/imput/i);
  });

  it("noImputa requires another obligation", () => {
    const r = build([
      compra({ documentId: "alone", imputaIva: false, imputaIre: false, noImputa: true }),
      compra({ documentId: "ok", noImputa: true, number: "001-002-0000251" }),
    ]);
    expect(r.errors.map((e) => e.documentId)).toEqual(["alone"]);
    expect(lines(r)[0].split(";").slice(14, 18)).toEqual(["S", "S", "N", "S"]);
  });

  it("mixed ventas and compras keep 19 and 20 fields", () => {
    const r = build([compra({ issueDate: "2021-05-01" }), doc({ issueDate: "2021-05-31", foreignCurrency: true, imputaIrp: true })]);
    const [v, c] = lines(r);
    expect(v.split(";")).toHaveLength(19);
    expect(c.split(";")).toHaveLength(20);
    expect(v.startsWith("1;") && c.startsWith("2;")).toBe(true); // ventas first, regardless of date
    expect(v.split(";").slice(13, 17)).toEqual(["S", "S", "N", "S"]);
    expect(r.counts).toEqual({ ventas: 1, compras: 1 });
  });

  it("name is empty for RUC and cédula buyers", () => {
    // The spec does not require the name for RUC (11), cédula (12) and, on ventas, "sin nombre" (15):
    // an empty name is valid there; any other id type needs one.
    const r = build([
      doc({ documentId: "ruc", counterpartyName: "" }),
      doc({ documentId: "ci", counterpartyIdType: 12, counterpartyId: "1234567", counterpartyName: "  " }),
      doc({ documentId: "sn", counterpartyIdType: 15, counterpartyId: "X", counterpartyName: "" }),
      doc({ documentId: "pass", counterpartyIdType: 13, counterpartyId: "P123", counterpartyName: "" }),
      compra({ documentId: "snc", counterpartyIdType: 15, counterpartyId: "X", counterpartyName: "" }),
    ]);
    expect(r.errors.map((e) => e.documentId)).toEqual(["pass", "snc"]);
    expect(lines(r).map((l) => l.split(";").slice(1, 4).join(";")).sort()).toEqual(["11;80024627;", "12;1234567;", "15;X;"]);
  });

  it("zip contains a single entry named like the zip with the csv content", () => {
    const [file] = build([doc(), compra()]).files;
    const z = readZip(zipRegistro(file));
    expect(z.entries).toBe(1);
    expect(z.name).toBe("80000000_REG_052021_V0001.csv");
    expect(z.content).toBe(`${VENTAS_EXAMPLE}\n${COMPRAS_EXAMPLE}\n`);
  });
});
