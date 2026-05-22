import { loadTimbrados, loadEntidadesParaTimbrados } from "./actions";
import { TimbradosClient } from "./_components/timbrados-client";

export const metadata = { title: "Timbrados — InteliCont" };

export default async function TimbradosPage() {
  const [entidadesResult, timbradosResult] = await Promise.all([
    loadEntidadesParaTimbrados(),
    loadTimbrados(),
  ]);
  return (
    <TimbradosClient
      entities={entidadesResult.ok ? entidadesResult.data : []}
      initialTimbrados={timbradosResult.ok ? timbradosResult.data : []}
      dbError={entidadesResult.ok ? undefined : entidadesResult.error}
    />
  );
}
