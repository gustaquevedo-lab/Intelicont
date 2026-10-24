/**
 * Base de Conocimiento Normativo y Tributario de la República del Paraguay (DNIT).
 * Utilizado por el motor RAG Híbrido de InteliCont para fundamentación legal de respuestas.
 */

export interface NormativaItem {
  id: string;
  fuente: "Ley 6380/2019" | "RG 90/2021" | "Ley 125/1991" | "Decreto 3107/2019" | "Decreto 3181/2019" | "Calendario DNIT" | "Técnica Contable";
  categoria: "IRE" | "IVA" | "IDU" | "IRP" | "RG90" | "CALENDARIO" | "CONTABILIDAD" | "SANCIONES";
  articulo: string;
  titulo: string;
  contenido: string;
  palabrasClave: string[];
}

export const NORMATIVAS_PARAGUAY: NormativaItem[] = [
  // ─── LEY 6380/2019: IRE ──────────────────────────────────────────────────
  {
    id: "ley-6380-art-16",
    fuente: "Ley 6380/2019",
    categoria: "IRE",
    articulo: "Artículo 16",
    titulo: "Gastos No Deducibles en el IRE",
    contenido: `No serán deducibles en la determinación de la Renta Neta Imponible del IRE:
1. Intereses moratorios, recargos y multas aplicadas por infracciones cometidas ante la DNIT u organismos públicos.
2. Gastos personales y de manutención del dueño, socios, accionistas, directores o sus familiares.
3. Donaciones que excedan el 1% (uno por ciento) del ingreso bruto gravado del ejercicio fiscal, y las realizadas a entidades no habilitadas por DNIT.
4. Gastos que carezcan de comprobantes legales debidamente timbrados o autorizados por el SIFEN / DNIT.
5. Gastos respaldados por comprobantes emitidos por proveedores con RUC en estado cancelado, suspendido o inactivo al momento de la operación.
6. Depreciaciones de activos fijos que superen los porcentajes máximos reglamentarios.
7. Gastos de representación que excedan el 1% (uno por ciento) de los ingresos brutos del ejercicio.`,
    palabrasClave: ["gastos no deducibles", "ire", "multas", "gastos personales", "donaciones", "comprobantes invalidos", "representacion", "art 16"]
  },
  {
    id: "ley-6380-art-17",
    fuente: "Ley 6380/2019",
    categoria: "IRE",
    articulo: "Artículo 17",
    titulo: "Tasa General del IRE",
    contenido: `La tasa general del Impuesto a la Renta Empresarial (IRE) será del 10% (diez por ciento) sobre la renta neta imponible determinada conforme a las disposiciones de la presente ley.`,
    palabrasClave: ["tasa ire", "alicuota ire", "10%", "renta empresarial", "art 17"]
  },
  {
    id: "ley-6380-art-21",
    fuente: "Ley 6380/2019",
    categoria: "IRE",
    articulo: "Artículo 21",
    titulo: "Remuneraciones a Dueños, Socios, Directores y Familiares",
    contenido: `Las remuneraciones por servicios prestados por el dueño, socios o directores serán deducibles en el IRE siempre que:
1. Se demuestre la efectiva prestación del servicio.
2. Hayan aportado al seguro social (IPS) o tributen IRP-RSP / IRE por dicho ingreso.
3. El importe se encuentre dentro de los límites razonables de mercado.`,
    palabrasClave: ["remuneraciones directores", "socios", "ips", "deduccion sueldos", "irp", "art 21"]
  },
  {
    id: "ley-6380-art-35",
    fuente: "Ley 6380/2019",
    categoria: "IRE",
    articulo: "Artículo 35",
    titulo: "Normas Especiales de Valoración - Precios de Transferencia",
    contenido: `Las operaciones realizadas entre partes vinculadas residentes y no residentes, o con entidades situadas en países de baja o nula tributación (paraísos fiscales), deberán ser pactadas a precios de mercado bajo el principio de plena competencia (arm's length), debiendo contar con el Estudio Técnico de Precios de Transferencia si superan el umbral establecido.`,
    palabrasClave: ["precios de transferencia", "partes vinculadas", "arms length", "baja tributacion", "art 35"]
  },

  // ─── LEY 6380/2019: IVA ──────────────────────────────────────────────────
  {
    id: "ley-6380-art-85",
    fuente: "Ley 6380/2019",
    categoria: "IVA",
    articulo: "Artículo 85",
    titulo: "Crédito Fiscal IVA y Requisitos de Admisibilidad",
    contenido: `El crédito fiscal IVA se integrará con el impuesto discriminado en los comprobantes de compra de bienes y servicios destinados directa o indistintamente a operaciones gravadas por el IVA.
Requisitos obligatorios:
1. Respaldo documental: comprobantes de venta válidos emitidos por SIFEN o timbrados por DNIT.
2. Necesidad del gasto: debe estar vinculado a la obtención de rentas gravadas.
3. Discriminación correcta del impuesto entre tasa 10%, tasa 5% y exento.
4. No genera crédito fiscal la adquisición de bienes o servicios destinados a operaciones exentas o no gravadas.`,
    palabrasClave: ["credito fiscal", "iva", "requisitos credito fiscal", "sifen", "operaciones gravadas", "art 85"]
  },
  {
    id: "ley-6380-art-86",
    fuente: "Ley 6380/2019",
    categoria: "IVA",
    articulo: "Artículo 86",
    titulo: "Tasas y Alícuotas del IVA en Paraguay",
    contenido: `La alícuota del IVA será:
a) Tasa del 10% (diez por ciento): Para la generalidad de las enajenaciones de bienes y prestaciones de servicios.
b) Tasa del 5% (cinco por ciento): Para productos de la canasta básica familiar (arroz, fideos, aceites, carnes, leche, harinas), productos agrícolas y pecuarios en estado natural, medicamentos de consumo humano y locación de inmuebles destinados exclusivamente a vivienda.
Fórmula oficial de desglose:
- IVA 10%: Total gravado / 11 (o Total * 10 / 11 para la base neta y Total / 11 para el impuesto).
- IVA 5%: Total gravado / 21 (o Total * 20 / 21 para la base neta y Total / 21 para el impuesto).`,
    palabrasClave: ["tasas iva", "iva 10%", "iva 5%", "alicuotas", "desglose iva", "dividido 11", "dividido 21", "art 86"]
  },
  {
    id: "ley-6380-art-88",
    fuente: "Ley 6380/2019",
    categoria: "IVA",
    articulo: "Artículo 88",
    titulo: "Regla de Prorrata del Crédito Fiscal IVA",
    contenido: `Cuando el contribuyente realice simultáneamente operaciones gravadas y operaciones no gravadas o exentas por el IVA:
1. Imputación Directa: El crédito fiscal de compras afectadas exclusivamente a operaciones gravadas se deduce al 100%. El afectado exclusivamente a exentas no se deduce.
2. Prorrata / Imputación Indistinta: Cuando los gastos afecten conjuntamente a ambas actividades, el crédito fiscal admisible se determinará proporcionalmente dividiendo el monto de operaciones gravadas entre el total de operaciones del ejercicio.`,
    palabrasClave: ["prorrata iva", "credito fiscal proporcional", "operaciones exentas", "imputacion indistinta", "art 88"]
  },

  // ─── RESOLUCIÓN GENERAL 90/2021: REGISTRO ELECTRÓNICO DE COMPROBANTES ───
  {
    id: "rg-90-art-1-3",
    fuente: "RG 90/2021",
    categoria: "RG90",
    articulo: "Artículos 1 y 3",
    titulo: "Registro Electrónico de Comprobantes de Compras y Ventas (Marangatú)",
    contenido: `La Resolución General N° 90/2021 implementa el Registro Electrónico de Comprobantes para los contribuyentes del IVA, IRE General, IRE Simple e IRP.
1. Obligación de registro mensual: Todos los comprobantes de compras y ventas recibidos y emitidos deben registrarse en el Sistema Marangatú.
2. Confirmación obligatoria: La confirmación mensual se realiza mediante la generación del Formulario N° 241 (Talón de Presentación de Registro de Comprobantes) y Formulario N° 242 (Talón Resumen).
3. Fecha de confirmación: Vence según el calendario de vencimientos de la DNIT en el mes siguiente al período fiscal informado.`,
    palabrasClave: ["rg 90", "formulario 241", "formulario 242", "talon de presentacion", "registro comprobantes", "marangatu", "art 1", "art 3"]
  },
  {
    id: "rg-90-art-6",
    fuente: "RG 90/2021",
    categoria: "RG90",
    articulo: "Artículo 6",
    titulo: "Imputación Preceptiva del Gasto y Tipo de Comprobante",
    contenido: `Al registrar cada comprobante de compra o venta en RG 90, el contribuyente debe indicar obligatoriamente:
- Tipo de comprobante (1: Factura, 4: Nota de Crédito, 5: Nota de Débito, 6: Autofactura, 7: Comprobante de Retención).
- Modalidad: Electrónico (SIFEN), Virtual o Preimpreso/Autoimpresor.
- Imputación tributaria: IVA, IRE General, IRE Simple o IRP según corresponda.
- La imputación incorrecta puede provocar diferencias en las cruces automáticas de la DNIT e inhabilitar el crédito fiscal.`,
    palabrasClave: ["imputacion tributaria", "tipo comprobante", "nota de credito", "factura sifen", "modalidad", "art 6"]
  },
  {
    id: "rg-90-art-16",
    fuente: "RG 90/2021",
    categoria: "RG90",
    articulo: "Artículo 16",
    titulo: "Derogación del Régimen HECHAUKA para Compras y Ventas",
    contenido: `A partir del 1 de enero de 2022 quedan derogadas las disposiciones de la RG N° 48/2014 (HECHAUKA) referidas a la presentación de libros de compras y ventas (Formularios 211 y 221).
HECHAUKA subsiste únicamente para la presentación de Estados Financieros (informe de auditoría externa y balances anuales) y Precios de Transferencia. En InteliCont, los libros de compras y ventas se generan conforme a la estructura de la RG 90/2021.`,
    palabrasClave: ["derogacion hechauka", "rg 48", "hechauka vs rg 90", "libros compras ventas", "art 16"]
  },

  // ─── DECRETO 3107/2019: RETENCIONES TESAKÂ ──────────────────────────────
  {
    id: "dec-3107-retenciones",
    fuente: "Decreto 3107/2019",
    categoria: "IVA",
    articulo: "Capítulo de Retenciones",
    titulo: "Régimen de Retenciones de IVA (Tesakâ)",
    contenido: `Los agentes de retención designados por la DNIT deberán practicar retenciones de IVA a través del Software Tesakâ:
- Retención general: 30% (treinta por ciento) del IVA incluido en la factura del proveedor domiciliado.
- Proveedores del Estado y grandes contribuyentes: porcentajes específicos según categoría.
- Proveedores no domiciliados: retención del 100% del IVA.
- Plazo de emisión: El Comprobante de Retención Virtual debe emitirse dentro de los primeros 5 días hábiles del mes siguiente o en el momento del pago.`,
    palabrasClave: ["retenciones iva", "tesaka", "30% iva", "agente de retencion", "comprobante virtual retencion"]
  },

  // ─── LEY 125/1991: SANCIONES Y MULTAS ────────────────────────────────────
  {
    id: "ley-125-art-175",
    fuente: "Ley 125/1991",
    categoria: "SANCIONES",
    articulo: "Artículo 175",
    titulo: "Infracción por Omisión de Pago y Multas Moratorias",
    contenido: `La omisión del pago de tributos debidos configurará infracción sujeta a:
1. Multa por omisión general: 50% (cincuenta por ciento) del impuesto omitido.
2. Multa por reincidencia o contumacia debidamente comprobada: 100% (cien por ciento) del impuesto omitido.
3. Intereses moratorios: se devengarán mes a mes o fracción de mes sobre el tributo impago según la tasa fijada por el Ministerio de Economía y Finanzas / DNIT.`,
    palabrasClave: ["multa omision", "50% impuesto omitido", "100% contumacia", "intereses moratorios", "art 175"]
  },
  {
    id: "ley-125-art-218",
    fuente: "Ley 125/1991",
    categoria: "SANCIONES",
    articulo: "Artículo 218 y 219",
    titulo: "Plazos de Prescripción Tributaria",
    contenido: `Prescripción en Paraguay:
- La acción de cobro de deudas líquidas prescribe a los 5 (cinco) años contados a partir del 1 de enero del año siguiente a su exigibilidad.
- La facultad de determinación de oficio de la DNIT prescribe a los 3 (tres) años a partir del año siguiente al vencimiento de la declaración jurada.`,
    palabrasClave: ["prescripcion", "5 años cobro", "3 años fiscalizacion", "art 218", "art 219"]
  },

  // ─── CALENDARIO PERPETUO DNIT ───────────────────────────────────────────
  {
    id: "calendario-dnit-perpetuo",
    fuente: "Calendario DNIT",
    categoria: "CALENDARIO",
    articulo: "Resolución 49/2014 y Res. 11/2019",
    titulo: "Calendario Perpetuo de Vencimientos Tributarios según RUC",
    contenido: `Las fechas de vencimiento de las declaraciones juradas mensuales (IVA Form. 120, RG 90 Form. 241, Retenciones Tesakâ) vencen según el último dígito del RUC (sin considerar el dígito verificador):
- Terminación 0: Día 7 de cada mes.
- Terminación 1: Día 9 de cada mes.
- Terminación 2: Día 11 de cada mes.
- Terminación 3: Día 13 de cada mes.
- Terminación 4: Día 15 de cada mes.
- Terminación 5: Día 17 de cada mes.
- Terminación 6: Día 19 de cada mes.
- Terminación 7: Día 21 de cada mes.
- Terminación 8: Día 23 de cada mes.
- Terminación 9: Día 25 de cada mes.
Si la fecha de vencimiento coincide con un día inhábil (sábado, domingo o feriado oficial), se prorroga automáticamente al primer día hábil siguiente.`,
    palabrasClave: ["calendario vencimiento", "terminacion ruc", "dia 7", "dia 9", "dia 11", "dia 25", "iva 120", "vencimientos dnit"]
  },

  // ─── TÉCNICA CONTABLE Y PARTIDA DOBLE ───────────────────────────────────
  {
    id: "contabilidad-partida-doble",
    fuente: "Técnica Contable",
    categoria: "CONTABILIDAD",
    articulo: "Principios de Contabilidad Generalmente Aceptados en Paraguay",
    titulo: "Estructura del Plan de Cuentas y Partida Doble en InteliCont",
    contenido: `En el sistema contable de InteliCont:
1. Partida Doble Obligatoria: La suma de los débitos debe ser exactamente igual a la suma de los créditos (Total Debe === Total Haber). Los montos monetarios se expresan en guaraníes enteros (bigint).
2. Estructura del Plan de Cuentas PY:
   - 1. Activo (Naturaleza Deudora: Aumenta al Debe, Disminuye al Haber).
     - 1.1.1.01 Caja Chica / Recaudaciones
     - 1.1.1.02 Bancos Cuentas Corrientes
     - 1.1.2.01 Clientes Locales
     - 1.1.3.01 Crédito Fiscal IVA 10%
     - 1.1.3.02 Crédito Fiscal IVA 5%
   - 2. Pasivo (Naturaleza Acreedora: Aumenta al Haber, Disminuye al Debe).
     - 2.1.1.01 Proveedores Locales
     - 2.1.2.01 Débito Fiscal IVA 10%
     - 2.1.2.02 Débito Fiscal IVA 5%
     - 2.1.3.01 Retenciones de Impuestos a Pagar (Tesakâ)
   - 3. Patrimonio Neto (Naturaleza Acreedora).
   - 4. Ingresos (Naturaleza Acreedora):
     - 4.1.1.01 Ventas Gravadas 10%
     - 4.1.1.02 Ventas Gravadas 5%
     - 4.1.1.03 Ventas Exentas
   - 5. Costos y Gastos (Naturaleza Deudora):
     - 5.1.1.01 Costo de Mercaderías Vendidas
     - 5.2.1.xx Gastos de Administración y Operativos`,
    palabrasClave: ["partida doble", "plan de cuentas", "activo", "pasivo", "debe y haber", "asiento contable", "iva debito", "iva credito"]
  }
];
