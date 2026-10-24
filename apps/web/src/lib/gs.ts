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

/** True when `next` is `prev` with exactly one character inserted or deleted (typing / Backspace, not a paste). */
function isSingleEdit(prev: string, next: string): boolean {
  if (Math.abs(prev.length - next.length) !== 1) return false;
  const [short, long] = prev.length < next.length ? [prev, next] : [next, prev];
  let p = 0;
  while (p < short.length && short[p] === long[p]) p++;
  return short.slice(p) === long.slice(p + 1);
}

/**
 * Value of an amount cell after an edit. `prev` is the text shown before, `next` the text after.
 * Typing one character while the cell shows `1.234` yields `1.2345`, which is not valid grouping, so a
 * single-character edit may drop the dots and keep the digits; anything else (a paste such as `1.234,50`
 * or `1.5`) must be a valid amount on its own. Returns null when the edit must be rejected, never a coerced number.
 */
export function parseGsInput(prev: string, next: string): number | null {
  const strict = parseGs(next);
  if (strict !== null) return strict;
  if (!isSingleEdit(prev, next) || !/^[\d.]+$/.test(next)) return null;
  const n = Number(next.replace(/\./g, ""));
  return Number.isSafeInteger(n) ? n : null;
}
