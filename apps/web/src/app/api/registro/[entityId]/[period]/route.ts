import { withTenant } from "@ledger/db/index";
import { getEntity } from "@ledger/db/repository";
import { getRegistroDocs } from "@ledger/db/registro";
import { buildRegistro, zipRegistro } from "@intelicont/ledger/registro";
import { getSession } from "@/lib/auth";
import { loadGuardUser, needs2FA } from "@/lib/auth-guard";
import { logger, safeErrorInfo } from "@/lib/logger";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (body: string, status: number) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

/**
 * Registro de Comprobantes (obligación 955): GET /api/registro/<entityId>/<MMAAAA>?part=N (default 1)
 * returns that part's .zip. Same identity and 2FA rule as protectedProcedure; the DB work runs in one
 * withTenant and the CPU-only build/zip after it.
 */
export async function GET(req: Request, { params }: { params: Promise<{ entityId: string; period: string }> }) {
  const session = await getSession(req.headers);
  if (!session) return text("No autenticado", 401);
  const { entityId, period } = await params;
  const m = /^(0[1-9]|1[0-2])(\d{4})$/.exec(period);
  const partParam = new URL(req.url).searchParams.get("part") ?? "1";
  if (!UUID.test(entityId) || !m || !/^[1-9]\d{0,3}$/.test(partParam)) return text("Solicitud inválida", 400);
  const [month, year] = [Number(m[1]), Number(m[2])];

  let data: Awaited<ReturnType<typeof getRegistroDocs>> | "forbidden";
  try {
    data = await withTenant(session.userId, async (db) => {
      if (needs2FA(await loadGuardUser(db, session.userId))) return "forbidden" as const;
      if (!(await getEntity(entityId))) return "forbidden" as const;
      return getRegistroDocs(entityId, year, month);
    });
  } catch (err) {
    const requestId = crypto.randomUUID();
    logger.error({ requestId, userId: session.userId, entityId, period, ...safeErrorInfo(err) }, "registro download failed");
    return text(`No se pudo generar el archivo (ref ${requestId})`, 500);
  }
  if (data === "forbidden") return text("Empresa no accesible", 403);

  const file = buildRegistro({ ruc: data.entityRuc, year, month, docs: data.docs }).files[Number(partParam) - 1];
  if (!file) return text("No hay comprobantes para exportar", 404);
  // fflate allocates a plain ArrayBuffer (never shared), so the narrower type is accurate.
  return new Response(zipRegistro(file) as Uint8Array<ArrayBuffer>, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${file.name}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
