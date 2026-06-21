import { loadEntidadesParaPeriodos } from "./actions";
import { PeriodosClient } from "./_components/periodos-client";
import { getSelectedEntityId } from "@/lib/cookie-context";

export const metadata = { title: "Períodos Fiscales — InteliCont" };

export default async function PeriodosPage() {
  const result = await loadEntidadesParaPeriodos();
  const activeEntityId = await getSelectedEntityId();
  return (
    <PeriodosClient
      entities={result.ok ? result.data : []}
      defaultEntityId={activeEntityId || undefined}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
