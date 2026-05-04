export type Money = {
  amount: string; // use string to avoid JS floating point issues; represent with 20,4 precision in DB
  currency_code: string; // ISO 4217 code, e.g., USD, PYG
};

export function moneyToString(m: Money): string {
  return `${m.currency_code} ${m.amount}`;
}
