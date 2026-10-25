import { generateCgrReport } from "@intelicont/ledger/cgr-report";
import { getSession } from "@/lib/auth";
import { withTenant } from "@ledger/db/index";
import { getEntity } from "@ledger/db/repository";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session?.userId) {
    return Response.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const projectId = searchParams.get("projectId") || undefined;

  if (!entityId || !UUID_RE.test(entityId)) {
    return Response.json({ success: false, error: "Parámetro entityId inválido (se requiere UUID)" }, { status: 400 });
  }

  try {
    const isAllowed = await withTenant(session.userId, async () => {
      const entity = await getEntity(entityId);
      return !!entity;
    });

    if (!isAllowed) {
      return Response.json({ success: false, error: "Empresa no accesible" }, { status: 403 });
    }

    const report = await generateCgrReport(entityId, undefined, projectId);
    return Response.json({ success: true, report });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Error al generar reporte CGR" }, { status: 500 });
  }
}
