import { loadDashboardStats, loadDashboardEntities } from "./dashboard-actions";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata = { title: "Panel General — InteliCont" };

/**
 * Server Component — fetches KPIs and entity list in parallel on every request
 * so the dashboard always reflects real data. The Client Component handles
 * search filtering.
 */
export default async function DashboardPage() {
  const [statsResult, empresasResult] = await Promise.all([
    loadDashboardStats(),
    loadDashboardEntities(),
  ]);

  const defaultStats = {
    activeEntities:  0,
    totalEntries:    0,
    postedThisMonth: 0,
    draftsTotal:     0,
  };

  return (
    <DashboardClient
      stats={statsResult.ok ? statsResult.data : defaultStats}
      empresas={empresasResult.ok ? empresasResult.data : []}
      dbError={
        statsResult.ok
          ? empresasResult.ok ? undefined : empresasResult.error
          : statsResult.error
      }
    />
  );
}
