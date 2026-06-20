import { loadEntidadesParaCuentas } from "./actions";
import { CuentasClient } from "./_components/cuentas-client";

export const metadata = { title: "Plan de Cuentas — InteliCont" };

export default async function CuentasPage() {
  const entResult = await loadEntidadesParaCuentas();
  return (
    <CuentasClient
      entities={entResult.ok ? entResult.data : []}
      dbError={entResult.ok ? undefined : entResult.error}
    />
  );
}
