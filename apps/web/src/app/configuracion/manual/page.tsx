"use client";

import { useState } from "react";
import {
  BookOpen, LayoutDashboard, FileCode, FileText, Hash,
  CreditCard, Wallet, Calculator, Activity, Shield, ChevronDown,
  Building2, Users, Receipt, Sparkles, AlertCircle, ArrowRight,
  Package, Lock, TrendingUp, Coins, Calendar, FileSearch, Settings,
  BarChart3, Globe, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "introduccion",
    title: "1. Introducción y Conceptos del SaaS",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          Bienvenido al manual oficial e interactivo de <strong className="text-white font-semibold">InteliCont™</strong>, la plataforma de contabilidad inteligente SaaS diseñada para el mercado tributario de Paraguay.
        </p>
        <p className="text-gray-300 leading-relaxed">
          Este manual cubre absolutamente todas las funcionalidades, configuraciones y flujos del sistema sin excepciones.
        </p>

        <div className="bg-gradient-to-br from-blue-950/20 to-transparent border border-blue-900/30 rounded-2xl p-5 mt-6">
          <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5" /> Estructura SaaS del Negocio
          </h4>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">1</div>
              <div>
                <p className="font-semibold text-white">Estudios Contables (Suscripción Pagada)</p>
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
      </div>
    )
  },
  {
    id: "gestion_principal",
    title: "2. Gestión Principal",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-sm">2.1 Panel General</h4>
        <p className="text-gray-300 text-xs">
          Ofrece un vistazo general de la salud financiera de la empresa activa. Muestra KPI clave como ingresos totales, gastos del mes, saldos consolidados en cuentas de efectivo, y atajos rápidos a los módulos más visitados.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">2.2 Carga SIFEN</h4>
        <p className="text-gray-300 text-xs">
          Carga de facturas electrónicas de compras y ventas de Paraguay. Arrastrando el archivo XML emitido por el facturador electrónico del emisor, la IA analiza y desglosa montos exentos, base imponible e IVA (10% o 5%).
        </p>

        <h4 className="font-bold text-white text-sm mt-4">2.3 Historial SIFEN</h4>
        <p className="text-gray-300 text-xs">
          Registro completo de todos los XMLs importados a la base de datos de InteliCont. Permite auditar y buscar facturas por Razón Social, RUC o número de comprobante, y verificar su estado en la SET/DNIT.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">2.4 Bandeja de Comprobantes</h4>
        <p className="text-gray-300 text-xs">
          Bandeja de entrada centralizada donde se guardan temporalmente los comprobantes escaneados o subidos antes de ser procesados e imputados en el libro diario.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">2.5 Empresas</h4>
        <p className="text-gray-300 text-xs">
          Permite al estudio contable crear, configurar y alternar entre los diferentes contribuyentes asignados a su cuenta. Permite ajustar RUC, tipo de entidad comercial o sin fines de lucro (ESFL).
        </p>
      </div>
    )
  },
  {
    id: "contabilidad",
    title: "3. Contabilidad",
    icon: FileText,
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-sm">3.1 Asientos Contables</h4>
        <p className="text-gray-300 text-xs">
          Libro diario del sistema. Permite agregar asientos manuales con doble columna tradicional (Débito/Crédito) y reversar o anular transacciones. Muestra balances y si el asiento cuadra a la perfección.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">3.2 Plan de Cuentas</h4>
        <p className="text-gray-300 text-xs">
          Estructura contable parametrizada para Paraguay (Activo, Pasivo, Patrimonio Neto, Ingresos y Egresos). Puedes añadir subcuentas contables según la necesidad operativa del contribuyente.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">3.3 Libros Diarios / Mayores</h4>
        <p className="text-gray-300 text-xs">
          Filtro interactivo y exportación del libro mayor por cuenta contable o por período mensual/anual. Muestra saldos acumulados deudores y acreedores listos para la presentación de informes.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">3.4 Bienes de Uso (Activos Fijos)</h4>
        <p className="text-gray-300 text-xs">
          Registro, revalúo contable y depreciación automática de bienes de uso. Calcula las cuotas de depreciación de acuerdo con los coeficientes autorizados por la DNIT para vehículos, inmuebles y equipos de computación.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">3.5 Cierre de Períodos</h4>
        <p className="text-gray-300 text-xs">
          Módulo de bloqueo temporal. Una vez cerrado el mes o año fiscal, ningún usuario puede alterar, borrar ni insertar nuevos asientos contables, asegurando la integridad de los datos reportados.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">3.6 Estados Financieros</h4>
        <p className="text-gray-300 text-xs">
          Generación al instante del Balance General y Estado de Resultados consolidado. Se calculan dinámicamente basándose en la totalidad de los asientos contabilizados del período.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">3.7 Clientes / Proveedores (Terceros)</h4>
        <p className="text-gray-300 text-xs">
          Directorio centralizado de clientes y proveedores. Permite guardar datos clave como RUC, Razón Social, dirección de contacto y timbrado predeterminado de facturas.
        </p>
      </div>
    )
  },
  {
    id: "tesoreria_finanzas",
    title: "4. Tesorería y Finanzas",
    icon: Coins,
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-sm">4.1 Conciliación Bancaria</h4>
        <p className="text-gray-300 text-xs">
          Permite cargar el extracto de cuenta bancaria y emparejarlo con el libro contable de la empresa. Cuenta con filtros inteligentes, panel comparativo doble columna y sugerencias automáticas de IA para diferencias.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">4.2 Caja Chica</h4>
        <p className="text-gray-300 text-xs">
          Rendición de fondos fijos de gastos menores del personal. Automatiza el desglose impositivo de tickets pequeños, control de límites por fondo y emisión de órdenes de reposición bancaria.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">4.3 Órdenes de Pago</h4>
        <p className="text-gray-300 text-xs">
          Flujo de autorización y desembolsos. El administrador genera y aprueba órdenes de pago de facturas de proveedores que se liquidan directamente vinculando las cuentas de banco habilitadas.
        </p>
      </div>
    )
  },
  {
    id: "gestion_fiscal",
    title: "5. Gestión Fiscal y Formularios",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-sm">5.1 Calendario Fiscal</h4>
        <p className="text-gray-300 text-xs">
          Muestra los vencimientos de la DNIT para el contribuyente, ordenados según la terminación del RUC de la empresa para evitar multas de presentación tardía.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">5.2 Libro IVA / RG90</h4>
        <p className="text-gray-300 text-xs">
          Generador de archivos CSV compatibles para la importación directa de la RG 90 en el software tributario Marangatú de la SET/DNIT.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">5.3 Liquidación Impuestos</h4>
        <p className="text-gray-300 text-xs">
          Cálculo estimado de tasas para IVA, IRE e IRP. Cuenta con el **Copiloto Fiscal IA** que lee tus montos calculados y te brinda alertas tributarias y optimizaciones legales con Gemini.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">5.4 Retenciones Tesakã</h4>
        <p className="text-gray-300 text-xs">
          Módulo de generación de comprobantes de retención tributaria. Calcula las alícuotas correspondientes e integra el proceso de timbrado virtual de retención en Paraguay.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">5.5 Timbrados y Autoimpresores</h4>
        <p className="text-gray-300 text-xs">
          Configuración y control de vigencia del rango de facturación física y del número de timbrado emitido por la administración tributaria.
        </p>
      </div>
    )
  },
  {
    id: "configuracion_soporte",
    title: "6. Soporte y Configuración",
    icon: Settings,
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-sm">6.1 Reportes Varios</h4>
        <p className="text-gray-300 text-xs">
          Exportación de balances de sumas y saldos, informes auxiliares de clientes, evolución patrimonial y plantillas financieras en formato Excel y PDF.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">6.2 Auditoría Contable (InteliAudit™)</h4>
        <p className="text-gray-300 text-xs">
          Motor inteligente que audita los últimos asientos contables generados buscando desbalances, inconsistencias, o anomalías de registro, asignando una calificación contable (ej: A+).
        </p>

        <h4 className="font-bold text-white text-sm mt-4">6.3 Mi Estudio</h4>
        <p className="text-gray-300 text-xs">
          Configuraciones generales de la cuenta del estudio contable: datos de facturación, logo corporativo y asignación de permisos de colaboradores.
        </p>

        <h4 className="font-bold text-white text-sm mt-4">6.4 Superadmin SaaS</h4>
        <p className="text-gray-300 text-xs">
          Panel exclusivo para los administradores globales de InteliCont. Permite crear nuevos Estudios Contables, registrar y vincular Contribuyentes a dichos estudios, suspender cuentas y activar/desactivar features premium.
        </p>
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
