import { loadTimbrados, loadEntidadesParaTimbrados } from "./actions";
import { TimbradosClient } from "./_components/timbrados-client";
import { getSelectedEntityId } from "@/lib/cookie-context";

export const metadata = { title: "Timbrados — InteliCont" };

export default async function TimbradosPage() {
  const activeEntityId = await getSelectedEntityId();
  const [entidadesResult, timbradosResult] = await Promise.all([
    loadEntidadesParaTimbrados(),
    loadTimbrados(activeEntityId || undefined),
  ]);
  return (
    <TimbradosClient
      entities={entidadesResult.ok ? entidadesResult.data : []}
      defaultEntityId={activeEntityId || undefined}
      initialTimbrados={timbradosResult.ok ? timbradosResult.data : []}
      dbError={entidadesResult.ok ? undefined : entidadesResult.error}
    />
  );
}
