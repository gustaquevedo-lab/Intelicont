import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { parseBankCSV } from "../lib/bank-parser";
import { matchBankToGL, type BankMovement, type GLTransaction } from "../lib/bank-matcher";

describe("Bank CSV Parser (Paraguay Banks)", () => {
  it("parses GNB statement format", () => {
    const csv = `Fecha,Descripción,Referencia,Crédito,Débito
01/05/2026,"Pago Proveedor","CHQ-001",0,5000000
02/05/2026,"Cobro Cliente","DEP-002",3500000,0`;

    const res = parseBankCSV(csv, "gnb");
    expect(res.success).toBe(true);
    expect(res.movements.length).toBe(2);
    expect(res.movements[0].amount).toBe(5000000);
    expect(res.movements[0].direction).toBe("debit");
    expect(res.movements[1].amount).toBe(3500000);
    expect(res.movements[1].direction).toBe("credit");
  });

  it("parses BNF statement format", () => {
    const csv = `Fecha,Concepto,Comprobante,Operación,Monto
10/05/2026,"Depósito por ventanilla","DEP-100","Crédito",1200000
11/05/2026,"Extracción ATM","ATM-200","Débito",500000`;

    const res = parseBankCSV(csv, "bnf");
    expect(res.success).toBe(true);
    expect(res.movements.length).toBe(2);
    expect(res.movements[0].amount).toBe(1200000);
    expect(res.movements[0].direction).toBe("credit");
    expect(res.movements[1].amount).toBe(500000);
    expect(res.movements[1].direction).toBe("debit");
  });

  it("parses Itaú statement format", () => {
    const csv = `Fecha,Descripción,Referencia,Importe,Entrada,Salida
05/05/2026,"Transferencia recibida","TRF-500",2000000,2000000,0`;

    const res = parseBankCSV(csv, "itau");
    expect(res.success).toBe(true);
    expect(res.movements.length).toBe(1);
    expect(res.movements[0].amount).toBe(2000000);
  });
});

describe("Bank Reconciliation Auto-Matcher", () => {
  // In bank accounting:
  // Bank statement debit (withdrawal/payment) = GL credit (cash outflow from ledger)
  // Bank statement credit (deposit/collection) = GL debit (cash inflow to ledger)
  const bankMovements: BankMovement[] = [
    { id: "bm1", date: "2026-05-01", amount: 11000000, direction: "debit", description: "Pago Importadora Este", ref: "CHQ-001" },
    { id: "bm2", date: "2026-05-02", amount: 2500000, direction: "credit", description: "Cobro cliente", ref: "DEP-002" },
    { id: "bm3", date: "2026-05-15", amount: 9999999, direction: "debit", description: "Sin match", ref: "" },
  ];

  const glTransactions: GLTransaction[] = [
    { id: "gl1", date: "2026-05-01", amount: 11000000, direction: "credit", description: "Pago a Importadora del Este", partnerName: "ImportEste" },
    { id: "gl2", date: "2026-05-03", amount: 2500000, direction: "debit", description: "Cobro cliente regular", partnerName: "Cliente A" },
  ];

  it("finds high-confidence matches by exact amount and date proximity", () => {
    const res = matchBankToGL(bankMovements, glTransactions, 0.02);
    expect(res.matches.length).toBe(2);

    const match1 = res.matches.find((m) => m.bankMovementId === "bm1");
    expect(match1).toBeDefined();
    expect(match1?.glTransactionId).toBe("gl1");
    expect(match1?.confidence).toBe("high");

    const match2 = res.matches.find((m) => m.bankMovementId === "bm2");
    expect(match2).toBeDefined();
    expect(match2?.glTransactionId).toBe("gl2");

    expect(res.unmatchedBank.some((b) => b.id === "bm3")).toBe(true);
  });
});

describe("Bank Movements and Reconciliations Repository (in-memory mode)", () => {
  let repo: typeof import("@ledger/db/repository");
  const prevUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    const db = await import("@ledger/db/index");
    db.getDb();
    repo = await import("@ledger/db/repository");
  });

  afterAll(() => {
    if (prevUrl !== undefined) process.env.DATABASE_URL = prevUrl;
    vi.restoreAllMocks();
  });

  const dummyBankAccountId = "00000000-0000-0000-0000-000000000099";

  it("imports bank movements and persists reconciliations in repository", async () => {
    const importedCount = await repo.importBankMovements(dummyBankAccountId, [
      { date: "2026-05-10", amount: 750000, direction: "credit", description: "Prueba importación" },
    ]);
    expect(importedCount).toBe(1);

    const movs = await repo.getBankMovements(dummyBankAccountId);
    expect(movs.length).toBeGreaterThan(0);

    const recCount = await repo.saveReconciliations(dummyBankAccountId, [
      { bankMovementId: movs[0].id, glTransactionId: "00000000-0000-0000-0000-000000000088", score: 95 },
    ]);
    expect(recCount).toBe(1);

    const recs = await repo.getReconciliations(dummyBankAccountId);
    expect(recs.length).toBeGreaterThan(0);
  });
});
