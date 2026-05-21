/**
 * Rule-Based AI Provider — InteliCont
 *
 * Deterministic journal proposal based on DNIT account-code mapping rules.
 * Zero cost, zero latency, zero external dependency.
 * Works as fallback when no LLM is configured.
 *
 * Rules follow the DNIT standard chart of accounts (plan de cuentas CONPLA-PY).
 *
 * Buyer perspective (compra):
 *   DR  Compras / Gasto (4.x / 5.x)
 *   DR  IVA Crédito Fiscal (1.1.3.x)
 *   CR  Cuentas a Pagar / Caja (2.1.1.x / 1.1.1.x)
 *
 * Seller perspective (venta):
 *   DR  Cuentas a Cobrar / Caja (1.1.2.x)
 *   CR  Ingresos por Ventas (4.x)
 *   CR  IVA Débito Fiscal (2.1.4.x)
 */

import type { AIProvider, AIProviderInput, JournalProposal, ProposedLine, AccountHint } from "./types";

// ─── Account code patterns for lookup ────────────────────────────────────────

const PATTERNS = {
  // Assets
  caja:            /^1\.1\.1\./,
  cuentasCobrar:   /^1\.1\.2\./,
  ivaCredito:      /^1\.1\.3\./,
  // Liabilities
  cuentasPagar:    /^2\.1\.1\./,
  ivaDebito:       /^2\.1\.4\./,
  // Income
  ventas:          /^4\./,
  // Expenses
  compras:         /^5\./,
  gastosGenerales: /^6\./,
};

function find(accounts: AccountHint[], pattern: RegExp): AccountHint | undefined {
  return accounts.find((a) => pattern.test(a.code));
}

function findByCode(accounts: AccountHint[], code: string): AccountHint | undefined {
  return accounts.find((a) => a.code === code);
}

function makeLines(
  accounts: AccountHint[],
  entries: Array<{
    codePattern?: RegExp;
    exactCode?:   string;
    fallbackName: string;
    fallbackCode: string;
    debit:        number;
    credit:       number;
    description:  string;
  }>
): ProposedLine[] {
  return entries.map((e) => {
    const acct = e.exactCode
      ? (findByCode(accounts, e.exactCode) ?? find(accounts, e.codePattern ?? /^$/))
      : find(accounts, e.codePattern ?? /^$/);

    return {
      accountId:   acct?.id ?? null,
      accountCode: acct?.code ?? e.fallbackCode,
      accountName: acct?.name ?? e.fallbackName,
      debit:       e.debit,
      credit:      e.credit,
      description: e.description,
    };
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class RulesProvider implements AIProvider {
  readonly name  = "rules";
  readonly model = null;

  async propose(input: AIProviderInput): Promise<JournalProposal> {
    const {
      docType, issuerName, total, iva10, iva5, ivaExento, subtotal,
      currency, docNumber, perspective, accounts,
    } = input;

    const docLabel = docNumber ? `${docType} ${docNumber}` : docType;
    const netAmount = total - iva10 - iva5;  // base before IVA

    let lines: ProposedLine[];
    let reasoning: string;

    if (perspective === "buyer") {
      // ── Compra / gasto ─────────────────────────────────────────────────────
      const baseAmount = netAmount > 0 ? netAmount : subtotal;

      lines = makeLines(accounts, [
        {
          codePattern:  PATTERNS.compras,
          fallbackCode: "5.1.1",
          fallbackName: "Compras / Gastos",
          debit:        baseAmount,
          credit:       0,
          description:  `${docLabel} - ${issuerName}`,
        },
        ...(iva10 > 0 ? [{
          codePattern:  PATTERNS.ivaCredito,
          fallbackCode: "1.1.3.1",
          fallbackName: "IVA Crédito Fiscal 10%",
          debit:        iva10,
          credit:       0,
          description:  `IVA CF 10% - ${docLabel}`,
        }] : []),
        ...(iva5 > 0 ? [{
          codePattern:  PATTERNS.ivaCredito,
          fallbackCode: "1.1.3.2",
          fallbackName: "IVA Crédito Fiscal 5%",
          debit:        iva5,
          credit:       0,
          description:  `IVA CF 5% - ${docLabel}`,
        }] : []),
        {
          codePattern:  PATTERNS.cuentasPagar,
          fallbackCode: "2.1.1.1",
          fallbackName: "Proveedores a Pagar",
          debit:        0,
          credit:       total,
          description:  `${docLabel} - ${issuerName}`,
        },
      ]);

      reasoning = `Compra registrada: neto ${currency} ${baseAmount.toLocaleString("es-PY")} + IVA CF ${currency} ${(iva10 + iva5).toLocaleString("es-PY")} = total ${currency} ${total.toLocaleString("es-PY")} a pagar.`;

    } else {
      // ── Venta / ingreso ────────────────────────────────────────────────────
      const ingresoBase = netAmount > 0 ? netAmount : subtotal;

      lines = makeLines(accounts, [
        {
          codePattern:  PATTERNS.cuentasCobrar,
          fallbackCode: "1.1.2.1",
          fallbackName: "Clientes a Cobrar",
          debit:        total,
          credit:       0,
          description:  `${docLabel}`,
        },
        {
          codePattern:  PATTERNS.ventas,
          fallbackCode: "4.1.1",
          fallbackName: "Ingresos por Ventas",
          debit:        0,
          credit:       ingresoBase,
          description:  `Venta - ${docLabel}`,
        },
        ...(iva10 > 0 ? [{
          codePattern:  PATTERNS.ivaDebito,
          fallbackCode: "2.1.4.1",
          fallbackName: "IVA Débito Fiscal 10%",
          debit:        0,
          credit:       iva10,
          description:  `IVA DF 10% - ${docLabel}`,
        }] : []),
        ...(iva5 > 0 ? [{
          codePattern:  PATTERNS.ivaDebito,
          fallbackCode: "2.1.4.2",
          fallbackName: "IVA Débito Fiscal 5%",
          debit:        0,
          credit:       iva5,
          description:  `IVA DF 5% - ${docLabel}`,
        }] : []),
      ]);

      reasoning = `Venta registrada: ingreso neto ${currency} ${ingresoBase.toLocaleString("es-PY")} + IVA DF ${currency} ${(iva10 + iva5).toLocaleString("es-PY")} = total a cobrar ${currency} ${total.toLocaleString("es-PY")}.`;
    }

    // Confidence: high if accounts were resolved, medium if fallbacks used
    const resolved = lines.filter((l) => l.accountId !== null).length;
    const confidence = lines.length > 0 ? Math.min(0.95, 0.6 + (resolved / lines.length) * 0.35) : 0.5;

    return { lines, confidence, reasoning, provider: "rules", model: null };
  }
}
