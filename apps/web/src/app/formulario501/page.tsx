import { loadEntidadesParaIRE } from "./actions";
import { Formulario501Client } from "./_components/formulario501-client";

export const metadata = { title: "Formulario 501 IRE — InteliCont" };

export default async function Formulario501Page() {
  const result = await loadEntidadesParaIRE();
  const currentYear = new Date().getFullYear() - 1; // default = previous fiscal year
  return (
    <Formulario501Client
      entities={result.ok ? result.data : []}
      defaultYear={currentYear}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
