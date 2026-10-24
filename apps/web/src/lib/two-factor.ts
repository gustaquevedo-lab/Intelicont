/** True for the server's "2FA requerido" rejection (tRPC FORBIDDEN), however the client error was wrapped. */
export function isTwoFactorRequired(error: unknown): boolean {
  const e = error as { message?: unknown; data?: { code?: unknown } } | null;
  return !!e && typeof e === "object" && e.data?.code === "FORBIDDEN" && typeof e.message === "string" && e.message.includes("2FA requerido");
}

export const TWO_FACTOR_PATH = "/seguridad/2fa";

/** Hard-navigates to the 2FA setup page, except when already there (no redirect loop). */
export function redirectIfTwoFactorRequired(error: unknown, loc: Pick<Location, "pathname" | "assign"> = window.location): boolean {
  if (!isTwoFactorRequired(error) || loc.pathname === TWO_FACTOR_PATH) return false;
  loc.assign(TWO_FACTOR_PATH);
  return true;
}
