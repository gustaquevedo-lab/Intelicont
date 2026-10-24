import { XMLParser, XMLValidator } from "fast-xml-parser";
import { assertMoney, err, ok, type Result } from "@intelicont/core";

export type SifenDocument = {
  cdc: string;
  docType: "invoice" | "credit_note" | "debit_note" | "self_invoice" | "remito";
  timbrado: string;
  number: string; // EEE-PPP-NNNNNNN
  issueDate: string; // YYYY-MM-DD
  currency: string;
  condition: "cash" | "credit";
  issuer: { ruc: string; dv: number; name: string };
  receiver: { ruc: string; dv: number | null; name: string };
  gravado10: number; // IVA-included gross (dSub10)
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
  lines: {
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    ivaRate: 10 | 5 | 0;
  }[];
  isElectronic: true;
};

// shortcut: only DE types 1 (factura), 4 (autofactura), 5/6 (NC/ND), 7 (remito); others return err
const DOC_TYPES: Record<string, SifenDocument["docType"]> = {
  "1": "invoice",
  "4": "self_invoice",
  "5": "credit_note",
  "6": "debit_note",
  "7": "remito",
};

// removeNSPrefix drops `xsi:`-style prefixes; the default xmlns lives in attributes we ignore.
const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false, // keep every value a string (leading zeros, 44-digit CDC)
  isArray: (name) => name === "gCamItem",
});

type Node = Record<string, any>;

class Missing extends Error {}
const required = (v: unknown, tag: string): string => {
  const s = str(v);
  if (!s) throw new Missing(`Missing required field: ${tag}`);
  return s;
};

const money = (v: unknown): number => assertMoney(Math.round(Number(v ?? 0)));
const quantity = (v: unknown): number => {
  const n = Number(v);
  if (v == null || !Number.isFinite(n)) throw new Missing(`Invalid quantity: ${str(v)}`);
  return n;
};
const str = (v: unknown): string => (v == null ? "" : String(v).trim());

export function parseSifenDE(xml: string): Result<SifenDocument, string> {
  try {
    const valid = XMLValidator.validate(xml);
    if (valid !== true) return err(`Malformed XML: ${valid.err.msg}`);
    const root = parser.parse(xml) as Node;
    const rde: Node | undefined = root?.rLoteDE?.rDE ?? root?.rDE;
    const de: Node | undefined = rde?.DE;
    if (!de) return err("Not a SIFEN DE document");

    const docType = DOC_TYPES[str(de.gTimb?.iTiDE)];
    if (!docType) return err(`Unsupported document type: ${str(de.gTimb?.iTiDE)}`);

    const gen: Node = de.gDatGralOpe ?? {};
    const tim: Node = de.gTimb;
    const tot: Node = de.gTotSub ?? {};
    const items: Node[] = de.gDtipDE?.gCamItem ?? [];

    return ok({
      cdc: str(de["@_Id"]),
      docType,
      timbrado: str(tim.dNumTim),
      number: `${str(tim.dEst)}-${str(tim.dPunExp)}-${str(tim.dNumDoc)}`,
      issueDate: str(gen.dFeEmiDE).slice(0, 10), // string slice, never Date (timezone safe)
      currency: str(gen.gOpeCom?.cMoneOpe),
      condition: str(de.gDtipDE?.gCamCond?.iCondOpe) === "2" ? "credit" : "cash",
      issuer: {
        ruc: required(gen.gEmis?.dRucEm, "dRucEm"),
        dv: Number(required(gen.gEmis?.dDVEmi, "dDVEmi")),
        name: str(gen.gEmis?.dNomEmi),
      },
      receiver: {
        ruc: str(gen.gDatRec?.dRucRec),
        dv: str(gen.gDatRec?.dDVRec) ? Number(gen.gDatRec.dDVRec) : null,
        name: str(gen.gDatRec?.dNomRec),
      },
      gravado10: money(tot.dSub10),
      gravado5: money(tot.dSub5),
      exento: money(tot.dSubExe),
      iva10: money(tot.dIVA10),
      iva5: money(tot.dIVA5),
      total: money(required(tot.dTotGralOpe, "dTotGralOpe")),
      lines: items.map((it) => ({
        code: str(it.dCodInt),
        description: str(it.dDesProSer),
        quantity: quantity(it.dCantProSer),
        unitPrice: money(it.gValorItem?.dPUniProSer),
        amount: money(it.gValorItem?.gValorRestaItem?.dTotOpeItem),
        ivaRate: ([10, 5].includes(Number(it.gCamIVA?.dTasaIVA)) ? Number(it.gCamIVA.dTasaIVA) : 0) as 10 | 5 | 0,
      })),
      isElectronic: true,
    });
  } catch (e) {
    if (e instanceof Missing) return err(e.message);
    return err(e instanceof Error ? e.message : "Invalid XML");
  }
}
