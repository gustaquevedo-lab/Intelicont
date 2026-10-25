/**
 * Formulario 500 (IRE General) e IRE Simple (Formulario 501)
 * Ley N° 6380/2019 de Modernización y Simplificación del Sistema Tributario Nacional
 *
 * Mapea cuentas contables de resultados (Clases 4 y 5) a los rubros oficiales de la DNIT
 * y determina la renta neta imponible y el impuesto liquidado a la tasa del 10%.
 */

export interface Form500Input {
  entityId: string;
  year: number;
  ingresosOperativos: number;
  otrosIngresos: number;
  costoVentas: number;
  gastosAdministracion: number;
  gastosPersonalIps: number;
  depreciacionesBienesUso: number;
  otrosGastosDeducibles: number;
  gastosNoDeducibles?: number;
  rentasExentas?: number;
  retencionesSufridas?: number;
  anticiposIngresados?: number;
}

export interface Form500Result {
  year: number;
  rubro1_TotalIngresos: number;
  rubro2_TotalCostos: number;
  rubro3_RentaBruta: number;
  rubro3_TotalGastos: number;
  rubro4_RentaNetaContable: number;
  rubro4_AjustesFiscalesPositivos: number;
  rubro4_AjustesFiscalesNegativos: number;
  rubro4_RentaNetaImponible: number;
  rubro5_TasaNominal: number; // 0.10
  rubro5_ImpuestoLiquidado: number;
  rubro6_CreditosFiscales: number; // Retenciones + Anticipos
  rubro6_SaldoAPagar: number;
  rubro6_SaldoAFavor: number;
}

export function calculateForm500(input: Form500Input): Form500Result {
  const totalIngresos = Math.max(0, input.ingresosOperativos + input.otrosIngresos);
  const totalCostos = Math.max(0, input.costoVentas);
  const rentaBruta = Math.max(0, totalIngresos - totalCostos);

  const totalGastos = Math.max(
    0,
    input.gastosAdministracion +
    input.gastosPersonalIps +
    input.depreciacionesBienesUso +
    input.otrosGastosDeducibles
  );

  const rentaNetaContable = rentaBruta - totalGastos;
  const noDeducibles = Math.max(0, input.gastosNoDeducibles ?? 0);
  const rentasExentas = Math.max(0, input.rentasExentas ?? 0);

  // Conciliación tributaria (Art. 9 y 14 Ley 6380)
  const rentaNetaImponible = Math.max(0, rentaNetaContable + noDeducibles - rentasExentas);
  const impuestoLiquidado = Math.round(rentaNetaImponible * 0.10);

  const creditos = Math.max(0, (input.retencionesSufridas ?? 0) + (input.anticiposIngresados ?? 0));
  const saldoImpuesto = impuestoLiquidado - creditos;

  const saldoAPagar = Math.max(0, saldoImpuesto);
  const saldoAFavor = Math.max(0, -saldoImpuesto);

  return {
    year: input.year,
    rubro1_TotalIngresos: totalIngresos,
    rubro2_TotalCostos: totalCostos,
    rubro3_RentaBruta: rentaBruta,
    rubro3_TotalGastos: totalGastos,
    rubro4_RentaNetaContable: rentaNetaContable,
    rubro4_AjustesFiscalesPositivos: noDeducibles,
    rubro4_AjustesFiscalesNegativos: rentasExentas,
    rubro4_RentaNetaImponible: rentaNetaImponible,
    rubro5_TasaNominal: 0.10,
    rubro5_ImpuestoLiquidado: impuestoLiquidado,
    rubro6_CreditosFiscales: creditos,
    rubro6_SaldoAPagar: saldoAPagar,
    rubro6_SaldoAFavor: saldoAFavor,
  };
}

export interface Form501SimpleInput {
  year: number;
  ingresosBrutos: number;
  egresosReales: number;
  retencionesSufridas?: number;
}

export interface Form501SimpleResult {
  year: number;
  ingresosBrutos: number;
  egresosReales: number;
  rentaReal: number;
  rentaPresunta: number; // 30% s/ Ingresos
  baseImponible: number; // La menor entre Real y Presunta
  impuestoLiquidado: number; // 10% s/ Base Imponible
  saldoAPagar: number;
}

export function calculateForm501Simple(input: Form501SimpleInput): Form501SimpleResult {
  const ingresos = Math.max(0, input.ingresosBrutos);
  const egresos = Math.max(0, input.egresosReales);
  const rentaReal = Math.max(0, ingresos - egresos);
  const rentaPresunta = Math.round(ingresos * 0.30);

  // Régimen Simple: Base imponible es la menor entre Renta Real y Presunta (Art. 26 Ley 6380)
  const baseImponible = Math.min(rentaReal, rentaPresunta);
  const impuestoLiquidado = Math.round(baseImponible * 0.10);
  const retenciones = Math.max(0, input.retencionesSufridas ?? 0);
  const saldoAPagar = Math.max(0, impuestoLiquidado - retenciones);

  return {
    year: input.year,
    ingresosBrutos: ingresos,
    egresosReales: egresos,
    rentaReal,
    rentaPresunta,
    baseImponible,
    impuestoLiquidado,
    saldoAPagar,
  };
}
