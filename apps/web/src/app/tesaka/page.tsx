import { loadEntidadesParaTesaka } from "./actions";
import { TesakaClient } from "./_components/tesaka-client";
import { getSelectedEntityId } from "@/lib/cookie-context";

export const metadata = { title: "Tesaka — Retenciones — InteliCont" };

export default async function TesakaPage() {
  const result = await loadEntidadesParaTesaka();
  const activeEntityId = await getSelectedEntityId();
  return (
    <TesakaClient
      entities={result.ok ? result.data : []}
      defaultEntityId={activeEntityId || undefined}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
