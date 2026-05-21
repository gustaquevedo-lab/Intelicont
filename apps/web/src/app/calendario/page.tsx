import { loadCalendario } from "./actions";
import { CalendarioClient } from "./_components/calendario-client";

export const metadata = { title: "Calendario Fiscal — DNIT" };

export default async function CalendarioPage() {
  const result = await loadCalendario(new Date().getFullYear(), 4);
  const emptyData = { obligaciones: [], entities: [] };

  return (
    <CalendarioClient
      data={result.ok ? result.data : emptyData}
      dbError={result.ok ? undefined : result.error}
    />
  );
}
