/**
 * Bank Reconciliation Auto-Matching Engine
 *
 * Matches bank movements to general ledger transactions using
 * fuzzy matching on amount, date proximity, and reference text.
 *
 * Scoring:
 * - Exact amount match: 40 pts
 * - Amount within tolerance: 30 pts
 * - Same date: 25 pts
 * - Within 3 days: 15 pts
 * - Reference similarity > 80%: 20 pts
 * - Partial match: 10 pts
 * - Same partner/entity: 5 pts
 */

export interface BankMovement {
  id: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  description: string;
  ref: string;
}

export interface GLTransaction {
  id: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  description: string;
  partnerName?: string;
  accountCode?: string;
}

export interface MatchResult {
  bankMovementId: string;
  glTransactionId: string;
  score: number;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface ReconciliationResult {
  matches: MatchResult[];
  unmatchedBank: BankMovement[];
  unmatchedGL: GLTransaction[];
  summary: {
    totalBank: number;
    totalGL: number;
    matchedCount: number;
    unmatchedBankCount: number;
    unmatchedGLCount: number;
    overallConfidence: number;
  };
}

function parseDate(d: string): Date {
  return new Date(d + "T00:00:00-04:00");
}

function daysBetween(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  return Math.abs((da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24));
}

function similarity(a: string, b: string): number {
  const la = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const lb = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.85;

  // Simple Levenshtein-based similarity
  const maxLen = Math.max(la.length, lb.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(la, lb);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function matchBankToGL(
  bankMovements: BankMovement[],
  glTransactions: GLTransaction[],
  tolerance = 0.02 // 2% amount tolerance
): ReconciliationResult {
  const matches: MatchResult[] = [];
  const usedBank = new Set<string>();
  const usedGL = new Set<string>();

  // Score all pairs
  const pairs: Array<{ bm: BankMovement; gl: GLTransaction; score: number; reasons: string[] }> = [];

  for (const bm of bankMovements) {
    for (const gl of glTransactions) {
      // Must be opposite directions (bank credit = GL debit, bank debit = GL credit)
      if (bm.direction === gl.direction) continue;

      let score = 0;
      const reasons: string[] = [];

      // Amount matching
      const amountDiff = Math.abs(bm.amount - gl.amount);
      const pctDiff = Math.max(bm.amount, gl.amount) > 0
        ? amountDiff / Math.max(Math.abs(bm.amount), Math.abs(gl.amount))
        : 0;

      if (pctDiff < 0.001) {
        score += 40;
        reasons.push("Monto exacto");
      } else if (pctDiff < tolerance) {
        score += 30;
        reasons.push(`Monto cercano (${(pctDiff * 100).toFixed(1)}%)`);
      } else if (pctDiff < 0.1) {
        score += 10;
        reasons.push("Monto aproximado");
      } else {
        continue; // Skip pairs with >10% difference
      }

      // Date proximity
      const days = daysBetween(bm.date, gl.date);
      if (days === 0) {
        score += 25;
        reasons.push("Misma fecha");
      } else if (days <= 3) {
        score += 15;
        reasons.push(`±${days}d`);
      } else if (days <= 7) {
        score += 5;
        reasons.push(`±${days}d (semana)`);
      }

      // Reference similarity
      const sim = similarity(bm.description, gl.description);
      if (sim > 0.8) {
        score += 20;
        reasons.push("Descripción coincide");
      } else if (sim > 0.5) {
        score += 10;
        reasons.push("Descripción similar");
      }

      // Reference number match
      if (bm.ref && gl.description.toLowerCase().includes(bm.ref.toLowerCase())) {
        score += 15;
        reasons.push("Referencia en descripción");
      }

      if (score >= 30) {
        pairs.push({ bm, gl, score, reasons });
      }
    }
  }

  // Sort by score descending, greedily assign matches
  pairs.sort((a, b) => b.score - a.score);

  for (const pair of pairs) {
    if (usedBank.has(pair.bm.id) || usedGL.has(pair.gl.id)) continue;

    usedBank.add(pair.bm.id);
    usedGL.add(pair.gl.id);

    matches.push({
      bankMovementId: pair.bm.id,
      glTransactionId: pair.gl.id,
      score: pair.score,
      confidence: pair.score >= 70 ? "high" : pair.score >= 45 ? "medium" : "low",
      reason: pair.reasons.join(" · "),
    });
  }

  const unmatchedBank = bankMovements.filter((bm) => !usedBank.has(bm.id));
  const unmatchedGL = glTransactions.filter((gl) => !usedGL.has(gl.id));

  return {
    matches,
    unmatchedBank,
    unmatchedGL,
    summary: {
      totalBank: bankMovements.length,
      totalGL: glTransactions.length,
      matchedCount: matches.length,
      unmatchedBankCount: unmatchedBank.length,
      unmatchedGLCount: unmatchedGL.length,
      overallConfidence: matches.length > 0
        ? matches.reduce((s, m) => s + m.score, 0) / matches.length / 100
        : 0,
    },
  };
}
