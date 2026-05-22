import { loadEntidadesParaTesaka, loadResumenPeriodos } from "./actions";
import { TesakaClient } from "./_components/tesaka-client";

export const metadata = { title: "Tesaka — Retenciones — InteliCont" };

export default async function TesakaPage() {
  const result = await loadEntidadesParaTesaka();
  return (
    <TesakaClient
      entities={result.ok ? result.data : []}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
