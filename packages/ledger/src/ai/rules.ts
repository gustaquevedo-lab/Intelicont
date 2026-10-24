import { DOC_LABELS, docEvidence, fmt, type AccountRef, type AIProvider, type Direction, type DocFacts, type Suggestion, type SuggestionLine } from "./provider";

/**
 * Accounting roles used by the PY rules. `code` is the reference chart's code (packages/ledger/db/seed.ts);
 * charts differ (the app's default chart nests codes differently), so a code only counts when its
 * name also fits the role, else the first postable account whose name matches is used.
 */
const ROLES = {
  inventory: { code: "1.2.01", label: "Mercaderías", match: /mercader/i },
  otherExpense: { code: "5.1.10", label: "Otros Gastos", match: /otros gastos|gastos varios/i },
  ivaCredit10: { code: "1.1.06", label: "IVA Crédito Fiscal", match: /iva cr[eé]dito/i },
  ivaCredit5: { code: "1.1.07", label: "IVA Crédito Fiscal 5%", match: /iva cr[eé]dito/i },
  suppliers: { code: "2.1.01", label: "Proveedores", match: /proveedor/i },
  cash: { code: "1.1.01", label: "Caja", match: /caja/i },
  customers: { code: "1.1.05", label: "Clientes", match: /cliente/i },
  sales: { code: "4.1.01", label: "Ventas", match: /venta/i },
  ivaDebit10: { code: "2.1.02", label: "IVA Débito Fiscal", match: /iva d[eé]bito/i },
  ivaDebit5: { code: "2.1.03", label: "IVA Débito Fiscal 5%", match: /iva d[eé]bito/i },
  // Liability only: an asset such as "Retenciones de IVA sufridas" must never receive the withholding credit.
  retentionsPayable: { code: "2.1.05", label: "Retenciones por Pagar", match: /retenciones?\s+(a|por)\s+pagar/i, loose: /retenci/i, nature: "liability" },
} as const;
type Role = keyof typeof ROLES;
type RoleDef = { code: string; label: string; match: RegExp; loose?: RegExp; nature?: string };

type Resolved = { account?: AccountRef; byName: boolean };

function resolve(role: Role, accounts: AccountRef[]): Resolved {
  const r: RoleDef = ROLES[role];
  const postable = accounts
    .filter((a) => a.allowsPosting && (!r.nature || a.nature === r.nature))
    .sort((a, b) => a.code.localeCompare(b.code));
  const exact = postable.find((a) => a.code === r.code && r.match.test(a.name));
  if (exact) return { account: exact, byName: false };
  const named = postable.find((a) => r.match.test(a.name)) ?? (r.loose && postable.find((a) => r.loose!.test(a.name)));
  return { account: named || undefined, byName: true };
}

/** Human label of a role's reference code (e.g. "2.1.05" -> "Retenciones por Pagar"), for missing-account messages. */
export function referenceLabel(code: string): string | undefined {
  return Object.values(ROLES).find((r) => r.code === code)?.label;
}

export type RuleOptions = {
  /** Purchase base lines (gravado / exento) go to this account instead of Mercaderías / Otros Gastos. */
  expenseAccount?: AccountRef;
  /** Purchase withholdings: one credit to Retenciones a Pagar each; the counterpart is reduced by their sum. */
  retentions?: { type: string; amount: number }[];
};

/** Deterministic PY accounting rules (port of the legacy `suggestJournalEntry`), integer amounts. */
export class RuleBasedProvider implements AIProvider {
  async suggestEntry(doc: DocFacts, accounts: AccountRef[], direction: Direction = "received", opts: RuleOptions = {}): Promise<Suggestion> {
    const sources = docEvidence(doc);
    if (doc.docType === "remito") {
      return { lines: [], confidence: 0, rationale: "Un remito no genera asiento contable.", sources, provider: "rules" };
    }

    const missing = new Set<string>();
    const found: string[] = [];
    let byName = false;
    const line = (role: Role, side: "debit" | "credit", amount: number, description: string): SuggestionLine => {
      const chosen = opts.expenseAccount && (role === "inventory" || role === "otherExpense") && direction === "received";
      const { account, byName: viaName } = chosen ? { account: opts.expenseAccount, byName: false } : resolve(role, accounts);
      if (!account) missing.add(`${ROLES[role].code} ${ROLES[role].label}`);
      else {
        byName ||= viaName;
        const note = `Cuenta ${account.code} ${account.name}${viaName ? " (por nombre)" : ""}`;
        if (!found.includes(note)) found.push(note);
      }
      return {
        accountId: account?.id ?? null,
        accountCode: account?.code ?? ROLES[role].code,
        debit: side === "debit" ? amount : 0,
        credit: side === "credit" ? amount : 0,
        description,
      };
    };

    const net10 = doc.gravado10 - doc.iva10;
    const net5 = doc.gravado5 - doc.iva5;
    const isSale = direction === "issued";
    const reverses = doc.docType === "credit_note"; // NC mirrors the original operation
    const cash = doc.condition === "cash";
    const ref = `${DOC_LABELS[doc.docType]} ${doc.number}`;
    // `main` = the side of the base operation (purchase: debit, sale: credit); the counterpart takes the other side.
    const baseSide = isSale ? "credit" : "debit";
    const flip = (s: "debit" | "credit") => (s === "debit" ? "credit" : "debit");
    const main = reverses ? flip(baseSide) : baseSide;
    const other = flip(main);
    const lines: SuggestionLine[] = [];
    const push = (role: Role, amount: number, description: string) => {
      if (amount > 0) lines.push(line(role, main, amount, description));
    };

    if (isSale) {
      push("sales", net10 + net5 + doc.exento, `Venta — ${ref}`);
      push("ivaDebit10", doc.iva10, `IVA 10% débito — ${ref}`);
      push("ivaDebit5", doc.iva5, `IVA 5% débito — ${ref}`);
    } else {
      push("inventory", net10, `Compra gravada 10% — ${ref}`);
      push("inventory", net5, `Compra gravada 5% — ${ref}`);
      push("otherExpense", doc.exento, `Compra exenta — ${ref}`);
      push("ivaCredit10", doc.iva10, `IVA 10% — ${ref}`);
      push("ivaCredit5", doc.iva5, `IVA 5% — ${ref}`);
    }
    const sum = lines.reduce((s, l) => s + l.debit + l.credit, 0);
    let withheld = 0;
    if (!isSale) {
      for (const r of opts.retentions ?? []) {
        if (r.amount <= 0) continue;
        withheld += r.amount;
        lines.push(line("retentionsPayable", other, r.amount, `Retención ${r.type.toUpperCase()} — ${ref}`));
      }
    }
    const counterRole: Role = cash ? "cash" : isSale ? "customers" : "suppliers";
    const counterpart = line(counterRole, other, sum - withheld, isSale ? `Cobro/a cobrar — ${ref}` : `Pago/a pagar ${doc.issuer.name} — ${ref}`);
    if (sum > 0) {
      if (isSale) lines.unshift(counterpart); // sale: receivable/cash first, like the legacy rules
      else lines.push(counterpart);
    }

    const op = isSale ? "venta" : "compra";
    const taxed = doc.iva10 + doc.iva5 > 0 ? "gravada" : "exenta";
    const rule = reverses
      ? `Regla: nota de crédito de ${op} (reversión) ${cash ? "al contado" : "a crédito"}`
      : `Regla: ${op} ${taxed} ${cash ? "al contado" : "a crédito"}`;

    let confidence = byName ? 0.9 : 0.95;
    const notes: string[] = [];
    if (doc.docType === "self_invoice") {
      confidence = Math.min(confidence, 0.75);
      notes.push("Autofactura: revisá las cuentas.");
    }
    if (missing.size > 0) {
      confidence = Math.min(confidence, 0.5);
      for (const m of missing) notes.push(`Falta la cuenta ${m} en el plan de cuentas: elegila.`);
    }
    if (sum !== doc.total) {
      confidence = Math.min(confidence, 0.6);
      notes.push(`El total del comprobante (${fmt(doc.total)}) no coincide con la suma de bases e IVA (${fmt(sum)}).`);
    }
    if (sum === 0) {
      confidence = 0;
      notes.push("El comprobante no tiene montos.");
    }

    return {
      lines,
      confidence,
      rationale: [`${rule.replace("Regla: ", "Asiento de ")} según reglas contables PY (IVA separado de la base).`, ...notes].join(" "),
      sources: [...sources, rule, ...found],
      provider: "rules",
    };
  }
}
