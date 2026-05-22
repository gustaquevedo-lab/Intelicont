import { loadEntidadesParaPeriodos } from "./actions";
import { PeriodosClient } from "./_components/periodos-client";

export const metadata = { title: "Períodos Fiscales — InteliCont" };

export default async function PeriodosPage() {
  const result = await loadEntidadesParaPeriodos();
  return (
    <PeriodosClient
      entities={result.ok ? result.data : []}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
