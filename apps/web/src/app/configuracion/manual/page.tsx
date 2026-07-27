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
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <p>
          Bienvenido al manual oficial e interactivo de <strong className="text-white font-semibold">InteliCont™</strong>, la plataforma de contabilidad inteligente SaaS diseñada para el mercado tributario de Paraguay. Este documento provee instrucciones detalladas paso a paso, flujos lógicos de control y mocks de datos del mundo real para guiar a los usuarios desde el onboarding inicial hasta operaciones contables complejas.
        </p>

        <div className="bg-gradient-to-br from-blue-950/20 to-transparent border border-blue-900/30 rounded-2xl p-5">
          <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="h-4.5 w-4.5" /> Arquitectura Jerárquica del Sistema
          </h4>
          <p className="text-xs text-gray-400 mb-4">
            InteliCont opera bajo una estructura de niveles diseñada para estudios contables independientes o departamentos de auditoría interna de grandes grupos empresariales:
          </p>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">1</div>
              <div>
                <p className="font-semibold text-white">Estudios Contables (Tenant principal / Cuenta de Pago)</p>
                <p className="text-gray-400">Representa la entidad legal que contrata la suscripción a InteliCont. Es responsable del pago del MRR según el plan contratado. Administra sus propios usuarios internos (contadores, auditores, asistentes).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 font-bold text-blue-400">2</div>
              <div>
                <p className="font-semibold text-white">Empresas Contribuyentes (Sub-entidades / Clientes del Estudio)</p>
                <p className="text-gray-400">Son las empresas particulares cuyos libros son procesados. Cada contribuyente posee su propio plan de cuentas, libro diario, timbrados y reportes RG90.</p>
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
            <p className="text-gray-500 pl-4">└── 💼 Contribuyente A: Comercial Paraguaya S.A. (RUC: 3456789-0)</p>
            <p className="text-gray-500 pl-4">└── 💼 Contribuyente B: Importadora del Este S.A. (RUC: 80012345-1)</p>
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
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.1 Panel General (Dashboard)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Provee una perspectiva global en tiempo real de la situación de la empresa activa. Presenta tres indicadores principales: Ingresos Acumulados, Gastos del Mes y Efectivo Disponible.
          </p>
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mt-3 ml-6 font-mono text-xs space-y-2">
            <p className="text-gray-400">MOCK DASHBOARD INTEGRADO</p>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-gray-900 p-2 rounded"><p className="text-gray-500">INGRESOS</p><p className="text-green-400 font-bold">Gs. 45.000.000</p></div>
              <div className="bg-gray-900 p-2 rounded"><p className="text-gray-500">EGRESOS</p><p className="text-red-400 font-bold">Gs. 18.250.000</p></div>
              <div className="bg-gray-900 p-2 rounded"><p className="text-gray-500">DISPONIBLE</p><p className="text-white font-bold">Gs. 26.750.000</p></div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.2 Carga SIFEN (Ingesta Electrónica)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Procesa e importa comprobantes XML de facturas electrónicas oficiales en Paraguay. Desglosa los montos exentos y calcula de forma automática el crédito o débito fiscal de la transacción.
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
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-4">
            <li>Navega a <strong className="text-white">Carga SIFEN</strong>.</li>
            <li>Arrastra el archivo <strong className="text-white">.xml</strong> de tu factura de compra o venta al contenedor de carga.</li>
            <li>El sistema mostrará en pantalla la razón social del emisor, RUC, número y timbrado del documento.</li>
            <li>La IA propondrá un mapeo de cuentas contables. Confirma los campos y haz clic en <strong className="text-white">Crear Asiento Contable</strong>.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.3 Historial SIFEN
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra el registro cronológico de todos los XMLs importados a la base de datos.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Historial SIFEN</strong>.</li>
            <li>Usa la barra de búsqueda superior para encontrar documentos por número de factura o RUC del emisor.</li>
            <li>Bajo el listado, haz clic en cualquier fila para desplegar la información y ver el asiento contable asociado.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.4 Bandeja de Comprobantes
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Almacena de forma temporal los documentos escaneados o PDF de facturas pendientes de imputación.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Bandeja Comprobantes</strong>.</li>
            <li>Sube el archivo de imagen o PDF de tu factura.</li>
            <li>Haz clic en <strong className="text-white">Procesar con IA</strong> para autocompletar los campos fiscales, o en <strong className="text-white">Imputar Manualmente</strong>.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 2.5 Empresas (Contribuyentes)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Módulo para la creación de empresas contribuyentes asociadas al Estudio.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Empresas</strong> en la barra lateral.</li>
            <li>Haz clic en <strong className="text-white">Agregar Empresa</strong>.</li>
            <li>Completa el RUC con dígito verificador, Razón Social, Dirección Comercial y tipo de entidad (IRE General / Simple o ESFL).</li>
            <li>Pulsa guardar. La nueva empresa aparecerá disponible en el selector rápido en la barra superior.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: "contabilidad",
    title: "3. Contabilidad",
    icon: FileText,
    content: (
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.1 Asientos Contables (Diario Diario)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra todos los asientos contables manuales y automáticos registrados.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Asientos Contables</strong> y haz clic en <strong className="text-white">Nuevo Asiento</strong>.</li>
            <li>Ingresa la fecha contable, número de referencia interna y concepto general de la operación.</li>
            <li>En la grilla de cuentas, selecciona la cuenta del debe, ingresa el importe. Añade una fila para la cuenta del haber.</li>
            <li>Verifica que la diferencia sea cero. Presiona <strong className="text-white">Postear Asiento</strong>.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.2 Plan de Cuentas
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Estructura jerárquica de cuentas de la empresa.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Plan de Cuentas</strong>.</li>
            <li>Selecciona una cuenta del listado para ver su naturaleza (Activo, Pasivo, Gasto).</li>
            <li>Haz clic en <strong className="text-white">Nueva Cuenta</strong>, define el código jerárquico (ej: <code className="font-mono bg-gray-800 px-1 py-0.5 rounded text-blue-300">1.1.02.05</code>) y el nombre de la cuenta. Pulsa guardar.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.3 Libros Diarios y Mayores
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra el detalle contable de movimientos mensuales.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Libros Diarios/Mayores</strong>.</li>
            <li>Filtra seleccionando la cuenta a auditar y el período de fechas de interés.</li>
            <li>Haz clic en <strong className="text-white">Generar Mayor</strong>. El sistema listará todos los débitos, créditos y saldos acumulados deudores/acreedores.</li>
          </ol>
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
            Módulo de resguardo y seguridad contable.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Cierre de Períodos</strong>.</li>
            <li>Selecciona el mes y año contable a cerrar.</li>
            <li>Haz clic en <strong className="text-white">Cerrar Período Contable</strong>. Esto bloqueará toda edición y creación de asientos del mes seleccionado.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.6 Estados Financieros
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Genera e imprime los estados financieros reglamentarios de la SET/DNIT.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Estados Financieros</strong>.</li>
            <li>Selecciona el ejercicio fiscal de interés.</li>
            <li>Haz clic en <strong className="text-white">Balance General</strong> o <strong className="text-white">Estado de Resultados</strong> para emitir los reportes consolidados.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 3.7 Clientes / Proveedores (Terceros)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Directorio de las contrapartes comerciales del contribuyente.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Clientes / Proveedores</strong>.</li>
            <li>Haz clic en <strong className="text-white">Nuevo Tercero</strong>.</li>
            <li>Carga la Razón Social, RUC, Teléfono y Correo.</li>
            <li>Define su rol (Cliente, Proveedor o Ambos) y presiona guardar.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: "tesoreria_finanzas",
    title: "4. Tesorería y Finanzas",
    icon: Coins,
    content: (
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 4.1 Conciliación Bancaria
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Modulo para cruzar movimientos del extracto bancario físico con el libro mayor de banco del sistema.
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
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-4">
            <li>Ingresa a <strong className="text-white">Conciliación Bancaria</strong> e importa el archivo CSV de movimientos bancarios del mes.</li>
            <li>El sistema comparará las fechas y montos y propondrá matches automáticos en la pantalla.</li>
            <li>Para cada coincidencia correcta, haz clic en el botón de confirmación verde (asiento cuadrado).</li>
            <li>Si hay movimientos sin coincidencia (ej: comisiones bancarias), presiona <strong className="text-white">Registrar Gasto</strong> para generar la póliza directo desde la grilla.</li>
          </ol>
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
            <li>Selecciona el IVA correspondiente (10%, 5% o exento) y la categoría del gasto.</li>
            <li>Presiona guardar. Una vez acumulado, presiona <strong className="text-white">Reponer Fondo</strong> para generar la póliza contable automática.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 4.3 Órdenes de Pago
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Flujo de egresos autorizados:
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
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.1 Calendario Fiscal
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra de manera interactiva las fechas de vencimiento de las obligaciones tributarias (IVA, IRE, etc.) asociadas a la terminación del RUC de la empresa.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.2 Libro IVA / RG90
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Consolida las ventas y compras registradas y genera los archivos CSV requeridos para la carga masiva en el aplicativo de la SET.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Accede a <strong className="text-white">Libro IVA / RG90</strong>.</li>
            <li>Selecciona el mes y año contable.</li>
            <li>Presiona <strong className="text-white">Exportar CSV RG90</strong>. El sistema descargará los archivos de compras y ventas listos para su importación directa en Marangatú.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.3 Liquidación Impuestos
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Estimador rápido de impuestos en base a los datos operativos del contribuyente.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Ve a <strong className="text-white">Liquidación Impuestos</strong>.</li>
            <li>Completa los datos en la pestaña correspondiente (ej: Ventas y Compras en IVA).</li>
            <li>Presiona <strong className="text-white">Calcular</strong> para ver el saldo a favor o el impuesto a pagar.</li>
            <li>Haz clic en <strong className="text-white">Copiloto Fiscal IA</strong> para recibir un informe de contingencia y sugerencias de ahorro tributario legal en Paraguay.</li>
          </ol>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 5.4 Retenciones Tesakã
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6 font-semibold">
            Emisión de comprobante de retenciones:
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
            Control de Timbrados:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-gray-300 pl-6 mt-2">
            <li>Navega a <strong className="text-white">Timbrados y Autoimp.</strong></li>
            <li>Registra un nuevo número de timbrado especificando la vigencia (fecha de inicio y fin) y los rangos de facturación permitidos.</li>
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
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.1 Reportes Varios
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Muestra el listado de todos los reportes operativos del sistema. Permite exportar en un par de clics balances de sumas y saldos, balances generales consolidados en Excel o archivos PDF firmados digitalmente.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.2 Auditoría Contable (InteliAudit™)
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Módulo que audita de forma inteligente los últimos 10 asientos contables del libro diario utilizando Gemini. Busca descuadres, falta de desglose de IVA y riesgos contables generales.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-blue-400" /> 6.3 Mi Estudio
          </h4>
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed pl-6">
            Configuración general de la suscripción del estudio contable. Permite ajustar datos del emisor del estudio, cuentas de cobro e invitar o remover usuarios de la organización.
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
