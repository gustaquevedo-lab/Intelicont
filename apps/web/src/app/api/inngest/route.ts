import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log(`[Background Worker / Inngest-Trigger] Processing Event: ${event}`, data);

    switch (event) {
      case "sifen/parse_xml_batch":
        console.log(`[Worker] Batch parsing ${data?.files?.length || 0} XML SIFEN invoices`);
        break;
      case "fiscal/generate_hechauka":
        console.log(`[Worker] Generating Hechauka RG90 report for entity ${data?.entityId}`);
        break;
      default:
        console.log(`[Worker] Unhandled background event: ${event}`);
    }

    return NextResponse.json({ success: true, event, processedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
