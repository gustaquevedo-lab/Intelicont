import { headers } from "next/headers";
import { getSession } from "./auth";

/** Identity for server actions/components from the request's session cookie. Throws without a session. */
export async function requireUser(): Promise<{ userId: string }> {
  const session = await getSession(await headers());
  if (!session) throw new Error("No autenticado");
  return session;
}
