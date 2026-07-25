import { generateCgrReport } from "@intelicont/ledger/cgr-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId") || "demo-esfl-entity";
  const projectId = searchParams.get("projectId") || undefined;

  try {
    const report = await generateCgrReport(entityId, undefined, projectId);
    return Response.json({ success: true, report });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
