/** Guaraní amounts are integers; the UI shows them with `.` as thousands separator (`1.234.567`). */

/** `"1.234.567"` -> 1234567; `""` -> 0; decimals, letters, bad grouping or unsafe integers -> null. */
export function parseGs(s: string): number | null {
  const t = s.trim();
  if (t === "") return 0;
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(t)) return null;
  const n = Number(t.replace(/\./g, ""));
  return Number.isSafeInteger(n) ? n : null;
}

export function formatGs(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
