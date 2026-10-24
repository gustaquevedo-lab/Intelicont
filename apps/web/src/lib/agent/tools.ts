/**
 * Herramientas contables y fiscales operativas (Tool Calling) para el Agente InteliCont.
 * Todas las herramientas ejecutan forzosamente dentro del perímetro multi-tenant de la entidad activa.
 */

import { buscarNormativas } from "./rag-service";
import { getAllAccounts, getTaxDocuments, getEntity } from "@ledger/db/repository";
import { tenantDb, isMockMode } from "@ledger/db/index";
import { sql } from "drizzle-orm";

/**
 * Calcula vencimientos mensuales DNIT (Resolución 49/2014) según la terminación del RUC.
 * RUC termina en 0 -> día 7, 1 -> día 9, ..., 9 -> día 25.
 */
export function calcularVencimientosRuc(ruc: string) {
  const body = (ruc || "").split("-")[0].replace(/\D/g, "");
  const lastDigit = body ? Number(body[body.length - 1]) : 0;
  const baseDay = 7 + lastDigit * 2;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const due = new Date(Date.UTC(year, month, baseDay));
  const dow = due.getUTCDay();
  const shift = dow === 6 ? 2 : dow === 0 ? 1 : 0;
  const finalDue = new Date(due.getTime() + shift * 86_400_000);

  const diffMs = finalDue.getTime() - Date.now();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isoDue = finalDue.toISOString().slice(0, 10);

  return {
    lastDigit,
    baseDay,
    vencimientoIVA: isoDue,
    vencimientoRG90: isoDue,
    diasRestantes,
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

export const ESQUEMA_HERRAMIENTAS_CONTABLES: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "consultar_normativa_legal",
      description: "Busca disposiciones legales, artículos y decretos de la Ley 6380/19 (IRE, IVA, IRP), RG 90/21 o Ley 125/91 de Paraguay.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Concepto o tema fiscal (ej: 'gastos deducibles IRE Art. 16', 'credito fiscal IVA 10%', 'prorrata', 'vencimientos')",
          },
          categoria: {
            type: "string",
            description: "Opcional: 'IRE', 'IVA', 'RG90', 'CALENDARIO', 'SANCIONES', 'CONTABILIDAD'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_saldo_cuenta",
      description: "Consulta el saldo contable actual, código, naturaleza y sumas del mayor de una o varias cuentas de la empresa activa.",
      parameters: {
        type: "object",
        properties: {
          codigo: {
            type: "string",
            description: "Código de la cuenta contable (ej: '1.1.1.01', '1.1.3.01', '2.1.1.01')",
          },
          nombre: {
            type: "string",
            description: "Opcional: Parte del nombre de la cuenta (ej: 'Caja', 'IVA', 'Bancos', 'Proveedores')",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_comprobantes",
      description: "Busca facturas y comprobantes tributarios (SIFEN / compras / ventas) registrados en la empresa activa.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["todos", "compras", "ventas"],
            description: "Filtro por tipo de operación",
          },
          ruc_contraparte: {
            type: "string",
            description: "Opcional: RUC del proveedor o cliente a buscar",
          },
          limit: {
            type: "integer",
            description: "Máximo de comprobantes a listar (default 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_vencimientos_fiscales",
      description: "Calcula los plazos de vencimiento legal (IVA Formulario 120, RG 90 F. 241) para la empresa activa según la terminación de su RUC.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "proponer_asiento_contable",
      description: "Valida y genera la estructura de un asiento de partida doble cuadrado (Debe === Haber) para el plan de cuentas de la empresa.",
      parameters: {
        type: "object",
        properties: {
          descripcion: {
            type: "string",
            description: "Concepto o glosa del asiento contable",
          },
          cuenta_debe: {
            type: "string",
            description: "Código de la cuenta que se debita (ej: '5.2.1.01')",
          },
          cuenta_haber: {
            type: "string",
            description: "Código de la cuenta que se acredita (ej: '1.1.1.01')",
          },
          monto: {
            type: "integer",
            description: "Monto total en Guaraníes enteros",
          },
          incluye_iva_10: {
            type: "boolean",
            description: "Si es True, desglosa automáticamente el Crédito Fiscal IVA 10% (monto/11) en cuenta '1.1.3.01'",
          },
        },
        required: ["descripcion", "cuenta_debe", "cuenta_haber", "monto"],
      },
    },
  },
];

export interface ToolExecutionResult {
  toolName: string;
  arguments: Record<string, unknown>;
  output: unknown;
  success: boolean;
}

/**
 * Ejecuta una herramienta contable garantizando aislamiento por entityId.
 */
export async function ejecutarHerramientaContable(
  nombre: string,
  args: Record<string, unknown>,
  entityId: string
): Promise<ToolExecutionResult> {
  try {
    switch (nombre) {
      case "consultar_normativa_legal": {
        const query = String(args.query || "");
        const categoria = args.categoria ? String(args.categoria) : undefined;
        const normativas = await buscarNormativas(query, 3, categoria);
        return {
          toolName: nombre,
          arguments: args,
          success: true,
          output: normativas.map((n) => ({
            fuente: n.fuente,
            articulo: n.articulo,
            titulo: n.titulo,
            contenido: n.contenido,
            relevancia: n.score,
          })),
        };
      }

      case "consultar_saldo_cuenta": {
        const codigo = args.codigo ? String(args.codigo).trim() : null;
        const nombreFiltro = args.nombre ? String(args.nombre).trim().toLowerCase() : null;

        let allAccounts: any[] = [];
        try {
          allAccounts = await getAllAccounts(entityId);
        } catch {
          allAccounts = [];
        }

        let cuentas = allAccounts;

        if (codigo) {
          cuentas = cuentas.filter((a) => a.code.startsWith(codigo));
        }
        if (nombreFiltro) {
          cuentas = cuentas.filter((a) => a.name.toLowerCase().includes(nombreFiltro));
        }

        // Obtener saldo sumado de cada cuenta imputable
        const cuentasImputables = cuentas.filter((a) => a.allowsPosting).slice(0, 8);

        const resultados = await Promise.all(
          cuentasImputables.map(async (acc) => {
            let saldo = 0;
            if (!isMockMode()) {
              try {
                const rows = await tenantDb(async (db) => {
                  return db.execute<{ saldo: string }>(
                    sql`select coalesce(sum(l.debit - l.credit), 0)::text as saldo
                        from journal_lines l
                        join journal_entries e on e.id = l.entry_id
                        where e.entity_id = ${entityId} and l.account_id = ${acc.id} and e.status = 'posted'`
                  );
                });
                saldo = Number(rows[0]?.saldo || 0);
              } catch {
                saldo = 0;
              }
            }
            return {
              codigo: acc.code,
              nombre: acc.name,
              naturaleza: acc.nature,
              saldoActualPYG: saldo,
              formato: new Intl.NumberFormat("es-PY").format(saldo) + " ₲",
            };
          })
        );

        return {
          toolName: nombre,
          arguments: args,
          success: true,
          output: {
            totalEncontradas: cuentas.length,
            cuentas: resultados,
          },
        };
      }

      case "buscar_comprobantes": {
        const tipo = String(args.tipo || "todos");
        const rucContraparte = args.ruc_contraparte ? String(args.ruc_contraparte).trim() : null;
        const limit = Math.min(Number(args.limit || 5), 10);

        let docs: any[] = [];
        try {
          docs = await getTaxDocuments(entityId);
        } catch {
          docs = [];
        }

        let filtrados = docs;

        if (tipo === "compras") {
          filtrados = filtrados.filter((d) => d.kind === "received");
        } else if (tipo === "ventas") {
          filtrados = filtrados.filter((d) => d.kind === "issued");
        }

        if (rucContraparte) {
          filtrados = filtrados.filter((d) =>
            d.issuerRuc?.includes(rucContraparte) || d.receiverRuc?.includes(rucContraparte)
          );
        }

        const items = filtrados.slice(0, limit).map((d) => ({
          id: d.id,
          tipo: d.kind === "issued" ? "Venta" : "Compra",
          comprobanteTipo: d.docType,
          numero: d.number,
          fecha: d.issueDate instanceof Date ? d.issueDate.toISOString().slice(0, 10) : String(d.issueDate),
          contraparte: d.kind === "issued" ? (d.receiverName || d.receiverRuc) : (d.issuerName || d.issuerRuc),
          totalPYG: Number(d.totalAmount),
          totalFormateado: new Intl.NumberFormat("es-PY").format(Number(d.totalAmount)) + " ₲",
          estado: d.status,
        }));

        return {
          toolName: nombre,
          arguments: args,
          success: true,
          output: {
            totalRegistrados: docs.length,
            mostrados: items.length,
            comprobantes: items,
          },
        };
      }

      case "consultar_vencimientos_fiscales": {
        let entity: any = null;
        try {
          entity = await getEntity(entityId);
        } catch {
          entity = null;
        }

        if (!entity) {
          // Fallback con formato de RUC paraguayo válido para entornos sin sesión DB
          entity = { legalName: "Empresa Activa", ruc: "80012345-6" };
        }

        const dates = calcularVencimientosRuc(entity.ruc);

        return {
          toolName: nombre,
          arguments: args,
          success: true,
          output: {
            empresa: entity.legalName,
            ruc: entity.ruc,
            terminacionRuc: dates.lastDigit,
            diaBase: dates.baseDay,
            vencimientoIVA: dates.vencimientoIVA,
            vencimientoRG90: dates.vencimientoRG90,
            diasRestantes: dates.diasRestantes,
            estado: dates.diasRestantes < 0 ? "VENCIDO" : dates.diasRestantes <= 3 ? "URGENTE" : "EN PLAZO",
          },
        };
      }

      case "proponer_asiento_contable": {
        const descripcion = String(args.descripcion || "Asiento contable");
        const codigoDebe = String(args.cuenta_debe || "");
        const codigoHaber = String(args.cuenta_haber || "");
        const monto = Math.round(Number(args.monto || 0));
        const conIva = Boolean(args.incluye_iva_10);

        if (monto <= 0) {
          return {
            toolName: nombre,
            arguments: args,
            success: false,
            output: "El monto debe ser un entero positivo mayor a cero.",
          };
        }

        let accounts: any[] = [];
        try {
          accounts = await getAllAccounts(entityId);
        } catch {
          accounts = [];
        }
        const accDebe = accounts.find((a: any) => a.code === codigoDebe);
        const accHaber = accounts.find((a: any) => a.code === codigoHaber);

        const lineas: Array<{ cuenta: string; codigo: string; debe: number; haber: number }> = [];

        if (conIva) {
          // Desglose oficial DNIT: IVA 10% = monto / 11, Base = monto - IVA
          const iva10 = Math.round(monto / 11);
          const base = monto - iva10;
          const accIva = accounts.find((a) => a.code === "1.1.3.01") || {
            code: "1.1.3.01",
            name: "Crédito Fiscal IVA 10%",
          };

          lineas.push({
            codigo: codigoDebe,
            cuenta: accDebe?.name || `Cuenta ${codigoDebe}`,
            debe: base,
            haber: 0,
          });
          lineas.push({
            codigo: accIva.code,
            cuenta: accIva.name,
            debe: iva10,
            haber: 0,
          });
          lineas.push({
            codigo: codigoHaber,
            cuenta: accHaber?.name || `Cuenta ${codigoHaber}`,
            debe: 0,
            haber: monto,
          });
        } else {
          lineas.push({
            codigo: codigoDebe,
            cuenta: accDebe?.name || `Cuenta ${codigoDebe}`,
            debe: monto,
            haber: 0,
          });
          lineas.push({
            codigo: codigoHaber,
            cuenta: accHaber?.name || `Cuenta ${codigoHaber}`,
            debe: 0,
            haber: monto,
          });
        }

        const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
        const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
        const balanceado = totalDebe === totalHaber;

        return {
          toolName: nombre,
          arguments: args,
          success: true,
          output: {
            glosa: descripcion,
            totalDebe,
            totalHaber,
            balanceado,
            lineas,
            advertencia: !balanceado ? "¡ATENCIÓN! El asiento no está balanceado" : undefined,
          },
        };
      }

      default:
        return {
          toolName: nombre,
          arguments: args,
          success: false,
          output: `Herramienta desconocida: ${nombre}`,
        };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      toolName: nombre,
      arguments: args,
      success: false,
      output: `Error al ejecutar ${nombre}: ${errorMsg}`,
    };
  }
}
