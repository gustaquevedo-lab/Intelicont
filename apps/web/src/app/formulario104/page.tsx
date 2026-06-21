import { loadEntidadesParaIVA } from "@/app/libro-iva/actions";
import { Formulario104Client } from "./_components/formulario104-client";
import { getSelectedEntityId } from "@/lib/cookie-context";

export const metadata = { title: "Formulario 104 — IVA — InteliCont" };

export default async function Formulario104Page() {
  const entResult = await loadEntidadesParaIVA();
  const activeEntityId = await getSelectedEntityId();
  const now       = new Date();

  return (
    <Formulario104Client
      entities={entResult.ok ? entResult.data : []}
      defaultEntityId={activeEntityId || undefined}
      defaultYear={now.getFullYear()}
      defaultMonth={now.getMonth() + 1}
      dbError={entResult.ok ? undefined : entResult.error}
    />
  );
}
