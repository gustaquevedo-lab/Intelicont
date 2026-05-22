import {
  loadDashboardStats,
  loadDashboardEntities,
  loadDashboardObligaciones,
} from "./dashboard-actions";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata = { title: "Panel General — InteliCont" };

/**
 * Server Component — fetches KPIs, entity list, and fiscal obligations
 * in parallel on every request. DashboardClient handles interactive search.
 */
export default async function DashboardPage() {
  const [statsResult, empresasResult, obligResult] = await Promise.all([
    loadDashboardStats(),
    loadDashboardEntities(),
    loadDashboardObligaciones(),
  ]);

  const defaultStats = {
    activeEntities:      0,
    totalEntries:        0,
    postedThisMonth:     0,
    draftsTotal:         0,
    pendingComprobantes: 0,
  };

  return (
    <DashboardClient
      stats={statsResult.ok ? statsResult.data : defaultStats}
      empresas={empresasResult.ok ? empresasResult.data : []}
      obligaciones={obligResult.ok ? obligResult.data : []}
      dbError={
        statsResult.ok
          ? empresasResult.ok ? undefined : empresasResult.error
          : statsResult.error
      }
    />
  );
}
