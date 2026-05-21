import { loadEntidades } from "./actions";
import { LibroMayorClient } from "./_components/libro-mayor-client";

export const metadata = { title: "Libro Mayor" };

/**
 * Server Component — pre-loads the entity list so the empresa selector
 * is populated on first paint. The heavy ledger query runs client-side
 * on demand (when the user clicks "Consultar").
 */
export default async function LibrosPage() {
  const result = await loadEntidades();

  return (
    <LibroMayorClient
      entities={result.ok ? result.data : []}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
