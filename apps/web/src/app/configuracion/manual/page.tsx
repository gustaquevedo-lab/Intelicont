"use client";

import { useState } from "react";
import {
  BookOpen, LayoutDashboard, FileCode, FileText, Hash,
  CreditCard, Wallet, Calculator, Activity, Shield, ChevronDown,
  Building2, Users, Receipt, Sparkles, AlertCircle, ArrowRight,
  Package, Lock, TrendingUp, Coins, Calendar, FileSearch, Settings,
  BarChart3, Globe, Heart, CheckCircle2, ChevronRight, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "introduccion",
    title: "1. Introducción y Conceptos del SaaS",
    icon: BookOpen,
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 leading-relaxed text-sm">
          Bienvenido al manual oficial e interactivo de <strong className="text-white font-semibold">InteliCont™</strong>, la plataforma de contabilidad inteligente SaaS diseñada para el mercado tributario de Paraguay.
        </p>

        <div className="bg-gradient-to-br from-blue-950/20 to-transparent border border-blue-900/30 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5" /> Estructura del Ecosistema SaaS
          </h4>
          <p className="text-gray-400 text-xs mb-4 leading-relaxed">
            El sistema se rige bajo una arquitectura de Estudios Contables principales que actúan como suscriptores pagadores y las empresas de sus clientes a quienes administran contablemente.
          </p>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">1</div>
              <div>
                <p className="font-semibold text-white">Estudios Contables (Tenant principal)</p>
                <p className="text-gray-400">Es el cliente directo que paga la membresía mensual de InteliCont según su plan (Starter, Pro, InHouse/ESFL, Enterprise).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">2</div>
              <div>
                <p className="font-semibold text-white">Empresas Contribuyentes (Gestionados)</p>
                <p className="text-gray-400">Son los clientes que el estudio contable crea y opera bajo su propio panel administrativo sin cargos adicionales por parte de InteliCont.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-gray-500 pb-2 border-b border-gray-900">
            <span>MOCK DE ARQUITECTURA DE SUSCRIPCIÓN</span>
            <span>INTELICONT CLOUD</span>
          </div>
          <div className="text-xs space-y-1 font-mono">
            <p className="text-purple-400">🏢 ESTUDIO: García &amp; Asociados (Plan: PRO · MRR: Gs. 385.000)</p>
            <p className="text-gray-500 pl-4">└── 💼 Contribuyente: Comercial Paraguaya S.A. (RUC: 3456789-0)</p>
            <p className="text-gray-500 pl-4">└── 💼 Contribuyente: Importadora del Este S.A. (RUC: 80012345-1)</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "gestion_principal",
    title: "2. Gestión Principal",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.1 Panel General
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Ofrece un vistazo general de la salud financiera de la empresa activa. Muestra KPI clave como ingresos totales, gastos del mes, saldos consolidados en cuentas de efectivo, y atajos rápidos a los módulos más visitados.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.2 Carga SIFEN
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Captura directa de comprobantes electrónicos del Paraguay. Arrastrando el archivo XML emitido por el facturador electrónico del emisor, la IA analiza y desglosa montos exentos, base imponible e IVA (10% o 5%).
          </p>
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mt-3 ml-6 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between border-b border-gray-900 pb-2">
              <span className="text-blue-400 font-bold">XML SIFEN Detectado:</span>
              <span className="text-green-400 font-bold">Gs. 1.100.000</span>
            </div>
            <div className="text-gray-400 space-y-1">
              <p>&lt;dNumDoc&gt;001-001-0001234&lt;/dNumDoc&gt;</p>
              <p>&lt;dTotOpe&gt;1100000&lt;/dTotOpe&gt;</p>
            </div>
            <div className="border-t border-purple-900/30 pt-2 text-purple-400 space-y-1">
              <p className="font-bold flex items-center gap-1"><Sparkles className="h-3 w-3" /> Imputación IA Sugerida:</p>
              <div className="flex justify-between"><span>1.2.01 Mercaderías</span><span>D: Gs. 1.000.000</span></div>
              <div className="flex justify-between"><span>1.1.06 IVA Crédito 10%</span><span>D: Gs. 100.000</span></div>
              <div className="flex justify-between"><span>2.1.01 Proveedores</span><span>H: Gs. 1.100.000</span></div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.3 Historial SIFEN
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra el registro completo de todos los XMLs importados a la base de datos de InteliCont. Permite auditar y buscar facturas por Razón Social, RUC o número de comprobante.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.4 Bandeja de Comprobantes
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Bandeja de entrada centralizada donde se guardan temporalmente los comprobantes escaneados o subidos antes de ser procesados e imputados en el libro diario.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.5 Empresas
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Permite al estudio contable crear, configurar y alternar entre los diferentes contribuyentes asignados a su cuenta. Permite ajustar RUC, tipo de entidad comercial o sin fines de lucro (ESFL).
          </p>
        </div>
      </div>
    )
  },
  {
    id: "contabilidad",
    title: "3. Contabilidad",
    icon: FileText,
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.1 Asientos Contables
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Libro diario del sistema. Permite agregar asientos manuales con doble columna tradicional (Débito/Crédito) y reversar o anular transacciones. Muestra balances y si el asiento cuadra a la perfección.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.2 Plan de Cuentas
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Estructura contable parametrizada para Paraguay (Activo, Pasivo, Patrimonio Neto, Ingresos y Egresos). Puedes añadir subcuentas contables según la necesidad operativa del contribuyente.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.3 Libros Diarios / Mayores
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Filtro interactivo y exportación del libro mayor por cuenta contable o por período mensual/anual. Muestra saldos deudores y acreedores listos para la presentación de informes.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.4 Bienes de Uso (Activos Fijos)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Flujo paso a paso para el registro y depreciación de un Bien de Uso:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Haz clic en <strong className="text-white">Registrar Activo Fijo</strong>.</li>
            <li>Ingresa el código único (ej: <code className="text-blue-300 bg-blue-900/20 px-1 py-0.5 rounded font-mono">AF-001</code>), nombre, y fecha de adquisición.</li>
            <li>Define el costo de compra en Gs., los meses de vida útil estimados (ej: 60 meses), la cuenta de activo y la cuenta de gastos asociada.</li>
            <li>Presiona guardar. Podrás ver el activo en el listado principal con su depreciación mensual acumulada.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.5 Cierre de Períodos
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Módulo de bloqueo temporal. Una vez cerrado el mes o año fiscal, ningún usuario puede alterar, borrar ni insertar nuevos asientos contables, asegurando la integridad de los datos reportados.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.6 Estados Financieros
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Generación al instante del Balance General y Estado de Resultados consolidado. Se calculan dinámicamente basándose en la totalidad de los asientos contabilizados del período.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.7 Clientes / Proveedores (Terceros)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Directorio centralizado de clientes y proveedores. Permite guardar datos clave como RUC, Razón Social, dirección de contacto y timbrado predeterminado de facturas.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "tesoreria_finanzas",
    title: "4. Tesorería y Finanzas",
    icon: Coins,
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 4.1 Conciliación Bancaria
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Este módulo automatiza el cuadre entre los movimientos de los extractos bancarios cargados y los registros del libro mayor de bancos del contribuyente.
          </p>
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mt-3 ml-6 space-y-3 font-mono text-[11px]">
            <div className="flex justify-between border-b border-gray-900 pb-2">
              <span className="text-blue-400 font-bold">LADO BANCO (Extracto GNB)</span>
              <span className="text-purple-400 font-bold">LADO MAYOR (Libro Diario)</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>01/05/2026 Pago Importadora</span>
              <span>01/05/2026 Chq-001 Importadora</span>
            </div>
            <div className="flex justify-between text-green-400 font-bold border-t border-gray-900 pt-2">
              <span>Gs. 11.000.000 (D)</span>
              <span>Gs. 11.000.000 (H)</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 4.2 Caja Chica
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Flujo de rendición y reposición de caja chica:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Bajo <strong className="text-white">Caja Chica</strong>, selecciona tu fondo fijo activo.</li>
            <li>Haz clic en <strong className="text-white">Rendir Ticket / Gasto</strong>.</li>
            <li>Ingresa los datos del comprobante: fecha, RUC, número de factura y monto total.</li>
            <li>Selecciona el IVA correspondiente y la categoría del gasto (ej: Alimentación).</li>
            <li>Presiona guardar. Una vez acumulado, presiona <strong className="text-white">Reponer Fondo</strong> para generar la póliza contable automática.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 4.3 Órdenes de Pago
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Flujo de Órdenes de Pago:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Órdenes de Pago</strong>.</li>
            <li>Haz clic en <strong className="text-white">Crear Orden de Pago</strong>.</li>
            <li>Elige el proveedor y selecciona las facturas pendientes de cobro asociadas.</li>
            <li>Completa el medio de pago (Banco o Caja Chica), importe y fecha de vencimiento.</li>
            <li>Contabiliza la salida de fondos para liquidar el pasivo.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: "gestion_fiscal",
    title: "5. Gestión Fiscal y Formularios",
    icon: Calculator,
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.1 Calendario Fiscal
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra los vencimientos de la DNIT para el contribuyente, ordenados según la terminación del RUC de la empresa para evitar multas de presentación tardía.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.2 Libro IVA / RG90
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Generador de archivos CSV compatibles para la importación directa de la RG 90 en el software tributario Marangatú de la SET/DNIT.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.3 Liquidación Impuestos
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Cálculo estimado de tasas para IVA, IRE e IRP. Cuenta con el **Copiloto Fiscal IA** que lee tus montos calculados y te brinda alertas tributarias y optimizaciones legales con Gemini.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.4 Retenciones Tesakã
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Flujo de emisión de Retención Tesakã:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Retenciones Tesakã</strong>.</li>
            <li>Haz clic en <strong className="text-white">Emitir Retención</strong>.</li>
            <li>Ingresa los datos del proveedor y selecciona la factura que origina la retención.</li>
            <li>Selecciona el tipo de impuesto a retener (IVA, IRE, IRP). El sistema calculará el porcentaje de retención correspondiente.</li>
            <li>Registra la transacción para emitir el comprobante digital.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.5 Timbrados y Autoimpresores
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Configuración y registro de Timbrados:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Timbrados y Autoimp.</strong></li>
            <li>Registra un nuevo número de timbrado especificando la vigencia (fecha de inicio y fin) y los rangos de facturación permitidos (Ej: 001-001-0000001 a 001-001-0001000).</li>
            <li>El sistema emitirá alertas de vencimiento automáticas cuando falte menos de un mes para su caducidad.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: "configuracion_soporte",
    title: "6. Soporte y Configuración",
    icon: Settings,
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.1 Reportes Varios
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Exportación de balances de sumas y saldos, informes auxiliares de clientes, evolución patrimonial y plantillas financieras en formato Excel y PDF.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.2 Auditoría Contable (InteliAudit™)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Motor inteligente que audita los últimos asientos contables generados buscando desbalances, inconsistencias, o anomalías de registro, asignando una calificación contable (ej: A+).
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.3 Mi Estudio
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Configuraciones generales de la cuenta del estudio contable: datos de facturación, logo corporativo y asignación de permisos de colaboradores.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.4 Superadmin SaaS
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Flujo paso a paso para la gestión de Estudios Contables en el Superadmin:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a `/superadmin` y selecciona la pestaña <strong className="text-white">Estudios Contables</strong>.</li>
            <li>Haz clic en el botón <strong className="text-white">Crear Estudio Contable</strong>, completa el RUC, la Razón Social y el plan de suscripción del estudio y pulsa guardar.</li>
            <li>Para vincularle empresas de contabilidad que no pagan suscripción, ve a la pestaña <strong className="text-white">Contribuyentes</strong>.</li>
            <li>Haz clic en <strong className="text-white">Registrar Contribuyente</strong>, ingresa su RUC, Razón Social, y selecciona el Estudio Contable responsable para enlazarlo.</li>
          </ol>
        </div>
      </div>
    )
  }
];

export default function ManualUsuarioPage() {
  const [activeSectionId, setActiveSectionId] = useState("introduccion");

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Centro de Ayuda y Manual de Usuario
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Guía integral detallada de cada menú, flujo y pantalla de InteliCont sin excepción.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Módulos Explicados</h3>
          <div className="space-y-1.5">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeSectionId;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border text-xs font-bold flex items-center gap-3 transition-all",
                    isActive
                      ? "bg-gray-800 border-gray-700 text-white shadow-lg"
                      : "bg-gray-900/40 border-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-800/30"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-gray-500")} />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-8">
          <div className="card p-6 sm:p-8 space-y-6 min-h-[450px]">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-800">
              <activeSection.icon className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-bold text-white">{activeSection.title}</h2>
            </div>
            
            <div className="animate-in fade-in duration-200">
              {activeSection.content}
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 border-t border-gray-800/40 pt-4">
        <span>Desarrollado con</span>
        <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
        <span>para contadores de Paraguay.</span>
      </div>

    </div>
  );
}
