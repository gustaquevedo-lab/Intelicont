import { loadComprobantes, loadEntidadesParaComprobantes } from "./actions";
import { ComprobantesClient } from "./_components/comprobantes-client";
import { getSelectedEntityId } from "@/lib/cookie-context";

export const metadata = { title: "Comprobantes SIFEN" };

export default async function ComprobantesPage() {
  const activeEntityId = await getSelectedEntityId();
  const [compResult, entResult] = await Promise.all([
    loadComprobantes(activeEntityId ? { entityId: activeEntityId } : undefined),
    loadEntidadesParaComprobantes(),
  ]);

  return (
    <ComprobantesClient
      initialData={compResult.ok ? compResult.data : []}
      entities={entResult.ok ? entResult.data : []}
      dbError={compResult.ok ? (entResult.ok ? undefined : entResult.error) : compResult.error}
    />
  );
}

