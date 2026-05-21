import { getEmpresas } from "./actions";
import { EmpresasClient } from "./_components/empresas-client";

export const metadata = { title: "Empresas" };

/**
 * Server Component — runs on the server, fetches DB data, then renders
 * the interactive EmpresasClient with the initial dataset.
 * When the user creates a new empresa, the client calls router.refresh()
 * which re-runs this component with fresh DB data.
 */
export default async function EmpresasPage() {
  const result = await getEmpresas();

  return (
    <EmpresasClient
      initialData={result.ok ? result.data : []}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
