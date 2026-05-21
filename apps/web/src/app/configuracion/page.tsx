import { loadAISettings } from "@/app/comprobantes/actions";
import { ConfiguracionClient } from "./_components/configuracion-client";

export const metadata = { title: "Configuración — InteliCont" };

export default async function ConfiguracionPage() {
  const result = await loadAISettings();
  return (
    <ConfiguracionClient
      initialSettings={result.ok ? result.data : {}}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
