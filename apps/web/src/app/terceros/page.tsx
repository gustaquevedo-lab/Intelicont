import { loadTerceros, loadEntidadesParaTerceros } from "./actions";
import { TercerosClient } from "./_components/terceros-client";

export const metadata = { title: "Terceros — Clientes y Proveedores" };

export default async function TercerosPage() {
  const [tercerosResult, entidadesResult] = await Promise.all([
    loadTerceros(),
    loadEntidadesParaTerceros(),
  ]);

  return (
    <TercerosClient
      initialData={tercerosResult.ok ? tercerosResult.data : []}
      entities={entidadesResult.ok ? entidadesResult.data : []}
      dbError={tercerosResult.ok ? undefined : tercerosResult.error}
    />
  );
}
