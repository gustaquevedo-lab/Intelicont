import { Users } from "lucide-react";
import { TercerosClient } from "./_components/terceros-client";
import { loadTerceros, loadEntidadesParaTerceros } from "./actions";

export const metadata = {
  title: "Clientes y Proveedores",
  description: "Gestión de terceros, RUC, retenciones y contactos",
};

export default async function TercerosPage() {
  const [tercerosResult, entitiesResult] = await Promise.all([
    loadTerceros(),
    loadEntidadesParaTerceros(),
  ]);

  const initialData = tercerosResult.ok ? tercerosResult.data : [];
  const entities = entitiesResult.ok ? entitiesResult.data : [];
  const dbError = (!tercerosResult.ok ? tercerosResult.error : null) || 
                  (!entitiesResult.ok ? entitiesResult.error : null) || 
                  undefined;

  return (
    <TercerosClient
      initialData={initialData}
      entities={entities}
      dbError={dbError}
    />
  );
}
