"use client";

import { useState } from "react";
import {
  BookOpen, HelpCircle, LayoutDashboard, FileCode, FileText, Hash,
  CreditCard, Wallet, Calculator, Activity, Shield, ChevronDown,
  Building2, Users, Receipt, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "introduccion",
    title: "1. Introducción y Arquitectura",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          Bienvenido al manual oficial de <strong className="text-white font-semibold">InteliCont™</strong>, la plataforma de contabilidad inteligente SaaS de vanguardia diseñada específicamente para el mercado tributario paraguayo.
        </p>
        <p className="text-gray-300 leading-relaxed">
          InteliCont simplifica el cumplimiento de las normativas de la <strong className="text-white">DNIT (ex-SET)</strong> mediante la automatización basada en Inteligencia Artificial y la integración con el sistema de facturación electrónica nacional <strong className="text-white">SIFEN</strong>.
        </p>

        <div className="bg-gradient-to-br from-blue-950/20 to-transparent border border-blue-900/30 rounded-2xl p-5 mt-6">
          <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5" /> Arquitectura del Ecosistema SaaS
          </h4>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">1</div>
              <div>
                <p className="font-semibold text-white">Estudio Contable (Tenant principal)</p>
                <p className="text-gray-400">Es el cliente pagador de la suscripción SaaS. Posee un plan (Starter, Pro, etc.) y un MRR asignado.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">2</div>
              <div>
                <p className="font-semibold text-white">Contribuyentes (Empresas asociadas)</p>
                <p className="text-gray-400">Son las empresas y clientes que el estudio gestiona. No pagan suscripción directa a InteliCont, sino que son administradas bajo el paraguas del estudio contable.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "sifen",
    title: "2. Carga Ingesta SIFEN",
    icon: FileCode,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          El módulo de <strong className="text-white">SIFEN</strong> es el motor de entrada de comprobantes electrónicos del sistema. Te permite capturar, parsear y pre-imputar facturas de compra y venta emitidas electrónicamente en el territorio paraguayo.
        </p>

        <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-950/40 mt-4">
          <div className="p-4 border-b border-gray-800 bg-gray-900/40 flex justify-between items-center">
            <span className="text-xs font-bold text-white font-mono">Simulación de Flujo: Ingesta SIFEN</span>
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold">PROCESADO OK</span>
          </div>
          <div className="p-5 space-y-4 text-xs font-mono">
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
              <p className="text-blue-400 font-bold">XML SIFEN Detectado:</p>
              <p className="text-gray-400 leading-relaxed">
                &lt;rDE Id="01800123451001001000123412026051212345678901"&gt;<br />
                &nbsp;&nbsp;&lt;dNumDoc&gt;001-001-0001234&lt;/dNumDoc&gt;<br />
                &nbsp;&nbsp;&lt;dTotOpe&gt;1.100.000&lt;/dTotOpe&gt;<br />
                &lt;/rDE&gt;
              </p>
            </div>
            <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-gray-600 rotate-90" /></div>
            <div className="p-4 bg-purple-950/20 border border-purple-800/30 rounded-xl space-y-2">
              <p className="text-purple-300 font-bold">Imputación IA Sugerida:</p>
              <div className="flex justify-between border-b border-purple-900/30 pb-1 text-gray-300">
                <span>1.2.01 Mercaderías</span><span className="text-green-400">D: Gs. 1.000.000</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/30 pb-1 text-gray-300">
                <span>1.1.06 IVA Crédito 10%</span><span className="text-green-400">D: Gs. 100.000</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>2.1.01 Proveedores</span><span className="text-gray-400">H: Gs. 1.100.000</span>
              </div>
            </div>
          </div>
        </div>

        <h4 className="font-bold text-white mt-6 mb-2">Instrucciones Paso a Paso:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Navega a <strong className="text-white">Carga SIFEN</strong> en el menú lateral.</li>
          <li>Arrastra tu archivo XML de comprobante electrónico o pegá el XML directo.</li>
          <li>La IA de InteliCont leerá el RUC, la razón social, montos y desglosará el IVA automáticamente.</li>
          <li>Haz clic en <strong className="text-white">Generar Asiento</strong> para enviar la transacción directo al diario contable.</li>
        </ol>
      </div>
    )
  },
  {
    id: "cajachica",
    title: "3. Fondo Fijo y Caja Chica",
    icon: Wallet,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          El módulo de <strong className="text-white">Caja Chica</strong> está optimizado para registrar gastos menores del día a día, realizar arqueos de caja y automatizar las solicitudes de reposición del fondo fijo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="card p-4 space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Control del Límite de Gasto</span>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-3/4 rounded-full" />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Uso: 75%</span>
              <span className="text-amber-400 font-bold">Gs. 1.125.000 / Gs. 1.500.000</span>
            </div>
          </div>
          <div className="card p-4 bg-blue-950/10 border-blue-900/30 flex flex-col justify-center">
            <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">IVA Live Calculator</span>
            <p className="text-xs text-gray-300">Autocompleta el desglose contable del IVA 10%, 5% o exento al momento de rendir el ticket.</p>
          </div>
        </div>

        <h4 className="font-bold text-white mt-6 mb-2">Instrucciones Paso a Paso:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Ingresa a <strong className="text-white">Caja Chica</strong>. Selecciona tu fondo fijo activo.</li>
          <li>Haz clic en <strong className="text-white">Rendir Ticket / Gasto</strong>.</li>
          <li>Completa los datos del comprobante: fecha, RUC del proveedor, número de factura y monto total.</li>
          <li>Selecciona la tasa de IVA aplicada y la categoría del gasto (ej: Alimentación, Transporte).</li>
          <li>Al acumular comprobantes, presiona <strong className="text-white">Reponer Fondo (Reembolso)</strong> para generar el asiento contable de reposición y liquidar el arqueo.</li>
        </ol>
      </div>
    )
  },
  {
    id: "cobrospagos",
    title: "4. Cobros y Pagos (Tesoreria)",
    icon: CreditCard,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          Este módulo permite cancelar las facturas de clientes (cobros) o de proveedores (pagos), afectando las cuentas bancarias o de caja de manera directa y transparente.
        </p>

        <div className="border border-gray-800 rounded-2xl p-4 bg-gray-950/30 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Preview de Asiento Contable Automático</span>
          </div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-white">
              <span>1.1.02 Banco GNB Cta. Cte.</span>
              <span className="text-green-400">D: Gs. 6.050.000</span>
            </div>
            <div className="flex justify-between text-gray-400 pl-4 border-l border-gray-800">
              <span>1.1.05 Clientes (Comercial Paraguaya)</span>
              <span>H: Gs. 6.050.000</span>
            </div>
          </div>
        </div>

        <h4 className="font-bold text-white mt-6 mb-2">Instrucciones Paso a Paso:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Navega a <strong className="text-white">Cobros y Pagos</strong>.</li>
          <li>Usa las pestañas superiores para alternar entre Cobros (Clientes) o Pagos (Proveedores).</li>
          <li>Selecciona la factura pendiente que deseas liquidar.</li>
          <li>Selecciona la cuenta bancaria de origen o destino.</li>
          <li>Ingresa el número de referencia de la transferencia o cheque y presiona <strong className="text-white">Registrar Cobro/Pago</strong>.</li>
        </ol>
      </div>
    )
  },
  {
    id: "impuestos",
    title: "5. Liquidación e Impuestos IA",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          La calculadora tributaria te ayuda a realizar estimaciones rápidas de IVA, Impuesto a la Renta Empresarial (IRE) e Impuesto a la Renta Personal (IRP), complementado con un copiloto de optimización fiscal IA.
        </p>

        <div className="bg-purple-950/20 border border-purple-800/30 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Recomendación del Copiloto IA (Ejemplo)
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed italic">
            "De acuerdo con el Art. 88 de la Ley 6380/19, te sugerimos verificar que el IVA Crédito Fiscal generado por la compra de bienes de uso esté completamente imputado en el mes de la adquisición para acelerar la amortización tributaria de la empresa."
          </p>
        </div>

        <h4 className="font-bold text-white mt-6 mb-2">Instrucciones Paso a Paso:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Ve a <strong className="text-white">Liquidación Impuestos</strong>.</li>
          <li>Completa los datos en la pestaña correspondiente (ej: Ventas y Compras en IVA).</li>
          <li>Presiona <strong className="text-white">Calcular</strong> para ver el saldo a favor o el impuesto a pagar.</li>
          <li>Haz clic en <strong className="text-white">Copiloto Fiscal IA</strong> para recibir un informe de contingencia y sugerencias de ahorro tributario legal en Paraguay.</li>
        </ol>
      </div>
    )
  },
  {
    id: "superadmin",
    title: "6. Superadmin SaaS Control",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300 leading-relaxed">
          El panel de control <strong className="text-white">Superadmin</strong> permite gestionar de forma global todos los Estudios Contables clientes, controlar sus planes, facturación mensual, y vincular los contribuyentes que registran.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
            <span className="text-[10px] text-gray-500 block">PLAN PRO</span>
            <span className="text-sm font-bold text-white">Gs. 385.000/mes</span>
          </div>
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
            <span className="text-[10px] text-gray-500 block">PLAN INHOUSE</span>
            <span className="text-sm font-bold text-white">Gs. 440.000/mes</span>
          </div>
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl">
            <span className="text-[10px] text-gray-500 block">PLAN ENTERPRISE</span>
            <span className="text-sm font-bold text-white">Gs. 650.000/mes</span>
          </div>
        </div>

        <h4 className="font-bold text-white mt-6 mb-2">Instrucciones Paso a Paso:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Ingresa a `/superadmin` con tus credenciales de administrador global.</li>
          <li>Usa la pestaña <strong className="text-white">Estudios Contables</strong> para crear nuevos estudios clientes e indicar su correo de contacto y plan comercial.</li>
          <li>Usa la pestaña <strong className="text-white">Contribuyentes</strong> para registrar empresas contables asignándolas al estudio contable correspondiente.</li>
          <li>Activa o desactiva características premium (ej: IA, SIFEN) mediante los interruptores del panel lateral.</li>
        </ol>
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
          Guía interactiva detallada de flujo de procesos, contabilidad paraguaya y administración de InteliCont.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Menú del Manual</h3>
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
          <div className="card p-6 sm:p-8 space-y-6 min-h-[400px]">
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

    </div>
  );
}
