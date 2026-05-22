import { loadEntidadesParaEF } from "./actions";
import { EstadosFinancierosClient } from "./_components/estados-financieros-client";

export const metadata = { title: "Estados Financieros — InteliCont" };

export default async function EstadosFinancierosPage() {
  const result = await loadEntidadesParaEF();
  const now    = new Date();

  // Default: current year
  const defaultTo   = now.toISOString().split("T")[0];
  const defaultFrom = `${now.getFullYear()}-01-01`;

  return (
    <EstadosFinancierosClient
      entities={result.ok ? result.data : []}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
