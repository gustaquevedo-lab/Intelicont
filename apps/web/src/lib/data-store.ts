"use client";

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────

export interface Empresa {
  id: string; ruc: string; nombre: string; nombreComercial: string | null;
  regimen: string; estado: string; baseCurrency: string;
  taxRegimes: string[];
}

export interface Cuenta {
  id: string; code: string; name: string; nature: "asset" | "liability" | "equity" | "income" | "expense";
  parentCode: string | null; allowsPosting: boolean; balance: number; currency: string; active: boolean;
  children?: Cuenta[];
}

export interface Tercero {
  id: string; tipo: "cliente" | "proveedor" | "ambos"; ruc: string; razonSocial: string;
  nombreFantasia: string | null; direccion: string | null; ciudad: string | null;
  telefono: string | null; email: string | null; regimen: string; ivaCondition: string;
  retenciones: { tipo: string; tasa: number }[] | null;
  saldo: number; ultimaOperacion: string; estado: "activo" | "inactivo";
}

export interface Asiento {
  id: string; numero: string; fecha: string; empresa: string; origen: string;
  estado: string; descripcion: string; total: number; lineas: LineaAsiento[];
  sugerenciaIA: boolean; revertidoDe: string | null; posteadoAt: string | null;
}

export interface LineaAsiento {
  cuenta: string; nombreCuenta: string; debito: number; credito: number; descripcion: string;
}

export interface IVAEntry {
  id: string; fecha: string; numero: string; tipo: string; ruc: string; nombre: string;
  gravado10: number; gravado5: number; exento: number; iva10: number; iva5: number; total: number;
  cdc?: string;
}

export interface DiarioEntry {
  id: string; fecha: string; numero: string; cuenta: string; nombreCuenta: string;
  debito: number; credito: number; descripcion: string; origen: string;
}

export interface MayorEntry {
  date: string; description: string; debit: number; credit: number; balance: number;
}

export interface MayorAccount {
  code: string; name: string; nature: string; openingBalance: number;
  entries: MayorEntry[]; closingBalance: number;
}

export interface MovimientoBanco {
  id: string; fecha: string; descripcion: string; referencia: string;
  monto: number; tipo: "ingreso" | "egreso"; status: string; asientoId: string | null; banco: string;
}

export interface ReporteFiscal {
  periodo: string; ventas: number; compras: number; ivaDebito: number;
  ivaCredito: number; ivaPagar: number; ire: number; retenciones: number; totalImpuestos: number;
}

// ─── Seed Data ────────────────────────────────────────────────────────────

function seed() {
  // ── Empresas ──────────────────────────────────────────────────────────
  const empresas: Empresa[] = [
    { id: "e1", ruc: "80012345-1", nombre: "Importadora del Este S.A.", nombreComercial: "ImportEste", regimen: "IVA General", estado: "activo", baseCurrency: "PYG", taxRegimes: ["IVA_GRAL", "IRE_GRAL"] },
    { id: "e2", ruc: "80023456-2", nombre: "Tecnología Asunción SRL", nombreComercial: "TechAsu", regimen: "IRE Simple", estado: "activo", baseCurrency: "PYG", taxRegimes: ["IVA_GRAL", "IRE_SIMPLE"] },
    { id: "e3", ruc: "80034567-3", nombre: "Distribuciones Ñandutí SA", nombreComercial: "Ñandutí", regimen: "IVA General", estado: "activo", baseCurrency: "PYG", taxRegimes: ["IVA_GRAL", "IRE_GRAL"] },
    { id: "e4", ruc: "80045678-4", nombre: "Agropecuaria Guaraní SRL", nombreComercial: "AgroGuaraní", regimen: "IVA General", estado: "activo", baseCurrency: "PYG", taxRegimes: ["IVA_GRAL", "IRE_GRAL"] },
    { id: "e5", ruc: "80056789-5", nombre: "Servicios Contables PY SA", nombreComercial: "SerConPy", regimen: "IVA Simple", estado: "activo", baseCurrency: "PYG", taxRegimes: ["IVA_GRAL", "IRE_SIMPLE"] },
    { id: "e6", ruc: "80067890-6", nombre: "Comercial Paraguaya SA", nombreComercial: "ComerPar", regimen: "IVA General", estado: "activo", baseCurrency: "PYG", taxRegimes: ["IVA_GRAL", "IRE_GRAL"] },
  ];

  // ── Cuentas (from CONPLA) ────────────────────────────────────────────
  const cuentas: Cuenta[] = [
    { id: "c1", code: "1.1.01", name: "Caja", nature: "asset", parentCode: null, allowsPosting: true, balance: 2500000, currency: "PYG", active: true },
    { id: "c2", code: "1.1.02", name: "Banco GNB Cta. Cte.", nature: "asset", parentCode: null, allowsPosting: true, balance: 45000000, currency: "PYG", active: true },
    { id: "c3", code: "1.1.03", name: "Banco Itaú Cta. Cte.", nature: "asset", parentCode: null, allowsPosting: true, balance: 18500000, currency: "PYG", active: true },
    { id: "c4", code: "1.1.05", name: "Cuentas a Cobrar Clientes", nature: "asset", parentCode: null, allowsPosting: true, balance: 32500000, currency: "PYG", active: true },
    { id: "c5", code: "1.1.06", name: "IVA Crédito Fiscal", nature: "asset", parentCode: null, allowsPosting: true, balance: 2850000, currency: "PYG", active: true },
    { id: "c6", code: "1.1.07", name: "IVA Crédito Fiscal 5%", nature: "asset", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c7", code: "1.2.01", name: "Mercaderías", nature: "asset", parentCode: null, allowsPosting: true, balance: 85000000, currency: "PYG", active: true },
    { id: "c8", code: "1.2.02", name: "Rodados", nature: "asset", parentCode: null, allowsPosting: true, balance: 65000000, currency: "PYG", active: true },
    { id: "c9", code: "1.2.03", name: "Mobiliario y Útiles", nature: "asset", parentCode: null, allowsPosting: true, balance: 12000000, currency: "PYG", active: true },
    { id: "c10", code: "1.2.04", name: "Equipo de Computación", nature: "asset", parentCode: null, allowsPosting: true, balance: 25000000, currency: "PYG", active: true },
    { id: "c11", code: "2.1.01", name: "Cuentas a Pagar Proveedores", nature: "liability", parentCode: null, allowsPosting: true, balance: 28000000, currency: "PYG", active: true },
    { id: "c12", code: "2.1.02", name: "IVA Débito Fiscal", nature: "liability", parentCode: null, allowsPosting: true, balance: 550000, currency: "PYG", active: true },
    { id: "c13", code: "2.1.03", name: "IVA Débito Fiscal 5%", nature: "liability", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c14", code: "2.1.05", name: "Retenciones a Pagar", nature: "liability", parentCode: null, allowsPosting: true, balance: 12500, currency: "PYG", active: true },
    { id: "c15", code: "2.1.06", name: "IRE a Pagar", nature: "liability", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c16", code: "3.1.01", name: "Capital Social", nature: "equity", parentCode: null, allowsPosting: true, balance: 200000000, currency: "PYG", active: true },
    { id: "c17", code: "3.1.02", name: "Reserva Legal", nature: "equity", parentCode: null, allowsPosting: true, balance: 10000000, currency: "PYG", active: true },
    { id: "c18", code: "3.1.03", name: "Resultados Acumulados", nature: "equity", parentCode: null, allowsPosting: true, balance: 45000000, currency: "PYG", active: true },
    { id: "c19", code: "3.1.04", name: "Resultado del Ejercicio", nature: "equity", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c20", code: "4.1.01", name: "Ventas de Mercaderías", nature: "income", parentCode: null, allowsPosting: true, balance: 5500000, currency: "PYG", active: true },
    { id: "c21", code: "4.1.02", name: "Prestación de Servicios", nature: "income", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c22", code: "4.1.03", name: "Otros Ingresos", nature: "income", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c23", code: "5.1.01", name: "Costo de Mercaderías Vendidas", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c24", code: "5.1.02", name: "Sueldos y Salarios", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c25", code: "5.1.03", name: "Seguridad Social", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c26", code: "5.1.04", name: "Honorarios Profesionales", nature: "expense", parentCode: null, allowsPosting: true, balance: 2500000, currency: "PYG", active: true },
    { id: "c27", code: "5.1.05", name: "Alquileres", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c28", code: "5.1.06", name: "Servicios Públicos", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c29", code: "5.1.07", name: "Depreciación de Rodados", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
    { id: "c30", code: "5.1.10", name: "Otros Gastos", nature: "expense", parentCode: null, allowsPosting: true, balance: 0, currency: "PYG", active: true },
  ];

  // ── Terceros ──────────────────────────────────────────────────────────
  const terceros: Tercero[] = [
    { id: "t1", tipo: "proveedor", ruc: "80012345-1", razonSocial: "Importadora del Este S.A.", nombreFantasia: "ImportEste", direccion: "Av. Mcal. López 1234", ciudad: "Asunción", telefono: "+595 21 500 100", email: "compras@importeste.com.py", regimen: "general", ivaCondition: "responsable", retenciones: null, saldo: 11000000, ultimaOperacion: "2026-05-01", estado: "activo" },
    { id: "t2", tipo: "proveedor", ruc: "4567890-1", razonSocial: "Servicios Contables Del Paraguay", nombreFantasia: "SerConPy", direccion: "Eligio Ayala 567", ciudad: "Asunción", telefono: "+595 21 300 400", email: "info@serconpy.com.py", regimen: "general", ivaCondition: "responsable", retenciones: [{ tipo: "ire", tasa: 0.5 }], saldo: 2737500, ultimaOperacion: "2026-05-03", estado: "activo" },
    { id: "t3", tipo: "proveedor", ruc: "80023456-2", razonSocial: "Tecnología Asunción SRL", nombreFantasia: "TechAsu", direccion: "Av. España 890", ciudad: "Asunción", telefono: "+595 21 600 700", email: "ventas@techasu.com.py", regimen: "simple", ivaCondition: "responsable", retenciones: null, saldo: 16500000, ultimaOperacion: "2026-05-02", estado: "activo" },
    { id: "t4", tipo: "proveedor", ruc: "1234567-8", razonSocial: "Distribuciones Ñandutí S.A.", nombreFantasia: null, direccion: "Ruta 2 Km 10", ciudad: "Capiatá", telefono: "+595 21 800 900", email: "pedidos@nanduti.com.py", regimen: "general", ivaCondition: "responsable", retenciones: null, saldo: -550000, ultimaOperacion: "2026-05-05", estado: "activo" },
    { id: "t5", tipo: "proveedor", ruc: "9876543-2", razonSocial: "Agropecuaria Guaraní", nombreFantasia: "AgroGuaraní", direccion: "Ruta 7 Km 25", ciudad: "Caacupé", telefono: null, email: "ventas@agroguarani.com.py", regimen: "general", ivaCondition: "responsable", retenciones: [{ tipo: "iva", tasa: 30 }], saldo: 0, ultimaOperacion: "2026-05-08", estado: "activo" },
    { id: "t6", tipo: "cliente", ruc: "3456789-0", razonSocial: "Comercial Paraguaya S.A.", nombreFantasia: "ComerPar", direccion: "Artigas 1234", ciudad: "Asunción", telefono: "+595 21 200 300", email: "pagos@comercialpar.com.py", regimen: "general", ivaCondition: "responsable", retenciones: null, saldo: 0, ultimaOperacion: "2026-05-10", estado: "activo" },
  ];

  // ── Asientos ──────────────────────────────────────────────────────────
  const asientos: Asiento[] = [
    { id: "a1", numero: "001-2026", fecha: "2026-05-01", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Posteado", descripcion: "Compra mercadería — Factura 001-001-00234", total: 11000000, sugerenciaIA: true, revertidoDe: null, posteadoAt: "2026-05-01 10:30", lineas: [
      { cuenta: "1.2.01", nombreCuenta: "Mercaderías", debito: 10000000, credito: 0, descripcion: "Compra gravada 10%" },
      { cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 1000000, credito: 0, descripcion: "IVA Crédito 10%" },
      { cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 11000000, descripcion: "Proveedor ImportEste" },
    ]},
    { id: "a2", numero: "002-2026", fecha: "2026-05-03", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Posteado", descripcion: "Honorarios contables — Fact. 002-001-00089", total: 2737500, sugerenciaIA: true, revertidoDe: null, posteadoAt: "2026-05-03 14:15", lineas: [
      { cuenta: "5.1.04", nombreCuenta: "Honorarios Profesionales", debito: 2500000, credito: 0, descripcion: "Servicios contables" },
      { cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 250000, credito: 0, descripcion: "IVA 10%" },
      { cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 2737500, descripcion: "SerConPy" },
      { cuenta: "2.1.05", nombreCuenta: "Retenciones a Pagar", debito: 0, credito: 12500, descripcion: "Retención IRE 0.5%" },
    ]},
    { id: "a3", numero: "003-2026", fecha: "2026-05-05", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Posteado", descripcion: "NC devolución — Fact. 001-001-00056", total: 550000, sugerenciaIA: true, revertidoDe: null, posteadoAt: "2026-05-05 09:45", lineas: [
      { cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 550000, credito: 0, descripcion: "NC débito a proveedor" },
      { cuenta: "1.2.01", nombreCuenta: "Mercaderías", debito: 0, credito: 500000, descripcion: "Devolución mercadería" },
      { cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 0, credito: 50000, descripcion: "Reversión IVA" },
    ]},
    { id: "a4", numero: "004-2026", fecha: "2026-05-10", empresa: "Importadora del Este", origen: "Manual", estado: "Posteado", descripcion: "Venta de mercadería a ComerPar", total: 6050000, sugerenciaIA: false, revertidoDe: null, posteadoAt: "2026-05-10 16:00", lineas: [
      { cuenta: "1.1.05", nombreCuenta: "Cuentas a Cobrar Clientes", debito: 6050000, credito: 0, descripcion: "Cliente ComerPar" },
      { cuenta: "4.1.01", nombreCuenta: "Ventas de Mercaderías", debito: 0, credito: 5500000, descripcion: "Venta gravada 10%" },
      { cuenta: "2.1.02", nombreCuenta: "IVA Débito Fiscal", debito: 0, credito: 550000, descripcion: "IVA Débito 10%" },
    ]},
    { id: "a5", numero: "005-2026", fecha: "2026-04-30", empresa: "Importadora del Este", origen: "Manual", estado: "Borrador", descripcion: "Sueldos abril 2026", total: 8000000, sugerenciaIA: false, revertidoDe: null, posteadoAt: null, lineas: [
      { cuenta: "5.1.02", nombreCuenta: "Sueldos y Salarios", debito: 8000000, credito: 0, descripcion: "Sueldos abril" },
      { cuenta: "1.1.02", nombreCuenta: "Banco GNB Cta. Cte.", debito: 0, credito: 8000000, descripcion: "Pago sueldos" },
    ]},
    { id: "a6", numero: "006-2026", fecha: "2026-05-01", empresa: "Importadora del Este", origen: "Conciliación", estado: "Posteado", descripcion: "Cobro factura pendiente", total: 2500000, sugerenciaIA: false, revertidoDe: null, posteadoAt: "2026-05-01 11:00", lineas: [
      { cuenta: "1.1.02", nombreCuenta: "Banco GNB Cta. Cte.", debito: 2500000, credito: 0, descripcion: "Cobro recibido" },
      { cuenta: "1.1.05", nombreCuenta: "Cuentas a Cobrar Clientes", debito: 0, credito: 2500000, descripcion: "Cancelación factura" },
    ]},
    { id: "a7", numero: "007-2026", fecha: "2026-05-08", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Borrador", descripcion: "Compra AgroGuaraní — Pendiente revisión", total: 4125000, sugerenciaIA: true, revertidoDe: null, posteadoAt: null, lineas: [
      { cuenta: "1.2.01", nombreCuenta: "Mercaderías", debito: 3750000, credito: 0, descripcion: "Productos agrícolas" },
      { cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 375000, credito: 0, descripcion: "IVA 10%" },
      { cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 4125000, descripcion: "AgroGuaraní" },
    ]},
    { id: "a8", numero: "008-2026", fecha: "2026-05-11", empresa: "Tecnología Asunción", origen: "Reversión", estado: "Revertido", descripcion: "REV: Compra duplicada corregida", total: 3200000, sugerenciaIA: false, revertidoDe: "003-2026", posteadoAt: "2026-05-11 15:00", lineas: [] },
  ];

  // ── IVA Compras ───────────────────────────────────────────────────────
  const ivaCompras: IVAEntry[] = [
    { id: "ic1", fecha: "2026-05-01", numero: "001-001-00234", tipo: "factura", ruc: "80012345-1", nombre: "Importadora del Este S.A.", gravado10: 10000000, gravado5: 0, exento: 0, iva10: 1000000, iva5: 0, total: 11000000, cdc: "5897185478912345678901234567890123456789012345" },
    { id: "ic2", fecha: "2026-05-03", numero: "002-001-00089", tipo: "factura", ruc: "4567890-1", nombre: "Servicios Contables del Paraguay", gravado10: 2500000, gravado5: 0, exento: 0, iva10: 250000, iva5: 0, total: 2750000, cdc: "5897185478912345678901234567890123456789012346" },
    { id: "ic3", fecha: "2026-05-05", numero: "001-001-00056", tipo: "nc", ruc: "1234567-8", nombre: "Distribuciones Ñandutí S.A.", gravado10: -500000, gravado5: 0, exento: 0, iva10: -50000, iva5: 0, total: -550000 },
    { id: "ic4", fecha: "2026-05-02", numero: "001-001-00345", tipo: "factura", ruc: "80023456-2", nombre: "Tecnología Asunción SRL", gravado10: 15000000, gravado5: 0, exento: 0, iva10: 1500000, iva5: 0, total: 16500000 },
    { id: "ic5", fecha: "2026-05-08", numero: "001-001-01123", tipo: "factura", ruc: "9876543-2", nombre: "Agropecuaria Guaraní", gravado10: 3750000, gravado5: 0, exento: 0, iva10: 375000, iva5: 0, total: 4125000 },
  ];

  // ── IVA Ventas ────────────────────────────────────────────────────────
  const ivaVentas: IVAEntry[] = [
    { id: "iv1", fecha: "2026-05-10", numero: "001-001-00001", tipo: "factura", ruc: "3456789-0", nombre: "Comercial Paraguaya S.A.", gravado10: 5500000, gravado5: 0, exento: 0, iva10: 550000, iva5: 0, total: 6050000 },
    { id: "iv2", fecha: "2026-05-12", numero: "001-001-00002", tipo: "factura", ruc: "4567890-1", nombre: "Servicios Contables Del Paraguay", gravado10: 1200000, gravado5: 0, exento: 0, iva10: 120000, iva5: 0, total: 1320000 },
    { id: "iv3", fecha: "2026-05-15", numero: "001-001-00003", tipo: "factura", ruc: "80023456-2", nombre: "Tecnología Asunción SRL", gravado10: 0, gravado5: 500000, exento: 0, iva10: 0, iva5: 25000, total: 525000 },
    { id: "iv4", fecha: "2026-05-18", numero: "001-001-00004", tipo: "nd", ruc: "3456789-0", nombre: "Comercial Paraguaya S.A.", gravado10: 300000, gravado5: 0, exento: 0, iva10: 30000, iva5: 0, total: 330000 },
  ];

  // ── Libro Diario ──────────────────────────────────────────────────────
  const libroDiario: DiarioEntry[] = [
    { id: "d1", fecha: "2026-05-01", numero: "001-2026", cuenta: "1.2.01", nombreCuenta: "Mercaderías", debito: 10000000, credito: 0, descripcion: "Compra mercadería ImportEste", origen: "sifen" },
    { id: "d2", fecha: "2026-05-01", numero: "001-2026", cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 1000000, credito: 0, descripcion: "IVA Compra 10%", origen: "sifen" },
    { id: "d3", fecha: "2026-05-01", numero: "001-2026", cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 11000000, descripcion: "Proveedor ImportEste", origen: "sifen" },
    { id: "d4", fecha: "2026-05-03", numero: "002-2026", cuenta: "5.1.04", nombreCuenta: "Honorarios Profesionales", debito: 2500000, credito: 0, descripcion: "Servicios Contables", origen: "sifen" },
    { id: "d5", fecha: "2026-05-03", numero: "002-2026", cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 250000, credito: 0, descripcion: "IVA Compra 10%", origen: "sifen" },
    { id: "d6", fecha: "2026-05-03", numero: "002-2026", cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 2750000, descripcion: "SerConPy", origen: "sifen" },
    { id: "d7", fecha: "2026-05-05", numero: "003-2026", cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 550000, credito: 0, descripcion: "NC Ñandutí", origen: "sifen" },
    { id: "d8", fecha: "2026-05-05", numero: "003-2026", cuenta: "1.2.01", nombreCuenta: "Mercaderías", debito: 0, credito: 500000, descripcion: "Devolución compra", origen: "sifen" },
    { id: "d9", fecha: "2026-05-05", numero: "003-2026", cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 0, credito: 50000, descripcion: "Reversión IVA", origen: "sifen" },
    { id: "d10", fecha: "2026-05-10", numero: "004-2026", cuenta: "1.1.05", nombreCuenta: "Cuentas a Cobrar Clientes", debito: 6050000, credito: 0, descripcion: "Venta ComerPar", origen: "manual" },
    { id: "d11", fecha: "2026-05-10", numero: "004-2026", cuenta: "4.1.01", nombreCuenta: "Ventas de Mercaderías", debito: 0, credito: 5500000, descripcion: "Venta gravada 10%", origen: "manual" },
    { id: "d12", fecha: "2026-05-10", numero: "004-2026", cuenta: "2.1.02", nombreCuenta: "IVA Débito Fiscal", debito: 0, credito: 550000, descripcion: "IVA venta", origen: "manual" },
  ];

  // ── Libro Mayor ───────────────────────────────────────────────────────
  const libroMayor: MayorAccount[] = [
    { code: "1.2.01", name: "Mercaderías", nature: "asset", openingBalance: 75000000, entries: [
      { date: "2026-05-01", description: "Compra ImportEste", debit: 10000000, credit: 0, balance: 85000000 },
      { date: "2026-05-05", description: "NC devolución Ñandutí", debit: 0, credit: 500000, balance: 84500000 },
    ], closingBalance: 84500000 },
    { code: "1.1.06", name: "IVA Crédito Fiscal", nature: "asset", openingBalance: 600000, entries: [
      { date: "2026-05-01", description: "IVA compra ImportEste", debit: 1000000, credit: 0, balance: 1600000 },
      { date: "2026-05-03", description: "IVA compra SerConPy", debit: 250000, credit: 0, balance: 1850000 },
      { date: "2026-05-05", description: "NC reversión IVA", debit: 0, credit: 50000, balance: 1800000 },
    ], closingBalance: 1800000 },
    { code: "2.1.01", name: "Cuentas a Pagar Proveedores", nature: "liability", openingBalance: 1500000, entries: [
      { date: "2026-05-01", description: "Compra ImportEste", debit: 0, credit: 11000000, balance: 12500000 },
      { date: "2026-05-03", description: "Honorarios SerConPy", debit: 0, credit: 2750000, balance: 15250000 },
      { date: "2026-05-05", description: "NC Ñandutí", debit: 550000, credit: 0, balance: 14700000 },
    ], closingBalance: 14700000 },
    { code: "1.1.02", name: "Banco GNB Cta. Cte.", nature: "asset", openingBalance: 50000000, entries: [
      { date: "2026-05-01", description: "Cobro pendiente", debit: 2500000, credit: 0, balance: 52500000 },
      { date: "2026-05-10", description: "Pago alquiler", debit: 0, credit: 2500000, balance: 50000000 },
      { date: "2026-05-11", description: "Cobro venta ComerPar", debit: 6050000, credit: 0, balance: 56050000 },
    ], closingBalance: 56050000 },
  ];

  // ── Banco ─────────────────────────────────────────────────────────────
  const banco: MovimientoBanco[] = [
    { id: "b1", fecha: "2026-05-02", descripcion: "Pago a Importadora del Este", referencia: "CHQ-001", monto: 11000000, tipo: "egreso", status: "conciliado", asientoId: "001-2026", banco: "Banco GNB" },
    { id: "b2", fecha: "2026-05-04", descripcion: "Pago honorarios SerConPy", referencia: "TRF-002", monto: 2737500, tipo: "egreso", status: "conciliado", asientoId: "002-2026", banco: "Banco GNB" },
    { id: "b3", fecha: "2026-05-01", descripcion: "Cobro factura pendiente", referencia: "DEP-003", monto: 2500000, tipo: "ingreso", status: "conciliado", asientoId: "006-2026", banco: "Banco GNB" },
    { id: "b4", fecha: "2026-05-10", descripcion: "Pago alquiler oficina", referencia: "CHQ-004", monto: 2500000, tipo: "egreso", status: "pendiente", asientoId: null, banco: "Banco GNB" },
    { id: "b5", fecha: "2026-05-11", descripcion: "Cobro venta ComerPar", referencia: "TRF-005", monto: 6050000, tipo: "ingreso", status: "pendiente", asientoId: "004-2026", banco: "Banco Continental" },
  ];

  // ── Reportes ──────────────────────────────────────────────────────────
  const reportes: ReporteFiscal[] = [
    { periodo: "2026-01", ventas: 45000000, compras: 28000000, ivaDebito: 4500000, ivaCredito: 2800000, ivaPagar: 1700000, ire: 5100000, retenciones: 350000, totalImpuestos: 7150000 },
    { periodo: "2026-02", ventas: 52000000, compras: 31000000, ivaDebito: 5200000, ivaCredito: 3100000, ivaPagar: 2100000, ire: 6300000, retenciones: 420000, totalImpuestos: 8820000 },
    { periodo: "2026-03", ventas: 38000000, compras: 22000000, ivaDebito: 3800000, ivaCredito: 2200000, ivaPagar: 1600000, ire: 4800000, retenciones: 280000, totalImpuestos: 6680000 },
    { periodo: "2026-04", ventas: 61000000, compras: 35000000, ivaDebito: 6100000, ivaCredito: 3500000, ivaPagar: 2600000, ire: 7800000, retenciones: 520000, totalImpuestos: 10920000 },
    { periodo: "2026-05", ventas: 7050000, compras: 32125000, ivaDebito: 705000, ivaCredito: 3212500, ivaPagar: 0, ire: 0, retenciones: 12500, totalImpuestos: 12500 },
  ];

  return { empresas, cuentas, terceros, asientos, ivaCompras, ivaVentas, libroDiario, libroMayor, banco, reportes };
}

// ─── Store ────────────────────────────────────────────────────────────────

interface DataStore {
  empresas: Empresa[];
  cuentas: Cuenta[];
  terceros: Tercero[];
  asientos: Asiento[];
  ivaCompras: IVAEntry[];
  ivaVentas: IVAEntry[];
  libroDiario: DiarioEntry[];
  libroMayor: MayorAccount[];
  banco: MovimientoBanco[];
  reportes: ReporteFiscal[];

  // Actions
  getAsientoById: (id: string) => Asiento | undefined;
  getEmpresaById: (id: string) => Empresa | undefined;
  getTerceroById: (id: string) => Tercero | undefined;
  getCuentaByCode: (code: string) => Cuenta | undefined;
  getAsientosByEmpresa: (empresa: string) => Asiento[];
  getLibroDiarioByNumero: (numero: string) => DiarioEntry[];
}

const seedData = seed();

export const useDataStore = create<DataStore>((set, get) => ({
  ...seedData,

  getAsientoById: (id) => get().asientos.find((a) => a.id === id),
  getEmpresaById: (id) => get().empresas.find((e) => e.id === id),
  getTerceroById: (id) => get().terceros.find((t) => t.id === id),
  getCuentaByCode: (code) => get().cuentas.find((c) => c.code === code),
  getAsientosByEmpresa: (empresa) => get().asientos.filter((a) => a.empresa === empresa),
  getLibroDiarioByNumero: (numero) => get().libroDiario.filter((d) => d.numero === numero),
}));
