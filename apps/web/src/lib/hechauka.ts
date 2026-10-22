/**
 * Hechauka — Libro Electrónico de Compras y Ventas (DNIT Paraguay)
 *
 * Generates CSV files in the format required by the DNIT for monthly
 * electronic book submissions (RG 90/2021 and updates).
 */

export interface HechaukaCompra {
  fecha: string;           // DD/MM/AAAA
  timbrado: string;        // 8 digits
  cdc: string;             // 44 digits
  rucProveedor: string;    // RUC without DV
  dvProveedor: string;     // Single digit
  nombreProveedor: string;
  tipoComprobante: string; // 1=Factura, 2=NC, 3=ND
  numeroComprobante: string;
  condicion: string;       // 1=Contado, 2=Crédito
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
}

export interface HechaukaVenta {
  fecha: string;
  timbrado: string;
  cdc: string;
  rucCliente: string;
  dvCliente: string;
  nombreCliente: string;
  tipoComprobante: string;
  numeroComprobante: string;
  condicion: string;
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
}

const MOCK_COMPRAS: HechaukaCompra[] = [
  {
    fecha: "01/05/2026", timbrado: "12345678",
    cdc: "12345678901234567890123456789012345678901234",
    rucProveedor: "80012345", dvProveedor: "1",
    nombreProveedor: "Importadora del Este S.A.",
    tipoComprobante: "1", numeroComprobante: "001-001-00234",
    condicion: "2", gravado10: 10000000, gravado5: 0, exento: 0,
    iva10: 1000000, iva5: 0, total: 11000000,
  },
  {
    fecha: "03/05/2026", timbrado: "23456789",
    cdc: "23456789012345678901234567890123456789012345",
    rucProveedor: "4567890", dvProveedor: "1",
    nombreProveedor: "Servicios Contables del Paraguay",
    tipoComprobante: "1", numeroComprobante: "002-001-00089",
    condicion: "2", gravado10: 2500000, gravado5: 0, exento: 0,
    iva10: 250000, iva5: 0, total: 2750000,
  },
  {
    fecha: "05/05/2026", timbrado: "34567890",
    cdc: "34567890123456789012345678901234567890123456",
    rucProveedor: "1234567", dvProveedor: "8",
    nombreProveedor: "Distribuciones Ñandutí S.A.",
    tipoComprobante: "2", numeroComprobante: "001-001-00056",
    condicion: "2", gravado10: -500000, gravado5: 0, exento: 0,
    iva10: -50000, iva5: 0, total: -550000,
  },
];

const MOCK_VENTAS: HechaukaVenta[] = [
  {
    fecha: "10/05/2026", timbrado: "11111111",
    cdc: "11111111111111111111111111111111111111111111",
    rucCliente: "3456789", dvCliente: "0",
    nombreCliente: "Comercial Paraguaya S.A.",
    tipoComprobante: "1", numeroComprobante: "001-001-00001",
    condicion: "2", gravado10: 5500000, gravado5: 0, exento: 0,
    iva10: 550000, iva5: 0, total: 6050000,
  },
];

export interface HechaukaResumen {
  comprasGravado10: number;
  comprasGravado5: number;
  comprasExento: number;
  comprasIva10: number;
  comprasIva5: number;
  comprasTotal: number;
  ventasGravado10: number;
  ventasGravado5: number;
  ventasExento: number;
  ventasIva10: number;
  ventasIva5: number;
  ventasTotal: number;
}

export function getHechaukaCompras(): HechaukaCompra[] {
  return MOCK_COMPRAS;
}

export function getHechaukaVentas(): HechaukaVenta[] {
  return MOCK_VENTAS;
}

export function getHechaukaResumen(): HechaukaResumen {
  const compras = MOCK_COMPRAS;
  const ventas = MOCK_VENTAS;

  return {
    comprasGravado10: compras.reduce((s, c) => s + c.gravado10, 0),
    comprasGravado5: compras.reduce((s, c) => s + c.gravado5, 0),
    comprasExento: compras.reduce((s, c) => s + c.exento, 0),
    comprasIva10: compras.reduce((s, c) => s + c.iva10, 0),
    comprasIva5: compras.reduce((s, c) => s + c.iva5, 0),
    comprasTotal: compras.reduce((s, c) => s + c.total, 0),
    ventasGravado10: ventas.reduce((s, v) => s + v.gravado10, 0),
    ventasGravado5: ventas.reduce((s, v) => s + v.gravado5, 0),
    ventasExento: ventas.reduce((s, v) => s + v.exento, 0),
    ventasIva10: ventas.reduce((s, v) => s + v.iva10, 0),
    ventasIva5: ventas.reduce((s, v) => s + v.iva5, 0),
    ventasTotal: ventas.reduce((s, v) => s + v.total, 0),
  };
}

export function generateHechaukaCSV(
  compras: HechaukaCompra[],
  ventas: HechaukaVenta[]
): { comprasCSV: string; ventasCSV: string } {
  const comprasHeader = "Fecha;Timbrado;CDC;RUC Proveedor;DV;Nombre Proveedor;Tipo;Nro Comprobante;Condicion;Gravado 10%;Gravado 5%;Exento;IVA 10%;IVA 5%;Total";
  const comprasRows = compras.map((c) =>
    `${c.fecha};${c.timbrado};${c.cdc};${c.rucProveedor};${c.dvProveedor};${c.nombreProveedor};${c.tipoComprobante};${c.numeroComprobante};${c.condicion};${c.gravado10};${c.gravado5};${c.exento};${c.iva10};${c.iva5};${c.total}`
  );
  const comprasCSV = [comprasHeader, ...comprasRows].join("\n");

  const ventasHeader = "Fecha;Timbrado;CDC;RUC Cliente;DV;Nombre Cliente;Tipo;Nro Comprobante;Condicion;Gravado 10%;Gravado 5%;Exento;IVA 10%;IVA 5%;Total";
  const ventasRows = ventas.map((v) =>
    `${v.fecha};${v.timbrado};${v.cdc};${v.rucCliente};${v.dvCliente};${v.nombreCliente};${v.tipoComprobante};${v.numeroComprobante};${v.condicion};${v.gravado10};${v.gravado5};${v.exento};${v.iva10};${v.iva5};${v.total}`
  );
  const ventasCSV = [ventasHeader, ...ventasRows].join("\n");

  return { comprasCSV, ventasCSV };
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadHechauka(period: string): void {
  const compras = getHechaukaCompras();
  const ventas = getHechaukaVentas();
  const { comprasCSV, ventasCSV } = generateHechaukaCSV(compras, ventas);

  downloadCSV(comprasCSV, `Hechauka_Compras_${period}.csv`);
  downloadCSV(ventasCSV, `Hechauka_Ventas_${period}.csv`);
}
