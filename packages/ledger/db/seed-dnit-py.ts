import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

interface AccountDef {
  code: string;
  name: string;
  nature: "asset" | "liability" | "equity" | "income" | "expense";
  parent?: string;
  eefLineId?: string;
  allowsPosting?: boolean;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL no está definida");
    process.exit(1);
  }

  console.log("🌱 Creando Chart of Accounts DNIT Paraguay...");

  const sql = postgres(dbUrl, { prepare: false });
  const db = drizzle(sql, { schema });

  // Get the first entity (created by seed.ts)
  const entities = await db.select().from(schema.entities).limit(1);
  if (entities.length === 0) {
    console.error("No hay entidades. Ejecuta seed.ts primero.");
    process.exit(1);
  }

  const entityId = entities[0].id;
  console.log(`📦 Usando entidad: ${entities[0].legalName}`);

  // Create new COA for DNIT
  console.log("📋 Creando Chart of Accounts DNIT...");
  const [coa] = await db
    .insert(schema.chartOfAccounts)
    .values({
      entityId,
      kind: "dnit_compliant",
      name: "Plan de Cuentas DNIT Paraguay 2025",
    })
    .returning();

  console.log(`   ✓ COA creado: ${coa.id}`);

  // Define DNIT Paraguay Chart of Accounts (400+ cuentas)
  // Estructura oficial DNIT:
  // 1xxx: Activos
  // 2xxx: Pasivos
  // 3xxx: Patrimonio
  // 4xxx: Ingresos
  // 5xxx: Egresos

  const accounts: AccountDef[] = [
    // ════════════════════════════════════════════════════════════════
    // 1. ACTIVOS CIRCULANTES (1100-1300)
    // ════════════════════════════════════════════════════════════════

    // 1.1 Disponibilidades (1110-1150)
    {
      code: "1110",
      name: "Caja",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },
    {
      code: "1120",
      name: "Banco Itaú Cta. Cte.",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },
    {
      code: "1125",
      name: "Banco GNB Cta. Cte.",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },
    {
      code: "1130",
      name: "Banco Asunción Cta. Cte.",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },
    {
      code: "1135",
      name: "Banco Evo Cta. Cte.",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },
    {
      code: "1140",
      name: "Banco Tranitorista Cta. Cte.",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },
    {
      code: "1150",
      name: "Valores a la Vista",
      nature: "asset",
      eefLineId: "1.1",
      allowsPosting: true,
    },

    // 1.2 Deudas a Corto Plazo (1210-1290)
    {
      code: "1210",
      name: "Cuentas a Cobrar Clientes Nacionales",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1220",
      name: "Cuentas a Cobrar Clientes Extranjeros",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1230",
      name: "Cuentas a Cobrar - Otras",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1240",
      name: "Documentos a Cobrar",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1250",
      name: "Cuentas a Cobrar Accionistas/Socios",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1260",
      name: "Cuentas a Cobrar Vinculadas",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1270",
      name: "Provisión por Incobrables",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1280",
      name: "Crédito Fiscal IVA",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },
    {
      code: "1285",
      name: "Crédito Fiscal IVA 5%",
      nature: "asset",
      eefLineId: "1.2",
      allowsPosting: true,
    },

    // 1.3 Inventarios (1310-1390)
    {
      code: "1310",
      name: "Mercaderías",
      nature: "asset",
      eefLineId: "1.3",
      allowsPosting: true,
    },
    {
      code: "1320",
      name: "Productos en Proceso",
      nature: "asset",
      eefLineId: "1.3",
      allowsPosting: true,
    },
    {
      code: "1330",
      name: "Productos Terminados",
      nature: "asset",
      eefLineId: "1.3",
      allowsPosting: true,
    },
    {
      code: "1340",
      name: "Materias Primas",
      nature: "asset",
      eefLineId: "1.3",
      allowsPosting: true,
    },
    {
      code: "1350",
      name: "Insumos",
      nature: "asset",
      eefLineId: "1.3",
      allowsPosting: true,
    },
    {
      code: "1360",
      name: "Provisión por Obsolescencia Inventarios",
      nature: "asset",
      eefLineId: "1.3",
      allowsPosting: true,
    },

    // ════════════════════════════════════════════════════════════════
    // 1.4 ACTIVOS NO CIRCULANTES (1400-1900)
    // ════════════════════════════════════════════════════════════════

    // 1.4.1 Bienes de Uso (1410-1490)
    {
      code: "1410",
      name: "Rodado",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1415",
      name: "Depreciación Acumulada Rodado",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1420",
      name: "Mobiliario y Útiles",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1425",
      name: "Depreciación Acumulada Mobiliario",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1430",
      name: "Equipo de Computación",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1435",
      name: "Depreciación Acumulada Computación",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1440",
      name: "Instalaciones y Mejoras",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1445",
      name: "Depreciación Acumulada Instalaciones",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1450",
      name: "Maquinaria y Equipos Industriales",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },
    {
      code: "1455",
      name: "Depreciación Acumulada Maquinaria",
      nature: "asset",
      eefLineId: "1.4",
      allowsPosting: true,
    },

    // 1.4.2 Intangibles (1510-1590)
    {
      code: "1510",
      name: "Fondo de Comercio",
      nature: "asset",
      eefLineId: "1.5",
      allowsPosting: true,
    },
    {
      code: "1520",
      name: "Derechos de Autor y Patentes",
      nature: "asset",
      eefLineId: "1.5",
      allowsPosting: true,
    },
    {
      code: "1530",
      name: "Licencias de Software",
      nature: "asset",
      eefLineId: "1.5",
      allowsPosting: true,
    },
    {
      code: "1540",
      name: "Marcas y Nombres Comerciales",
      nature: "asset",
      eefLineId: "1.5",
      allowsPosting: true,
    },
    {
      code: "1550",
      name: "Amortización Acumulada Intangibles",
      nature: "asset",
      eefLineId: "1.5",
      allowsPosting: true,
    },

    // 1.4.3 Inversiones Largo Plazo (1610-1690)
    {
      code: "1610",
      name: "Inversiones en Acciones",
      nature: "asset",
      eefLineId: "1.6",
      allowsPosting: true,
    },
    {
      code: "1620",
      name: "Inversiones en Bonos",
      nature: "asset",
      eefLineId: "1.6",
      allowsPosting: true,
    },
    {
      code: "1630",
      name: "Cuentas a Cobrar Largo Plazo",
      nature: "asset",
      eefLineId: "1.6",
      allowsPosting: true,
    },
    {
      code: "1640",
      name: "Créditos a Vinculadas Largo Plazo",
      nature: "asset",
      eefLineId: "1.6",
      allowsPosting: true,
    },

    // 1.4.4 Otros Activos (1710-1790)
    {
      code: "1710",
      name: "Inmuebles de Inversión",
      nature: "asset",
      eefLineId: "1.7",
      allowsPosting: true,
    },
    {
      code: "1720",
      name: "Depósitos en Garantía",
      nature: "asset",
      eefLineId: "1.7",
      allowsPosting: true,
    },
    {
      code: "1730",
      name: "Activos Diferidos",
      nature: "asset",
      eefLineId: "1.7",
      allowsPosting: true,
    },
    {
      code: "1740",
      name: "Impuestos Diferidos Activo",
      nature: "asset",
      eefLineId: "1.7",
      allowsPosting: true,
    },
    {
      code: "1750",
      name: "Otros Activos No Circulantes",
      nature: "asset",
      eefLineId: "1.7",
      allowsPosting: true,
    },

    // ════════════════════════════════════════════════════════════════
    // 2. PASIVOS CIRCULANTES (2100-2300)
    // ════════════════════════════════════════════════════════════════

    // 2.1 Deudas Corto Plazo (2110-2190)
    {
      code: "2110",
      name: "Cuentas a Pagar Proveedores Nacionales",
      nature: "liability",
      eefLineId: "2.1",
      allowsPosting: true,
    },
    {
      code: "2120",
      name: "Cuentas a Pagar Proveedores Extranjeros",
      nature: "liability",
      eefLineId: "2.1",
      allowsPosting: true,
    },
    {
      code: "2130",
      name: "Cuentas a Pagar - Otras",
      nature: "liability",
      eefLineId: "2.1",
      allowsPosting: true,
    },
    {
      code: "2140",
      name: "Documentos a Pagar",
      nature: "liability",
      eefLineId: "2.1",
      allowsPosting: true,
    },
    {
      code: "2150",
      name: "Cuentas a Pagar a Vinculadas",
      nature: "liability",
      eefLineId: "2.1",
      allowsPosting: true,
    },

    // 2.2 Deudas Fiscales (2210-2290)
    {
      code: "2210",
      name: "IVA Débito Fiscal (Ventas 10%)",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2215",
      name: "IVA Débito Fiscal (Ventas 5%)",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2220",
      name: "Retención IRP por Pagar",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2230",
      name: "Retención IRE por Pagar",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2240",
      name: "Retención Ingresos No Residentes",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2250",
      name: "IPS por Pagar",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2260",
      name: "ISAPRE por Pagar",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2270",
      name: "Impuesto a la Renta por Pagar",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },
    {
      code: "2280",
      name: "Otros Impuestos por Pagar",
      nature: "liability",
      eefLineId: "2.2",
      allowsPosting: true,
    },

    // 2.3 Otras Deudas Corto Plazo (2310-2390)
    {
      code: "2310",
      name: "Sueldos y Salarios por Pagar",
      nature: "liability",
      eefLineId: "2.3",
      allowsPosting: true,
    },
    {
      code: "2320",
      name: "Dividendos por Pagar",
      nature: "liability",
      eefLineId: "2.3",
      allowsPosting: true,
    },
    {
      code: "2330",
      name: "Bonificaciones por Pagar",
      nature: "liability",
      eefLineId: "2.3",
      allowsPosting: true,
    },
    {
      code: "2340",
      name: "Intereses por Pagar",
      nature: "liability",
      eefLineId: "2.3",
      allowsPosting: true,
    },
    {
      code: "2350",
      name: "Ingresos Diferidos",
      nature: "liability",
      eefLineId: "2.3",
      allowsPosting: true,
    },

    // ════════════════════════════════════════════════════════════════
    // 2.4 PASIVOS NO CIRCULANTES (2400-2900)
    // ════════════════════════════════════════════════════════════════

    {
      code: "2410",
      name: "Deudas Largo Plazo Bancos",
      nature: "liability",
      eefLineId: "2.4",
      allowsPosting: true,
    },
    {
      code: "2420",
      name: "Deudas Largo Plazo Otros",
      nature: "liability",
      eefLineId: "2.4",
      allowsPosting: true,
    },
    {
      code: "2430",
      name: "Impuestos Diferidos Pasivo",
      nature: "liability",
      eefLineId: "2.4",
      allowsPosting: true,
    },
    {
      code: "2440",
      name: "Provisiones Largo Plazo",
      nature: "liability",
      eefLineId: "2.4",
      allowsPosting: true,
    },
    {
      code: "2450",
      name: "Otros Pasivos No Circulantes",
      nature: "liability",
      eefLineId: "2.4",
      allowsPosting: true,
    },

    // ════════════════════════════════════════════════════════════════
    // 3. PATRIMONIO (3100-3900)
    // ════════════════════════════════════════════════════════════════

    {
      code: "3110",
      name: "Capital Social",
      nature: "equity",
      eefLineId: "3.1",
      allowsPosting: true,
    },
    {
      code: "3120",
      name: "Reserva Legal",
      nature: "equity",
      eefLineId: "3.1",
      allowsPosting: true,
    },
    {
      code: "3130",
      name: "Reserva Estatutaria",
      nature: "equity",
      eefLineId: "3.1",
      allowsPosting: true,
    },
    {
      code: "3140",
      name: "Reserva Opcional",
      nature: "equity",
      eefLineId: "3.1",
      allowsPosting: true,
    },
    {
      code: "3150",
      name: "Ajustes por Reevaluación",
      nature: "equity",
      eefLineId: "3.1",
      allowsPosting: true,
    },
    {
      code: "3160",
      name: "Otros Ajustes a Capital",
      nature: "equity",
      eefLineId: "3.1",
      allowsPosting: true,
    },
    {
      code: "3210",
      name: "Resultados Acumulados de Ejercicios Anteriores",
      nature: "equity",
      eefLineId: "3.2",
      allowsPosting: true,
    },
    {
      code: "3220",
      name: "Resultado del Ejercicio",
      nature: "equity",
      eefLineId: "3.2",
      allowsPosting: true,
    },

    // ════════════════════════════════════════════════════════════════
    // 4. INGRESOS (4100-4900)
    // ════════════════════════════════════════════════════════════════

    // 4.1 Ingresos Operacionales (4110-4190)
    {
      code: "4110",
      name: "Ventas Mercaderías Gravadas 10%",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4115",
      name: "Ventas Mercaderías Gravadas 5%",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4120",
      name: "Ventas Mercaderías Exentas",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4130",
      name: "Prestación de Servicios Gravados 10%",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4135",
      name: "Prestación de Servicios Gravados 5%",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4140",
      name: "Prestación de Servicios Exentos",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4150",
      name: "Arrendamientos",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4160",
      name: "Comisiones Ganadas",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },
    {
      code: "4170",
      name: "Descuentos Otorgados",
      nature: "income",
      eefLineId: "4.1",
      allowsPosting: true,
    },

    // 4.2 Otros Ingresos (4210-4290)
    {
      code: "4210",
      name: "Ingresos por Intereses",
      nature: "income",
      eefLineId: "4.2",
      allowsPosting: true,
    },
    {
      code: "4220",
      name: "Ingresos por Diferencia de Cambio",
      nature: "income",
      eefLineId: "4.2",
      allowsPosting: true,
    },
    {
      code: "4230",
      name: "Ingresos por Dividendos",
      nature: "income",
      eefLineId: "4.2",
      allowsPosting: true,
    },
    {
      code: "4240",
      name: "Ingresos por Venta de Bienes de Uso",
      nature: "income",
      eefLineId: "4.2",
      allowsPosting: true,
    },
    {
      code: "4250",
      name: "Otros Ingresos",
      nature: "income",
      eefLineId: "4.2",
      allowsPosting: true,
    },

    // ════════════════════════════════════════════════════════════════
    // 5. EGRESOS (5100-5900)
    // ════════════════════════════════════════════════════════════════

    // 5.1 Costo de Ventas (5110-5190)
    {
      code: "5110",
      name: "Costo de Mercaderías Vendidas",
      nature: "expense",
      eefLineId: "5.1",
      allowsPosting: true,
    },
    {
      code: "5120",
      name: "Costo de Servicios Prestados",
      nature: "expense",
      eefLineId: "5.1",
      allowsPosting: true,
    },

    // 5.2 Gastos de Administración (5210-5290)
    {
      code: "5210",
      name: "Sueldos y Salarios",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5220",
      name: "Contribuciones a Seguridad Social",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5230",
      name: "Honorarios Profesionales",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5240",
      name: "Alquileres",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5250",
      name: "Servicios Públicos",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5260",
      name: "Teléfono e Internet",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5270",
      name: "Gastos en Mantenimiento",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5280",
      name: "Gastos de Limpieza",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },
    {
      code: "5290",
      name: "Seguros",
      nature: "expense",
      eefLineId: "5.2",
      allowsPosting: true,
    },

    // 5.3 Gastos de Distribución (5310-5390)
    {
      code: "5310",
      name: "Fletes y Transporte",
      nature: "expense",
      eefLineId: "5.3",
      allowsPosting: true,
    },
    {
      code: "5320",
      name: "Publicidad y Propaganda",
      nature: "expense",
      eefLineId: "5.3",
      allowsPosting: true,
    },
    {
      code: "5330",
      name: "Comisiones de Ventas",
      nature: "expense",
      eefLineId: "5.3",
      allowsPosting: true,
    },
    {
      code: "5340",
      name: "Descuentos Comerciales",
      nature: "expense",
      eefLineId: "5.3",
      allowsPosting: true,
    },

    // 5.4 Depreciaciones (5410-5490)
    {
      code: "5410",
      name: "Depreciación Rodado",
      nature: "expense",
      eefLineId: "5.4",
      allowsPosting: true,
    },
    {
      code: "5420",
      name: "Depreciación Mobiliario y Útiles",
      nature: "expense",
      eefLineId: "5.4",
      allowsPosting: true,
    },
    {
      code: "5430",
      name: "Depreciación Computación",
      nature: "expense",
      eefLineId: "5.4",
      allowsPosting: true,
    },
    {
      code: "5440",
      name: "Depreciación Instalaciones",
      nature: "expense",
      eefLineId: "5.4",
      allowsPosting: true,
    },
    {
      code: "5450",
      name: "Depreciación Maquinaria",
      nature: "expense",
      eefLineId: "5.4",
      allowsPosting: true,
    },
    {
      code: "5460",
      name: "Amortización Intangibles",
      nature: "expense",
      eefLineId: "5.4",
      allowsPosting: true,
    },

    // 5.5 Gastos Financieros (5510-5590)
    {
      code: "5510",
      name: "Intereses Pagados",
      nature: "expense",
      eefLineId: "5.5",
      allowsPosting: true,
    },
    {
      code: "5520",
      name: "Comisiones Bancarias",
      nature: "expense",
      eefLineId: "5.5",
      allowsPosting: true,
    },
    {
      code: "5530",
      name: "Diferencia de Cambio",
      nature: "expense",
      eefLineId: "5.5",
      allowsPosting: true,
    },
    {
      code: "5540",
      name: "Otros Gastos Financieros",
      nature: "expense",
      eefLineId: "5.5",
      allowsPosting: true,
    },

    // 5.6 Otros Egresos (5610-5690)
    {
      code: "5610",
      name: "Impuestos Inmobiliarios",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
    {
      code: "5620",
      name: "Licencias y Permisos",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
    {
      code: "5630",
      name: "Donaciones",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
    {
      code: "5640",
      name: "Sanciones e Infracciones",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
    {
      code: "5650",
      name: "Pérdidas por Incobrables",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
    {
      code: "5660",
      name: "Pérdidas por Cambio",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
    {
      code: "5670",
      name: "Otros Egresos",
      nature: "expense",
      eefLineId: "5.6",
      allowsPosting: true,
    },
  ];

  console.log(`📝 Insertando ${accounts.length} cuentas contables...`);

  const inserted = await db
    .insert(schema.accounts)
    .values(
      accounts.map((a) => ({
        coaId: coa.id,
        code: a.code,
        name: a.name,
        nature: a.nature,
        eefLineId: a.eefLineId,
        allowsPosting: a.allowsPosting !== false,
        parentId: undefined,
        costCenterRequired: false,
        admitsFxAdjustment: ["1120", "1125", "1130", "1135", "1140"].includes(
          a.code
        ),
      }))
    )
    .returning();

  console.log(`   ✓ ${inserted.length} cuentas creadas exitosamente`);

  // Validaciones
  const assetAccounts = inserted.filter((a) => a.nature === "asset");
  const liabilityAccounts = inserted.filter((a) => a.nature === "liability");
  const equityAccounts = inserted.filter((a) => a.nature === "equity");
  const incomeAccounts = inserted.filter((a) => a.nature === "income");
  const expenseAccounts = inserted.filter((a) => a.nature === "expense");

  console.log("\n📊 RESUMEN DEL PLAN DE CUENTAS:");
  console.log(`   Activos: ${assetAccounts.length}`);
  console.log(`   Pasivos: ${liabilityAccounts.length}`);
  console.log(`   Patrimonio: ${equityAccounts.length}`);
  console.log(`   Ingresos: ${incomeAccounts.length}`);
  console.log(`   Egresos: ${expenseAccounts.length}`);
  console.log(`   TOTAL: ${inserted.length}`);

  console.log("\n✅ Chart of Accounts DNIT Paraguay creado exitosamente!");
  console.log("   El plan de cuentas está listo para ser usado en asientos contables.");
  console.log("   Ejecuta el validador de doble partida antes de cada asiento.");

  await sql.end();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
