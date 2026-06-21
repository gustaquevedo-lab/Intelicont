import { loadEntidadesParaIRE } from "./actions";
import { Formulario501Client } from "./_components/formulario501-client";
import { getSelectedEntityId } from "@/lib/cookie-context";

export const metadata = { title: "Formulario 501 IRE — InteliCont" };

export default async function Formulario501Page() {
  const result = await loadEntidadesParaIRE();
  const activeEntityId = await getSelectedEntityId();
  const currentYear = new Date().getFullYear() - 1; // default = previous fiscal year
  return (
    <Formulario501Client
      entities={result.ok ? result.data : []}
      defaultEntityId={activeEntityId || undefined}
      defaultYear={currentYear}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
