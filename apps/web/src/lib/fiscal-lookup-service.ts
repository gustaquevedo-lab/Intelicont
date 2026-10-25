/**
 * InteliCont Fiscal & Identity Lookup Engine (Paraguay)
 *
 * Connects directly to:
 * 1. DNIT Official RUC Database (2,020,504 registered taxpayers)
 * 2. Padrón Electoral Nacional (5,061,970 citizens with Cédula de Identidad)
 * 3. Local fallback with DNIT Modulo 11 check-digit verification
 */
import { execFile } from "child_process";
import fs from "fs";
import { promisify } from "util";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";

const execFileAsync = promisify(execFile);

const DNIT_DB_PATHS = [
  "/home/dev-server/apps/intelicont/data/dnit_rucs.db",
  "/Users/gustaquevedo/Library/CloudStorage/OneDrive-Personal/Dev/Intelicont/data/dnit_rucs.db",
  "./data/dnit_rucs.db",
];

const PADRON_DB_PATHS = [
  "/home/dev-server/apps/intelecciones/data/intellecciones.db",
  "/Users/gustaquevedo/Library/CloudStorage/OneDrive-Personal/Dev/Intelicont/data/intellecciones.db",
  "./data/intellecciones.db",
];

function getExistingPath(paths: string[]): string | null {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export interface TaxpayerLookupResult {
  rawInput: string;
  cleanDocument: string;
  ruc: string;
  baseRuc: string;
  dv: string;
  legalName: string;
  tradeName?: string;
  status: "ACTIVO" | "SUSPENSION_TEMPORAL" | "CANCELADO" | "BLOQUEADO" | "NO_REGISTRADO";
  type: "juridico" | "natural";
  city?: string;
  department?: string;
  source: "dnit_oficial" | "padron_nacional" | "algoritmo_mod11";
  validDv: boolean;
}

export async function lookupTaxpayer(inputDoc: string): Promise<TaxpayerLookupResult> {
  const raw = (inputDoc || "").trim();
  if (!raw) {
    throw new Error("El número de documento o RUC es requerido");
  }

  // Split into base and DV if provided (e.g. 80012345-0 or 1234567-8)
  let base = raw;
  let providedDv: string | null = null;

  if (raw.includes("-")) {
    const parts = raw.split("-");
    base = parts[0].replace(/\D/g, "");
    providedDv = parts[1].replace(/\D/g, "");
  } else {
    base = raw.replace(/\D/g, "");
  }

  const calculatedDv = String(mod11Dv(base));
  const effectiveDv = providedDv !== null && providedDv !== "" ? providedDv : calculatedDv;
  const validDv = providedDv === null || providedDv === calculatedDv;
  const isJuridico = base.startsWith("80") || base.length >= 8;
  const formattedRuc = `${base}-${effectiveDv}`;

  const defaultResult: TaxpayerLookupResult = {
    rawInput: raw,
    cleanDocument: base,
    ruc: formattedRuc,
    baseRuc: base,
    dv: effectiveDv,
    legalName: "",
    status: "NO_REGISTRADO",
    type: isJuridico ? "juridico" : "natural",
    source: "algoritmo_mod11",
    validDv,
  };

  // 1. Try DNIT Official RUC Database
  const dnitPath = getExistingPath(DNIT_DB_PATHS);
  if (dnitPath) {
    try {
      const query = `SELECT ruc, razon_social, dv, ruc_anterior, estado FROM rucs WHERE ruc = "${base}" LIMIT 1;`;
      const { stdout } = await execFileAsync("sqlite3", ["-json", dnitPath, query], { timeout: 1500 });
      const parsed = JSON.parse(stdout.trim() || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        const row = parsed[0];
        let statusNormalized: TaxpayerLookupResult["status"] = "ACTIVO";
        const rawStatus = (row.estado || "").toUpperCase();
        if (rawStatus.includes("CANCEL")) statusNormalized = "CANCELADO";
        else if (rawStatus.includes("SUSPEN")) statusNormalized = "SUSPENSION_TEMPORAL";
        else if (rawStatus.includes("BLOQ")) statusNormalized = "BLOQUEADO";

        return {
          rawInput: raw,
          cleanDocument: base,
          ruc: `${row.ruc}-${row.dv}`,
          baseRuc: row.ruc,
          dv: String(row.dv),
          legalName: (row.razon_social || "").trim(),
          tradeName: (row.razon_social || "").trim(),
          status: statusNormalized,
          type: row.ruc.startsWith("80") ? "juridico" : "natural",
          source: "dnit_oficial",
          validDv: true,
        };
      }
    } catch (err) {
      console.warn("[FiscalLookup] Error querying dnit_rucs.db:", err);
    }
  }

  // 2. If not found in DNIT or if looking up a Cédula (physical person), try Padrón Electoral
  const padronPath = getExistingPath(PADRON_DB_PATHS);
  if (padronPath && base.length <= 8) {
    try {
      const query = `SELECT ci, nombre, apellido, ciudad, departamento FROM electors WHERE ci = "${base}" LIMIT 1;`;
      const { stdout } = await execFileAsync("sqlite3", ["-json", padronPath, query], { timeout: 1500 });
      const parsed = JSON.parse(stdout.trim() || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        const row = parsed[0];
        const fullName = `${row.nombre || ""} ${row.apellido || ""}`.trim();
        return {
          rawInput: raw,
          cleanDocument: base,
          ruc: `${row.ci}-${calculatedDv}`,
          baseRuc: row.ci,
          dv: calculatedDv,
          legalName: fullName,
          tradeName: fullName,
          status: "ACTIVO",
          type: "natural",
          city: row.ciudad || undefined,
          department: row.departamento || undefined,
          source: "padron_nacional",
          validDv,
        };
      }
    } catch (err) {
      console.warn("[FiscalLookup] Error querying padron intellecciones.db:", err);
    }
  }

  return defaultResult;
}

export interface TimbradoVerifyResult {
  timbrado: string;
  valid: boolean;
  message: string;
  isExpired?: boolean;
  daysRemaining?: number;
}

export function verifyTimbrado(
  timbrado: string,
  options?: { validFrom?: string | Date; validTo?: string | Date; issueDate?: string | Date }
): TimbradoVerifyResult {
  const clean = (timbrado || "").trim();
  if (!clean) {
    return { timbrado: clean, valid: false, message: "El timbrado es obligatorio" };
  }

  if (!/^\d{8}$/.test(clean)) {
    return { timbrado: clean, valid: false, message: "El timbrado debe contener exactamente 8 dígitos numéricos" };
  }

  if (options?.validTo) {
    const toDate = new Date(options.validTo);
    const compareDate = options.issueDate ? new Date(options.issueDate) : new Date();

    if (compareDate.getTime() > toDate.getTime()) {
      return {
        timbrado: clean,
        valid: false,
        isExpired: true,
        message: `El timbrado ${clean} expiró el ${toDate.toLocaleDateString("es-PY")}`,
      };
    }

    const diffDays = Math.ceil((toDate.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      timbrado: clean,
      valid: true,
      isExpired: false,
      daysRemaining: diffDays,
      message: `Timbrado válido (vence en ${diffDays} días)`,
    };
  }

  return { timbrado: clean, valid: true, message: "Estructura de timbrado válida" };
}
