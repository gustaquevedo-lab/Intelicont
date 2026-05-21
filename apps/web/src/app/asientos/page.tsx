import { loadAsientos, loadEntidades } from "./actions";
import { AsientosClient } from "./_components/asientos-client";

export const metadata = { title: "Asientos Contables" };

/**
 * Server Component — pre-loads entities + all recent journal entries so the
 * list renders on first paint. Filtering (search, status, entity) runs
 * client-side against the pre-loaded data.
 */
export default async function AsientosPage() {
  const [entidadesResult, asientosResult] = await Promise.all([
    loadEntidades(),
    loadAsientos(),
  ]);

  return (
    <AsientosClient
      initialAsientos={asientosResult.ok ? asientosResult.data : []}
      entities={entidadesResult.ok ? entidadesResult.data : []}
      dbError={
        asientosResult.ok
          ? entidadesResult.ok ? undefined : entidadesResult.error
          : asientosResult.error
      }
    />
  );
}
