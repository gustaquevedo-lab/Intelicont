/**
 * RG90 Engine — Conciliación de Comprobantes Electrónicos (SET)
 *
 * Cross-references SIFEN tax documents against accounting books
 * to detect discrepancies required by RG 90/2021.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type Rg90Status = "confirmed" | "pending" | "discrepancy";

export interface Rg90Entry {
  id: string;
  cdc: string;
  documentNumber: string;
  documentType: string;
  partnerName: string;
  partnerRuc: string;
  issueDate: string;
  sifenAmount: number;
  bookAmount: number;
  difference: number;
  status: Rg90Status;
  observation: string;
}

export interface Rg90Summary {
  totalDocuments: number;
  confirmed: number;
  pending: number;
  discrepancies: number;
  totalSifenAmount: number;
  totalBookAmount: number;
  totalDifference: number;
}

// ─── Comparison Engine ─────────────────────────────────────────────────────

export interface TaxDocumentRecord {
  id: string;
  cdc: string;
  number: string;
  docType: string;
  direction: string;
  issueDate: string;
  total: string;
  partnerName: string;
  partnerRuc: string;
  journalEntryId: string | null;
}

export interface JournalEntryRecord {
  id: string;
  number: string;
  date: Date;
  totalDebit: string;
  totalCredit: string;
  taxDocumentId: string | null;
}

export function compareSifenVsBooks(
  taxDocs: TaxDocumentRecord[],
  journalEntries: JournalEntryRecord[],
  tolerance = 100
): Rg90Entry[] {
  const results: Rg90Entry[] = [];
  const journalMap = new Map<string, JournalEntryRecord>();

  for (const je of journalEntries) {
    if (je.taxDocumentId) {
      journalMap.set(je.taxDocumentId, je);
    }
  }

  for (const doc of taxDocs) {
    const sifenAmount = parseFloat(doc.total) || 0;
    const journalEntry = journalMap.get(doc.id);
    let bookAmount = 0;
    let observation = "";

    if (journalEntry) {
      bookAmount = parseFloat(journalEntry.totalDebit) || 0;
      if (bookAmount === 0) {
        bookAmount = parseFloat(journalEntry.totalCredit) || 0;
      }
    }

    const difference = Math.abs(sifenAmount - bookAmount);
    let status: Rg90Status;

    if (!journalEntry) {
      status = "pending";
      observation = "Sin asiento contable registrado";
    } else if (difference <= tolerance) {
      status = "confirmed";
      observation = `Asiento: ${journalEntry.number} — Monto coincide`;
    } else {
      status = "discrepancy";
      observation = `Diferencia: Gs. ${difference.toLocaleString("es-PY")}`;
    }

    results.push({
      id: doc.id,
      cdc: doc.cdc,
      documentNumber: doc.number,
      documentType: doc.docType,
      partnerName: doc.partnerName,
      partnerRuc: doc.partnerRuc,
      issueDate: doc.issueDate,
      sifenAmount,
      bookAmount,
      difference,
      status,
      observation,
    });
  }

  return results;
}

export function summarizeRg90(entries: Rg90Entry[]): Rg90Summary {
  let confirmed = 0;
  let pending = 0;
  let discrepancies = 0;
  let totalSifenAmount = 0;
  let totalBookAmount = 0;

  for (const e of entries) {
    if (e.status === "confirmed") confirmed++;
    else if (e.status === "pending") pending++;
    else discrepancies++;
    totalSifenAmount += e.sifenAmount;
    totalBookAmount += e.bookAmount;
  }

  return {
    totalDocuments: entries.length,
    confirmed,
    pending,
    discrepancies,
    totalSifenAmount,
    totalBookAmount,
    totalDifference: Math.abs(totalSifenAmount - totalBookAmount),
  };
}
