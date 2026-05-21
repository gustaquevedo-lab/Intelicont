import { loadEntidades } from "../actions";
import { NuevoAsientoClient } from "./_components/nuevo-asiento-client";

export const metadata = { title: "Nuevo Asiento" };

/**
 * Server Component — pre-loads the entity list so the empresa selector
 * is populated on first paint (no client-side fetch for this static data).
 * Account search is lazy: fires client-side when an entity is selected.
 */
export default async function NuevoAsientoPage() {
  const result = await loadEntidades();

  return (
    <NuevoAsientoClient
      entities={result.ok ? result.data : []}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
