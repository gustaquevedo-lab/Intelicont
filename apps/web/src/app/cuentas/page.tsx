import { loadEntidadesParaCuentas } from "./actions";
import { CuentasClient } from "./_components/cuentas-client";

export const metadata = { title: "Plan de Cuentas — InteliCont" };

export default async function CuentasPage() {
  const result = await loadEntidadesParaCuentas();
  return (
    <CuentasClient
      entities={result.ok ? result.data : []}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
