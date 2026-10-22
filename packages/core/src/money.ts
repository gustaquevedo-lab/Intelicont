// Money is an integer in the currency's minor unit (PYG exponent 0).
// shortcut: limit 2^53 (~9x10^15 Gs); move to bigint if exceeded.
export function assertMoney(n: number): number {
  if (!Number.isSafeInteger(n)) throw new Error(`Invalid money amount: ${n}`);
  return n;
}

/** IVA contained in an IVA-inclusive amount: 10% -> gross/11, 5% -> gross/21. */
export function ivaFromGross(gross: number, rate: 10 | 5): number {
  return Math.round(gross / (rate === 10 ? 11 : 21));
}
