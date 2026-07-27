# InteliCont — Manual de Usuario Completo

> **Versión:** 1.0.0  
> **Última actualización:** Julio 2026  
> **Sistema:** Contabilidad Inteligente para Paraguay

---

## Índice General

1. [Introducción](#1-introducción)
2. [Primeros Pasos](#2-primeros-pasos)
3. [Panel de Control (Dashboard)](#3-panel-de-control-dashboard)
4. [Módulo Empresas](#4-módulo-empresas)
5. [Módulo SIFEN](#5-módulo-sifen)
6. [Módulo Comprobantes](#6-módulo-comprobantes)
7. [Módulo Asientos Contables](#7-módulo-asientos-contables)
8. [Módulo Plan de Cuentas](#8-módulo-plan-de-cuentas)
9. [Módulo Libros Contables](#9-módulo-libros-contables)
10. [Módulo Libro IVA](#10-módulo-libro-iva)
11. [Módulo Activos Fijos (Bienes de Uso)](#11-módulo-activos-fijos-bienes-de-uso)
12. [Módulo Terceros (Clientes/Proveedores)](#12-módulo-terceros-clientesproveedores)
13. [Módulo Bancos y Conciliación](#13-módulo-bancos-y-conciliación)
14. [Módulo Caja Chica](#14-módulo-caja-chica)
15. [Módulo Tesorería](#15-módulo-tesorería)
16. [Módulo Calendario Fiscal](#16-módulo-calendario-fiscal)
17. [Módulo RG90](#17-módulo-rg90)
18. [Módulo Impuestos (IVA/IRE/IRP)](#18-módulo-impuestos-ivaireirp)
19. [Módulo Retenciones Tesaka](#19-módulo-retenciones-tesaka)
20. [Módulo Timbrados](#20-módulo-timbrados)
21. [Formulario 104 (IVA)](#21-formulario-104-iva)
22. [Formulario 501 (IRE)](#22-formulario-501-ire)
23. [Módulo Fiscal / Hechauka](#23-módulo-fiscal--hechauka)
24. [Módulo Cierre de Períodos](#24-módulo-cierre-de-períodos)
25. [Módulo Estados Financieros](#25-módulo-estados-financieros)
26. [Módulo Períodos Fiscales](#26-módulo-períodos-fiscales)
27. [Módulo Cuentas Corrientes](#27-módulo-cuentas-corrientes)
28. [Módulo Cobros y Pagos](#28-módulo-cobros-y-pagos)
29. [Módulo Multimoneda](#29-módulo-multimoneda)
30. [Módulo Documentos](#30-módulo-documentos)
31. [Módulo Importaciones (Despachos)](#31-módulo-importaciones-despachos)
32. [Módulo Importar (CSV/XML)](#32-módulo-importar-csvxml)
33. [Módulo Reportes](#33-módulo-reportes)
34. [Módulo Configuración](#34-módulo-configuración)
35. [Módulo Auditoría](#35-módulo-auditoría)
36. [Superadmin SaaS](#36-superadmin-saas)
37. [Portal del Cliente](#37-portal-del-cliente)
38. [Offline y PWA](#38-offline-y-pwa)
39. [Atajos de Teclado](#39-atajos-de-teclado)
40. [Apéndice: Glosario PY](#40-apéndice-glosario-py)

---

## 1. Introducción

### 1.1 ¿Qué es InteliCont?

**InteliCont** es un sistema de contabilidad SaaS diseñado específicamente para el mercado paraguayo. Es la columna vertebral del ecosistema **Inteli\***, que integra múltiples productos para estudios contables y empresas:

| Producto | Función |
|---|---|
| **InteliCont** | Contabilidad general y gestión fiscal |
| **InteliAudit** | Auditoría externa |
| **Sueldok** | RRHH y nómina |
| **InteliMarket** | ERP comercial |

### 1.2 Filosofía del sistema

- **Doble partida estricta**: cada asiento debe balancear débito = crédito por moneda. El sistema valida automáticamente esta condición antes de postear.
- **Libro inmutable**: una vez posteado, un asiento no se modifica ni elimina. Las correcciones se hacen mediante **contra-asientos** (reversal) o **ajustes** (versionOf). Esto garantiza la integridad del registro contable ante la SET/DNIT.
- **Multi-tenant**: un estudio contable puede gestionar N empresas desde una sola cuenta. Cada empresa es independiente con su propio plan de cuentas, períodos y libros.
- **AI-first**: la inteligencia artificial (Claude, Gemini o motor de reglas) sugiere asientos, detecta anomalías y automatiza procesos. Siempre con validación humana (human-in-the-loop).
- **Cumplimiento PY**: todas las reglas fiscales paraguayas están incorporadas: RUC, Timbrado, CDC (44 dígitos), IVA 10%/5%/exento, IRE, IRP, Hechauka, RG90, Tesaka.

### 1.3 Perfiles de usuario (Roles)

| Rol | Permisos |
|---|---|
| **Administrador** | Acceso total a la empresa, configuración, cierre de períodos, invitación de miembros |
| **Contador** | Crear/postear asientos, libros, reportes, impuestos, conciliaciones |
| **Asistente** | Carga SIFEN, comprobantes, consultas de lectura |
| **Auditor** | Solo lectura histórica de toda la información |
| **Cliente** | Portal limitado: ver balances, estados financieros, descargar reportes |

### 1.4 Requisitos del sistema

- Navegador moderno: Chrome 90+, Firefox 90+, Edge 90+, Safari 15+
- Conexión a internet (con soporte offline limitado para ciertas operaciones)
- Resolución mínima recomendada: 1280 × 720
- Cuenta de email para magic link / invitaciones

---

## 2. Primeros Pasos

### 2.1 Acceso al sistema

**Pantalla de Login**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Logo InteliCont]                       │
│        "Contabilidad Inteligente"                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Correo electrónico                          │   │
│  │  [________________________________________] │   │
│  │                                             │   │
│  │  [Enviar magic link]  [Usar contraseña ▾]   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ¿Primera vez? Solicite su invitación               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Paso a paso: Inicio de sesión con Magic Link**

1. Ingrese su correo electrónico en el campo correspondiente
2. Haga clic en el botón **"Enviar magic link"**
3. Revise su bandeja de entrada. Recibirá un email con un enlace mágico
4. Haga clic en el enlace (válido por 15 minutos por seguridad)
5. Será redirigido automáticamente al sistema

**Alternativa: Inicio de sesión con contraseña**

1. Despliegue el selector **"Usar contraseña ▾"**
2. Ingrese su email y contraseña
3. Haga clic en **"Iniciar sesión"**

**Recuperación de contraseña**

1. En la pantalla de login, seleccione **"¿Olvidó su contraseña?"**
2. Ingrese su correo electrónico
3. Recibirá un enlace para restablecer la contraseña (válido 30 minutos)
4. Establezca una nueva contraseña (mínimo 8 caracteres, recomendado 12+)

### 2.2 Onboarding — Primera configuración

Al ingresar por primera vez, el sistema le guiará a través del asistente de configuración inicial:

```
┌────────────────────────────────────────────────────────┐
│  🚀 ¡Bienvenido a InteliCont!    Paso 1 de 4           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  ¿Eres un estudio contable?                     │   │
│  │                                                 │   │
│  │  ○ Sí, soy un estudio contable                   │   │
│  │    → Gestionaré múltiples empresas              │   │
│  │                                                 │   │
│  │  ○ No, soy una empresa individual               │   │
│  │    → Gestionaré solo mi empresa                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│              [Cancelar]      [Continuar →]              │
└────────────────────────────────────────────────────────┘
```

**Pasos del onboarding:**

| Paso | Descripción |
|---|---|
| **1. Tipo de cuenta** | ¿Estudio contable o empresa individual? |
| **2. Datos del estudio/empresa** | RUC, razón social, nombre comercial, régimen tributario |
| **3. Plan contable** | Seleccionar plantilla: PY Fiscal, NIIF, EEF (sector público), o Mixto |
| **4. Invitar equipo** | Agregar miembros por email con roles asignados |

### 2.3 Interfaz principal — Mapa de navegación

Al completar el onboarding, accederá a la interfaz principal. Este es el mapa completo:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [≡] [Logo] [Buscar... ⌘K]            [Importadora del Este ▾]  [🤖] [🌙] [🔔3] [GA▾] │
├──────────────────────────────────────────────────┬────────────────────────────────┤
│                                                   │                                │
│  🏢 GESTIÓN PRINCIPAL                             │  ← ÁREA DE CONTENIDO →        │
│  ─────────────────────                             │                                │
│  📊 Panel General                                 │  Aquí se renderiza el módulo  │
│  📄 Carga SIFEN                           [IA]    │  activo seleccionado en la     │
│  📄 Historial SIFEN                               │  barra lateral o desde la      │
│  📁 Bandeja Comprobantes                          │  paleta de comandos.           │
│  🏢 Empresas                                      │                                │
│                                                   │                                │
│  📝 CONTABILIDAD                                  │  Ejemplo: Panel General        │
│  ─────────────────────                             │  muestra KPIs, gráficos,       │
│  📝 Asientos Contables                            │  vencimientos e InteliInsights │
│  #📊 Plan de Cuentas                              │                                │
│  📖 Libros Diarios/Mayores                        │                                │
│  📦 Bienes de Uso (Activos)                       │                                │
│  🔒 Cierre de Períodos                            │                                │
│  📈 Estados Financieros                           │                                │
│  👥 Clientes/Proveedores                          │                                │
│                                                   │                                │
│  💳 TESORERÍA Y FINANZAS                          │                                │
│  ─────────────────────                             │                                │
│  💳 Conciliación Bancaria                         │                                │
│  👛 Caja Chica                                    │                                │
│  🪙 Órdenes de Pago                               │                                │
│                                                   │                                │
│  📋 GESTIÓN FISCAL                                │                                │
│  ─────────────────────                             │                                │
│  📅 Calendario Fiscal                             │                                │
│  📕 Libro IVA / RG90                              │                                │
│  🧮 Liquidación Impuestos                         │                                │
│  📋 Retenciones Tesaka                            │                                │
│  🏷️ Timbrados y Autoimp.                         │                                │
│                                                   │                                │
│  ⚙️ SOPORTE Y CONFIGURACIÓN                       │                                │
│  ─────────────────────                             │                                │
│  📊 Reportes Varios                               │                                │
│  🔍 Auditoría Contable                            │                                │
│  ⚙️ Mi Estudio (Configuración)                    │                                │
│  📖 Manual de Usuario                             │                                │
│  🔧 Superadmin SaaS                               │                                │
├──────────────────────────────────┴────────────────────────────────────────────────┤
│  [👤 IC] Gustavo A. — Administrador / Contador           [Cerrar Sesión ▾]         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Selector de empresa (Entity Switcher)

El selector de empresa permite cambiar entre las entidades que gestiona. Está disponible tanto en la barra superior como en la barra lateral:

```
┌─────────────────────────────────┐
│  🏢 Importadora del Este        │ ← Empresa activa (checkmark)
│     RUC 80012345-1              │
│─────────────────────────────────│
│  🏢 Tech Asunción S.A.          │
│     RUC 80123456-3              │
│─────────────────────────────────│
│  🏢 Distribuidora Ñandutí       │
│     RUC 80234567-5              │
├─────────────────────────────────┤
│  ➕ Nueva Empresa               │
└─────────────────────────────────┘
```

Al cambiar de empresa, todo el contexto del sistema cambia: dashboard, cuentas, asientos, libros, impuestos. Es como cambiar de "libro contable" al instante.

### 2.5 Barra de búsqueda global (⌘K / Ctrl+K)

Presione `⌘ + K` (Mac) o `Ctrl + K` (Windows/Linux) para abrir la paleta de comandos:

```
┌────────────────────────────────────────────────────────────┐
│  🔍 Buscar páginas, acciones...                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ◆  Navegación                                             │
│     📊 Panel General                                       │
│     📄 Carga SIFEN                                         │
│     📝 Asientos Contables                                  │
│     💳 Conciliación Bancaria                               │
│                                                            │
│  ◆  Acciones rápidas                                       │
│     ➕ Nuevo Asiento                                       │
│     ➕ Nueva Empresa                                       │
│     📤 Importar CSV                                        │
│                                                            │
│  ◆  Configuración                                          │
│     ⚙️ Tema: Oscuro                                       │
│     🚪 Cerrar sesión                                       │
└────────────────────────────────────────────────────────────┘
```

Use `↑ ↓` para navegar, `Enter` para seleccionar y `Esc` para cerrar. Escriba parcialmente el nombre (ej: "sif" → muestra Carga SIFEN e Historial SIFEN).

### 2.6 Barra superior — Acciones rápidas

| Elemento | Descripción |
|---|---|
| 🤖 **InteliAsistente** | Botón morado que abre el panel de IA con sugerencias activas |
| 🌙 **Tema** | Alterna entre Claro, Oscuro y Sistema (se guarda en preferencias) |
| 🔔 **Notificaciones** | Campana con contador de notificaciones no leídas. Muestra vencimientos, alertas y eventos del sistema |
| 👤 **Menú de usuario** | Acceso a Mi Perfil, Configuración, Ayuda y Cerrar Sesión |

---

## 3. Panel de Control (Dashboard)

### 3.1 Vista general

El Dashboard es la página principal del sistema. Proporciona una visión integral del estado de la empresa activa.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Sistema Contable Inteligente                                                  │
│  IMPORTADORA DEL ESTE S.A.                                                        │
│  mayo 2026 · RUC 80012345-1                       [📤 Importar]  [➕ Nuevo Asiento]│
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ ┌──────────┐│
│  │  Saldo IVA a Favor │ │  Ingresos Mayo     │ │  SIFEN Pendientes  │ │Próx.Venc.││
│  │  Gs. 2.5M          │ │  Gs. 31.1M         │ │  4                 │ │12 May    ││
│  │  Crédito Fiscal    │ │  +12% ▲            │ │  Gs. 6.4M total    │ │IVA F.104 ││
│  └────────────────────┘ └────────────────────┘ └────────────────────┘ └──────────┘│
│                                                                                   │
│  ┌───────────────────────────────────────────┐ ┌──────────────────────────────┐  │
│  │  Evolución de IVA                         │ │  📅 Vencimientos             │  │
│  │                                           │ │                              │  │
│  │  Gs. 6M ┤  ██                            │ │  🔴 IVA — Formulario 104     │  │
│  │  Gs. 4M ┤  ██ ██                         │ │     Importadora del Este     │  │
│  │  Gs. 2M ┤  ██ ██ ██  ██                  │ │     ███████████░░░░░░  7 días │  │
│  │  Gs. 0  ┤──█──█──█──█──█──               │ │                              │  │
│  │         └────────────────                 │ │  🟡 Hechauka                  │  │
│  │    Ene  Feb  Mar  Abr  May                │ │     Importadora del Este     │  │
│  │                                           │ │     █████░░░░░░░░░░░░ 20 días│  │
│  │  ● Débito (IVA Ventas)                    │ │                              │  │
│  │  ● Crédito (IVA Compras)                  │ │  🟡 IRE — Formulario 1301    │  │
│  │                                           │ │     Tech Asunción            │  │
│  │  Accesos rápidos:                         │ │     ██████░░░░░░░░░░░ 10 días│  │
│  │  [🧾] [📕] [🧮] [💳] [👛] [🚢] [🪙]    │ │                              │  │
│  │                                           │ │  [📅 Ver Calendario Fiscal]  │  │
│  │                                           │ ├──────────────────────────────┤  │
│  │                                           │ │  ✨ InteliInsights            │  │
│  │                                           │ │  Hemos detectado 4 nuevas    │  │
│  │                                           │ │  facturas en SIFEN.          │  │
│  │                                           │ │  ¿Deseas procesar los         │  │
│  │                                           │ │  asientos automáticamente?    │  │
│  │                                           │ │  [🤖 Revisar Ahora]          │  │
│  └───────────────────────────────────────────┘ └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Componentes del Dashboard

#### Tarjetas KPI

| KPI | Qué mide | Interpretación |
|---|---|---|
| **Saldo IVA a Favor** | Crédito fiscal − Débito fiscal del período | Positivo = crédito fiscal a favor. Negativo = saldo a pagar a la SET |
| **Ingresos del Mes** | Facturación total del mes actual | ▲ = crecimiento vs mes anterior. Ayuda a monitorear la actividad |
| **SIFEN Pendientes** | Facturas electrónicas importadas no contabilizadas | Debe tender a 0. Idealmente se procesan diariamente |
| **Próximo Vencimiento** | Fecha límite fiscal más cercana | Color rojo si ≤7 días, amarillo si ≤15 días |

#### Gráfico "Evolución de IVA"

Gráfico de barras que compara el **débito fiscal** (IVA de ventas/ingresos) vs **crédito fiscal** (IVA de compras/gastos) de los últimos 6 meses. Útil para:

- Planificar pagos de IVA
- Identificar meses con alta carga fiscal
- Detectar inconsistencias (si el crédito supera significativamente al débito)
- Preparar la declaración del Formulario 104

#### InteliInsights — Feed de actividad

El asistente de IA muestra en tiempo real:

- **Alertas de vencimientos** fiscales próximos
- **Sugerencias de contabilización** basadas en facturas SIFEN recibidas
- **Resumen de actividad** del día (asientos posteados, XMLs procesados)
- **Recomendaciones** para optimizar procesos contables

### 3.3 Accesos rápidos

| Icono | Módulo | Ruta |
|---|---|---|
| 🧾 | Facturación (SIFEN) | `/sifen` |
| 📕 | Libros IVA | `/libro-iva` |
| 🧮 | Liquidación de Impuestos | `/impuestos` |
| 💳 | Bancos / Conciliación | `/banco` |
| 👛 | Caja Chica | `/caja-chica` |
| 🚢 | Importaciones | `/importaciones` |
| 🪙 | Tesorería | `/tesoreria` |

### 3.4 Botones de acción principal

| Botón | Descripción |
|---|---|
| **📤 Importar** | Abre el asistente de importación (CSV, XML, PDF) |
| **➕ Nuevo Asiento** | Atajo directo al formulario de creación de asientos contables |

---

## 4. Módulo Empresas

### 4.1 Acceso

Navegación: **Gestión Principal → Empresas** | Ruta: `/empresas`

Gestiona las entidades (empresas) que forman parte de su portafolio contable.

### 4.2 Listado de empresas

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏢 Empresas                                              [+ Nueva Empresa]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar empresas...________________________________]                     │
│                                                                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┬────────────┐  │
│  │ Empresa      │ RUC          │ Régimen      │ Plan         │ Miembros   │  │
│  ├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤  │
│  │Imp. del Este │ 80012345-1   │ Renta General │ Profesional  │ 4 miembros │  │
│  │Tech Asunción │ 80123456-3   │ Renta Simple  │ Profesional  │ 2 miembros │  │
│  │Dist. Ñandutí │ 80234567-5   │ Renta General │ Básico       │ 1 miembro  │  │
│  │Comercial ABC │ 80345678-7   │ Resimple      │ Profesional  │ 3 miembros │  │
│  │Serv. Gamma   │ 80456789-2   │ Renta General │ Básico       │ 2 miembros │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┴────────────┘  │
│                                                                               │
│  Mostrando 1-5 de 12                                         ← 1 2 3 ... →   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Crear una nueva empresa

**Paso a paso:**

1. Haga clic en el botón **"+ Nueva Empresa"** (esquina superior derecha)
2. Complete el formulario de datos básicos:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ➕ Nueva Empresa                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📋 DATOS BÁSICOS                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Razón social    [Tech Asunción S.A.                              ]  │  │
│  │ Nombre fant.    [Tech Asunción                                   ]  │  │
│  │ RUC             [80123456-3                                      ]  │  │
│  │ Tipo entidad    [▼ Persona Jurídica                               ]  │  │
│  │ Régimen fiscal  [▼ Renta Simple (10% IRE)                        ]  │  │
│  │ Moneda base     [▼ Guaraníes (PYG)                                ]  │  │
│  │ País            [▼ Paraguay                                       ]  │  │
│  │ Ciudad          [Asunción                                       ]  │  │
│  │ Dirección       [Av. España 567                                  ]  │  │
│  │ Teléfono        [021 234 567                                     ]  │  │
│  │ Email           [contabilidad@techasuncion.com                    ]  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ⚙️ CONFIGURACIÓN CONTABLE                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Plan de cuentas  [▼ Plantilla PY - Fiscal (estándar)              ]  │  │
│  │ Tipo COA         [● PY Fiscal  ○ NIIF  ○ EEF  ○ Mixto           ]  │  │
│  │ Módulo IA        [✓ Activar InteliAsistente                      ]  │  │
│  │ Proveedor IA     [▼ Anthropic Claude Sonnet                      ]  │  │
│  │ IVA Aduana       [● Sí, agente  ○ No                             ]  │  │
│  │ Base imponible   [● Por lo devengado  ○ Por lo percibido        ]  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Cancelar]                                    [✓ Crear Empresa]          │
└────────────────────────────────────────────────────────────────────────────┘
```

3. Revise los datos ingresados
4. Haga clic en **"Crear Empresa"**
5. El sistema creará automáticamente:
   - **Plan de cuentas** completo según la plantilla seleccionada
   - **Período fiscal** corriente abierto
   - **Configuraciones fiscales** por defecto (alícuotas IVA, tasas retención)
   - **Cuentas contables** estándar del PY fiscal

### 4.4 Ficha de empresa — Pestañas

Al hacer clic en una empresa del listado, se abre su ficha con las siguientes pestañas:

```
┌────────────────────────────────────────────────────────────────────┐
│  🏢 Tech Asunción S.A.                  RUC 80123456-3             │
├────────────────────────────────────────────────────────────────────┤
│  [📋 Datos Grales] [🏷️ Comercial] [⚙️ Config.] [👥 Miembros] [💎 Plan] │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  (Contenido de la pestaña activa)                                   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

| Pestaña | Contenido |
|---|---|
| **📋 Datos Grales** | Razón social, RUC, dirección, teléfono, email, ciudad, tipo de entidad, régimen fiscal |
| **🏷️ Comercial** | Logotipo de la empresa (upload), sitio web, redes sociales, sector económico |
| **⚙️ Config.** | Preferencias de IA (proveedor, activo/inactivo), moneda base, plan de cuentas, ajustes fiscales (IVA aduana, base imponible) |
| **👥 Miembros** | Gestión de usuarios invitados y sus roles en esta empresa |
| **💎 Plan** | Plan contratado, MRR (Monthly Recurring Revenue), límites del plan, fecha de facturación |

### 4.5 Gestión de miembros

En la pestaña **"Miembros"** puede administrar quién tiene acceso a la empresa:

```
┌────────────────────────────────────────────────────────────────────────┐
│  👥 Miembros de Tech Asunción S.A.           [+ Invitar miembro]      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┬─────────────────┬──────────────┬──────────┬────────┐  │
│  │ Usuario     │ Email           │ Rol          │ Estado   │ Acción │  │
│  ├─────────────┼─────────────────┼──────────────┼──────────┼────────┤  │
│  │ Gustavo A.  │ g@estudio.py    │ Administ.    │ ● Activo │ [✎] [✕]│  │
│  │ María L.    │ m@estudio.py    │ Contador     │ ● Activo │ [✎] [✕]│  │
│  │ Carlos P.   │ c@cliente.com   │ Cliente      │ ○ Pend.  │ [✕]    │  │
│  │ Juana R.    │ j@estudio.py    │ Asistente    │ ● Activo │ [✎] [✕]│  │
│  └─────────────┴─────────────────┴──────────────┴──────────┴────────┘  │
│                                                                         │
│  ➕ Invitar nuevo miembro:                                              │
│  Email [____________________]  Rol [▼ Contador]  [📧 Enviar invitación]│
└────────────────────────────────────────────────────────────────────────┘
```

**Roles disponibles al invitar:**

- **Administrador**: control total (configuración, miembros, cierre)
- **Contador**: operativa contable completa (asientos, libros, impuestos)
- **Asistente**: opera SIFEN, comprobantes, consultas
- **Auditor**: solo lectura de toda la información
- **Cliente**: acceso limitado al portal del cliente

### 4.6 Eliminar empresa

Para eliminar una empresa, acceda a la ficha y seleccione la opción en el menú de acciones. El sistema solicitará confirmación:

```
┌──────────────────────────────────────────────────────┐
│  ⚠️ ¿Está seguro de eliminar esta empresa?           │
│                                                       │
│  Tech Asunción S.A. (RUC 80123456-3)                  │
│                                                       │
│  Esta acción es irreversible. Todos los datos         │
│  contables, asientos y documentos asociados           │
│  serán eliminados permanentemente.                    │
│                                                       │
│  [Cancelar]                    [✓ Confirmar Eliminar] │
└──────────────────────────────────────────────────────┘
```

---

## 5. Módulo SIFEN

### 5.1 Carga SIFEN (Importar XML del portal SET)

**Ruta:** Gestión Principal → Carga SIFEN → `/sifen`

El SIFEN (Sistema de Facturación Electrónica Nacional) es el portal de comprobantes electrónicos de la SET/DNIT. InteliCont permite importar automáticamente las facturas desde los archivos XML.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📄 Carga SIFEN                                        [🤖 IA activa]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │          📤 Arrastre y suelte archivos XML aquí                       │   │
│  │               o haga clic para seleccionar                           │   │
│  │                                                                      │   │
│  │              [📁 Seleccionar archivos XML]                           │   │
│  │                                                                      │   │
│  │  Formatos aceptados: .xml (SIFEN), .csv, .pdf                       │   │
│  │  Tamaño máximo: 10MB por archivo                                    │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ Últimas cargas ─────────────────────────────────────────────────────────┐│
│  │ Archivo              │ Empresa        │ Estado          │ Fecha         ││
│  ├──────────────────────┼────────────────┼─────────────────┼───────────────┤│
│  │ 001-001-12345.xml    │ Imp. del Este  │ ✅ Procesado    │ Hoy 10:30    ││
│  │ 001-002-67890.xml    │ Tech Asunción  │ ⏳ Analizando   │ Hoy 09:15    ││
│  │ factura-marzo.pdf    │ Imp. del Este  │ ❌ Error        │ Ayer 16:00   ││
│  └──────────────────────┴────────────────┴─────────────────┴───────────────┘│
│                                                                               │
│  También puedes conectar directamente al portal SIFEN:                       │
│  [🔍 Escanear portal SIFEN ahora]                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Paso a paso: Importar XML SIFEN

**Paso 1: Cargar el archivo**

- **Opción A**: Arrastre el archivo XML desde su explorador de archivos y suéltelo en la zona de carga
- **Opción B**: Haga clic en **"Seleccionar archivos XML"** y busque en su computadora
- **Opción C**: Haga clic en **"Escanear portal SIFEN"** para que el sistema busque automáticamente las facturas del mes

**Paso 2: Análisis automático**

El sistema procesa el XML y extrae:

| Dato extraído | Validación aplicada |
|---|---|
| RUC del emisor/receptor | Formato y dígito verificador |
| Tipo de documento | Factura, NC, ND, etc. |
| Número de documento | 001-001-XXXXX |
| Timbrado | 8 dígitos numéricos |
| CDC | 44 dígitos con validación de RUC interno |
| Fecha de emisión | No futura, no anterior a 2022 |
| Importes gravados (10%, 5%, exento) | Coherencia aritmética |
| IVA calculado | 10% y 5% sobre base gravada |
| Total | Gravado + IVA + Exento |

**Paso 3: Revisar la vista previa y sugerencia de IA**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📄 Vista Previa — Factura Electrónica                                        │
│                                                                               │
│  Proveedor: Distribuidora ABC S.A.                                            │
│  RUC: 80111111-3                     Timbrado: 12345678                       │
│  CDC: 001-001-0012345678901234567890123456789012345678                       │
│  Fecha: 03/05/2026                    Condición: Crédito 30 días             │
│                                                                               │
│  ┌──────────────┬──────────┬──────────┬─────────────┬──────────────┐        │
│  │ Producto     │ Cantidad │ Precio   │ Gravado     │ IVA          │        │
│  ├──────────────┼──────────┼──────────┼─────────────┼──────────────┤        │
│  │ Mercadería   │ 100      │ 55.000   │ 5.500.000   │ 550.000      │        │
│  │ Flete        │ 1        │ 50.000   │ 50.000      │ 5.000        │        │
│  └──────────────┴──────────┴──────────┴─────────────┴──────────────┘        │
│                                                                               │
│  Total: Gs. 6.105.000                                                         │
│                                                                               │
│  ┌─ 🤖 Sugerencia de contabilización (Score: 94%) ───────────────────────┐  │
│  │  Compra de mercaderías c/IVA — Débito automático                      │  │
│  │                                                                       │  │
│  │  Cuenta                       │ Débito      │ Crédito                 │  │
│  │  5.01.001 Compra de Merc.     │ 5.500.000   │                         │  │
│  │  1.03.001 IVA Crédito Fiscal  │ 605.000     │                         │  │
│  │  2.01.001 Proveedor           │             │ 6.105.000               │  │
│  │                                                                       │  │
│  │  InteliAsistente: El XML corresponde a una compra de mercaderías      │  │
│  │  con IVA 10%. Se sugiere débito a compras y crédito fiscal.          │  │
│  │                                              [✓ Aprobar] [✎ Editar]  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  [✕ Rechazar]        [💾 Guardar Borrador]        [✓ Aprobar y Postear]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso 4: Decidir acción**

| Opción | Resultado |
|---|---|
| **✓ Aprobar** | Acepta la sugerencia y crea el asiento contable en estado "posted" |
| **✎ Editar** | Modifica las cuentas, importes o descripción antes de postear |
| **✕ Rechazar** | Descarta la sugerencia. El documento queda como "pendiente" |
| **💾 Guardar Borrador** | Guarda la sugerencia como borrador para revisión posterior |
| **✓ Aprobar y Postear** | Acepta y postea directamente (atajo) |

**Paso 5: Confirmación**

Al aprobar, el sistema:
1. Crea el **asiento contable** vinculado al comprobante
2. Actualiza el **saldo de cuentas** involucradas
3. Registra en el **audit log** la acción realizada
4. Muestra el mensaje de confirmación con enlace al asiento creado

### 5.2 Historial SIFEN

**Ruta:** `/sifen/historial`

Listado completo de todos los documentos electrónicos importados, con filtros y exportación.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📄 Historial SIFEN                                            [📤 Exportar]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  🔍 [Buscar por CDC/factura...]  Empresa: [Todas ▼]  Estado: [Todos ▼]          │
│  Desde: [📅 01/01/2026]  Hasta: [📅 31/05/2026]                                 │
│                                                                                  │
│  ┌──────┬──────────┬────────────┬──────────┬────────┬──────────────┬──────────┐ │
│  │      │ Documento│ Proveedor  │ Fecha    │ Total  │ Estado       │ Asiento  │ │
│  ├──────┼──────────┼────────────┼──────────┼────────┼──────────────┼──────────┤ │
│  │ [☐]  │001-001-  │Dist. ABC   │03/05/26 │6.1M    │✅ Contab.    │ JE-028   │ │
│  │      │012345    │            │          │        │              │          │ │
│  │ [☐]  │001-004-  │Ferretería  │02/05/26 │2.3M    │🟡 Pendiente  │ —        │ │
│  │      │67890     │XYZ         │          │        │              │          │ │
│  │ [☐]  │001-001-  │Tigo        │28/04/26 │850.000 │✅ Contab.    │ JE-025   │ │
│  │      │54321     │            │          │        │              │          │ │
│  │ [☐]  │001-001-  │ANDE        │15/04/26 │1.2M    │❌ Error CDC  │ —        │ │
│  │      │98765     │            │          │        │              │          │ │
│  └──────┴──────────┴────────────┴──────────┴────────┴──────────────┴──────────┘ │
│                                                                                  │
│  Mostrando 1-4 de 47 registros                      [✓ Aprobar sel.] [✕ Rech.] │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Estados posibles:**

| Estado | Icono | Descripción |
|---|---|---|
| **Contabilizado** | ✅ | Vinculado a un asiento contable (posteado) |
| **Pendiente** | 🟡 | Importado pero pendiente de contabilización |
| **Analizando** | ⏳ | La IA está procesando el documento |
| **Error** | ❌ | Error de parsing, validación o estructura del XML |

**Acciones disponibles:**

- **Selección múltiple**: Marque varios documentos y use **"Aprobar selección"** o **"Rechazar selección"**
- **Exportar CSV**: Descarga el listado completo para análisis externo
- **Clic en documento**: Abre la vista previa con opciones de contabilización
- **Clic en asiento**: Navega directamente al asiento contable vinculado

### 5.3 Emitir documento SIFEN

**Ruta:** `/sifen/emitir`

Permite emitir comprobantes electrónicos directamente desde InteliCont hacia el SIFEN.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📤 Emitir Comprobante Electrónico                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Tipo: [▼ Factura Electrónica (Factura)  ]  Pto. Emisión: [▼ 001]            │
│                                                                               │
│  ┌─ DATOS DEL CLIENTE ───────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  Cliente:  [▼ Buscar cliente existente...         ]  [+ Nuevo]        │   │
│  │                                                                       │   │
│  │  O ingrese manualmente:                                               │   │
│  │  RUC: [________________]  Razón Social: [_________________________]   │   │
│  │  Dirección: [_____________________________________________________]   │   │
│  │  Email: [____________________________]  Tel: [____________________]   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ DETALLE DE LA FACTURA ───────────────────────────────────────────────┐   │
│  │ # │ Producto/Servicio    │ Cant. │ Precio   │ Gravado │ IVA  │ Total │   │
│  ├──┼──────────────────────┼───────┼──────────┼─────────┼──────┼───────┤   │
│  │1 │ [_________________]  │ [___] │ [______] │ [▼ 10%] │ Auto │ Auto  │   │
│  │2 │ [_________________]  │ [___] │ [______] │ [▼ 5% ] │ Auto │ Auto  │   │
│  │  │                                            [+ Agregar línea]    │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ TOTALES ──────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │  Gravado 10%: Gs. ___________    IVA 10%: Gs. ___________               │   │
│  │  Gravado 5%:  Gs. ___________    IVA 5%:  Gs. ___________               │   │
│  │  Exento:      Gs. ___________    Total:   Gs. ___________               │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [Cancelar]                       [💾 Guardar Borrador]  [📤 Emitir →]      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso a paso para emitir:**

1. Seleccione **Tipo de documento** (Factura, Nota de Crédito, Nota de Débito, etc.)
2. Seleccione **Punto de Emisión** (001, 002, etc. según su timbrado)
3. Seleccione **Cliente** o cree uno nuevo con RUC válido
4. Agregue **líneas** con producto/servicio, cantidad y precio
5. Seleccione **tasa de IVA** para cada línea (10%, 5%, exento)
6. Revise los **totales** calculados automáticamente
7. Haga clic en **"Emitir"** para enviar al SIFEN

---

## 6. Módulo Comprobantes

### 6.1 Bandeja de Comprobantes

**Ruta:** Gestión Principal → Bandeja Comprobantes → `/comprobantes`

Central de procesamiento de todos los documentos del sistema. Aquí convergen los XML del SIFEN, las facturas escaneadas y los documentos importados.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  📁 Bandeja de Comprobantes                                    [🔍 Filtros ▾]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  📊 Resumen: [12 Pendientes]  [3 Rechazados]  [45 Contabilizados]                │
│                                                                                   │
│  ┌──────┬──────────┬────────────┬──────────┬──────────┬────────────┬───────────┐ │
│  │      │ Documento│ Proveedor  │ Fecha    │ Importe  │ Estado     │ Acción    │ │
│  ├──────┼──────────┼────────────┼──────────┼──────────┼────────────┼───────────┤ │
│  │ [☐]  │001-001...│ ABC S.A.   │ 05/05    │Gs. 8.2M  │ 🔵 IA 96%  │ [✓][✎]  │ │
│  │ [☐]  │001-002...│ XYZ        │ 04/05    │Gs. 1.5M  │ 🟡 Pend.   │ [📝]     │ │
│  │ [☐]  │001-003...│ Ferremax   │ 03/05    │Gs. 3.1M  │ 🔵 IA 72%  │ [✓][✎]  │ │
│  │ [☐]  │001-004...│ Tigo       │ 02/05    │Gs. 850K  │ 🟡 Pend.   │ [📝]     │ │
│  │ [☐]  │001-005...│ ESSAP      │ 01/05    │Gs. 220K  │ 🟢 Contab. │ [👁]     │ │
│  │ [☐]  │001-006...│ ANDE       │ 30/04    │Gs. 1.2M  │ 🔴 Rechaz. │ [📝]     │ │
│  └──────┴──────────┴────────────┴──────────┴──────────┴────────────┴───────────┘ │
│                                                                                   │
│  [✓ Aprobar selección]  [✕ Rechazar selección]  [📤 Exportar]                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Estados de comprobantes:**

| Estado | Descripción |
|---|---|
| 🔵 **IA X%** | Procesado por IA con nivel de confianza. A mayor %, más fiable la sugerencia |
| 🟡 **Pendiente** | Pendiente de revisión manual |
| 🟢 **Contabilizado** | Vinculado a un asiento contable |
| 🔴 **Rechazado** | Rechazado (con motivo registrado) |

**Acciones:**

| Botón | Acción |
|---|---|
| ✓ | Aprobar sugerencia de IA y contabilizar |
| ✎ | Editar la contabilización propuesta antes de aprobar |
| 📝 | Contabilizar manualmente (sin IA) |
| 👁 | Ver detalle del asiento vinculado |

### 6.2 Registrar comprobante manual

**Ruta:** `/comprobantes/registrar`

Para cuando necesita ingresar un comprobante que no proviene del SIFEN (factura en papel, recibo, etc.).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📝 Registrar Comprobante Manual                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Tipo:        [▼ Factura de Compra     ]  Condición: [▼ Crédito 30 días   ]  │
│  Documento:   [▼ Factura Electrónica   ]                                     │
│                                                                               │
│  ┌─ DATOS DEL DOCUMENTO ─────────────────────────────────────────────────┐   │
│  │  Proveedor:     [▼ Buscar proveedor...        ]  [+ Nuevo]            │   │
│  │  Nro. Factura:  [001-001-___________________]                         │   │
│  │  Timbrado:      [________]  CDC: [________________________________]   │   │
│  │  Fecha Emisión: [📅 03/05/2026]  Fecha Contable: [📅 03/05/2026]     │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ LÍNEAS ──────────────────────────────────────────────────────────────┐   │
│  │ Cuenta        │ Concepto     │ Gravado   │ IVA │ Total    │ Centro    │   │
│  │ [▼...]        │ [__________] │ [_______] │ [▼] │ Calcul.  │ [▼...]    │   │
│  │ [▼...]        │ [__________] │ [_______] │ [▼] │ Calcul.  │ [▼...]    │   │
│  │                                        [+ Agregar línea]              │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ AJUSTES ─────────────────────────────────────────────────────────────┐   │
│  │  Retención IVA: [________]  Retención IRE: [________]  IRP: [_____]   │   │
│  │  Monto retenido se resta automáticamente del total                     │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [Cancelar]              [💾 Guardar Borrador]              [✓ Registrar]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso a paso:**

1. Seleccione **Tipo** (Factura de Compra, Factura de Venta, Nota de Crédito, etc.) y **Condición** (Contado, Crédito 15/30/60 días)
2. Seleccione **Proveedor/Cliente** del listado o cree uno nuevo
3. Ingrese datos del documento: número, timbrado (válido de 8 dígitos), CDC (44 dígitos)
4. Agregue **líneas**: seleccione cuenta contable, ingrese concepto, importe gravado y tasa de IVA
5. Si aplica, agregue **retenciones** (IVA, IRE, IRP)
6. Haga clic en **"Registrar"** para crear el documento y generar el asiento

### 6.3 Recibos

**Ruta:** `/comprobantes/recibos`

Gestión de recibos de ingresos y egresos.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📋 Recibos                                            [+ Nuevo Recibo] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────┬────────────┬────────────┬────────┬────────┬────────────┐  │
│  │ Número   │ Tercero    │ Fecha      │ Importe│ Estado │ Asiento    │  │
│  ├──────────┼────────────┼────────────┼────────┼────────┼────────────┤  │
│  │ REC-001  │ Cliente A  │ 03/05/2026 │Gs. 5M  │ ✅     │ JE-030     │  │
│  │ REC-002  │ Cliente B  │ 02/05/2026 │Gs. 3M  │ 🟡     │ —          │  │
│  └──────────┴────────────┴────────────┴────────┴────────┴────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Módulo Asientos Contables

### 7.1 Listado de asientos

**Ruta:** Contabilidad → Asientos Contables → `/asientos`

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  📝 Asientos Contables                           [Filtros]      [+ Nuevo]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  🔍 [Buscar...]  Empresa: [Imp. del Este ▼]  Período: [Mayo 2026 ▼]            │
│                                                                                  │
│  📊 Saldo: Débito Gs. 152.3M  =  Crédito Gs. 152.3M  ✓ Balanceado              │
│                                                                                  │
│  ┌────────┬─────────┬──────────┬──────────┬────────┬──────────┬──────────────┐ │
│  │ Número │ Fecha   │ Descrip. │ Débito   │ Crédito│ Estado   │ Origen       │ │
│  ├────────┼─────────┼──────────┼──────────┼────────┼──────────┼──────────────┤ │
│  │JE-028  │03/05    │Compra    │6.105.000 │6.105.00│✅ Posted │ SIFEN        │ │
│  │        │         │ABC       │          │0       │          │              │ │
│  │JE-027  │02/05    │Venta     │3.500.000 │3.500.00│✅ Posted │ Manual       │ │
│  │        │         │ComerPar  │          │0       │          │              │ │
│  │JE-026  │30/04    │Sueldos   │50.000.000│50.000.0│✅ Posted │ Sueldok      │ │
│  │        │         │Abril     │          │00      │          │              │ │
│  │JE-025  │28/04    │Pago Tigo │850.000   │850.000 │✅ Posted │ SIFEN        │ │
│  │JE-024  │25/04    │Ajuste    │2.000.000 │2.000.00│🔄 Revers.│ Ajuste       │ │
│  │        │         │Cambiario │          │0       │          │              │ │
│  │JE-023  │20/04    │Deprecia. │1.500.000 │1.500.00│✅ Posted │ Automático   │ │
│  │        │         │Abril     │          │0       │          │              │ │
│  └────────┴─────────┴──────────┴──────────┴────────┴──────────┴──────────────┘ │
│                                                                                  │
│  Mostrando 1-6 de 87                        ← 1 2 3 4 ... 15 →                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Columna | Descripción |
|---|---|
| **Número** | Identificador único del asiento. Formato: `JE-{SEQ}-{AÑO}` |
| **Fecha** | Fecha contable del asiento |
| **Descripción** | Breve descripción de la operación |
| **Débito / Crédito** | Totales del asiento (siempre iguales) |
| **Estado** | Posted, Draft, Reversed, Adjusted |
| **Origen** | Cómo se creó: SIFEN, Manual, Sueldok, Ajuste, Automático, etc. |

**Estados de asientos:**

| Estado | Icono | Descripción |
|---|---|---|
| **Posted** | ✅ | Posteado e inmutable. Forma parte del libro contable |
| **Draft** | 📝 | Borrador, aún no posteado. Puede editarse |
| **Reversed** | 🔄 | Contra-asiento de reversión. Anula un asiento anterior |
| **Adjusted** | 📎 | Ajuste de un asiento previo (versionOf) |

### 7.2 Crear un nuevo asiento

**Ruta:** `/asientos/nuevo`

El corazón del sistema contable. Aquí se registran todas las operaciones en partida doble.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ➕ Nuevo Asiento Contable                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Fecha: [📅 03/05/2026]    Período: [Mayo 2026 (Abierto) ✓]                 │
│  Descripción: [Compra de mercaderías a Distribuidora ABC                  ]  │
│  Referencia: [Factura 001-001-012345]   Origen: [▼ Manual                  ]  │
│                                                                               │
│  ┌─────┬──────────┬─────────────────────────┬────────────┬────────────┬────┐ │
│  │  #  │ Cuenta   │ Descripción             │ Débito     │ Crédito    │ CC │ │
│  ├─────┼──────────┼─────────────────────────┼────────────┼────────────┼────┤ │
│  │  1  │ [▼ 5.01.]│ Compra de Mercaderías   │ 5.500.000  │            │[▼] │ │
│  │  2  │ [▼ 1.03.]│ IVA Crédito Fiscal      │ 605.000    │            │[▼] │ │
│  │  3  │ [▼ 2.01.]│ Proveedor ABC           │            │ 6.105.000 │[▼] │ │
│  │    │          │                          │            │            │    │ │
│  │    │          │            [+ Agregar línea]           │            │    │ │
│  ├─────┴──────────┴─────────────────────────┼────────────┼────────────┼────┤ │
│  │  TOTALES                                 │ 6.105.000  │ 6.105.000 │    │ │
│  │  Diferencia                              │      0     ✓ Balanceado│    │ │
│  └──────────────────────────────────────────┴────────────┴────────────┴────┘ │
│                                                                               │
│  📎 Datos adicionales                                                         │
│  Moneda: [▼ PYG]  T.C.: [1.000000]  Documento: [001-001-012345           ]  │
│                                                                               │
│  [Cancelar]              [💾 Guardar Borrador]              [✓ Postear]       │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Paso a paso para crear un asiento

**Paso 1: Datos generales**

Complete la cabecera:

| Campo | Descripción |
|---|---|
| **Fecha** | Fecha contable. Debe pertenecer a un período abierto |
| **Período** | Se asigna automáticamente según la fecha. Muestra si está abierto |
| **Descripción** | Texto explicativo del asiento |
| **Referencia** | Documento de respaldo (factura, recibo, etc.) |
| **Origen** | Cómo se origina: Manual, SIFEN, Sueldok, Ajuste, etc. |

**Paso 2: Agregar líneas (partidas)**

Para cada línea del asiento:

1. Haga clic en **"Agregar línea"**
2. Seleccione la **Cuenta contable** del plan de cuentas (autocompletado con búsqueda)
3. Ingrese una **descripción** para la línea
4. Ingrese el **importe en Débito** o **Crédito** (nunca ambos en la misma línea)
5. Seleccione **Centro de Costo** si corresponde

**Reglas de validación:**

- Cada línea debe tener débito **O** crédito, no ambos, no ninguno
- El total de débitos debe ser exactamente igual al total de créditos
- Si usa multi-moneda, debe balancear por cada moneda
- No se permiten importes negativos
- Máximo 4 decimales
- La cuenta seleccionada debe permitir posteo (flag `allowsPosting`)

**Paso 3: Verificar el balance**

El sistema muestra en tiempo real:
- **Totales** de débito y crédito
- **Diferencia** (debe ser 0)
- Indicador **✓ Balanceado** o **✕ No balancea**

**Paso 4: Guardar o Postear**

| Opción | Resultado |
|---|---|
| **💾 Guardar Borrador** | Crea el asiento en estado `draft`. Puede editarse después |
| **✓ Postear** | Valida y fija el asiento en el libro contable. Inmutable a partir de este momento |

> **⚠️ Importante**: Una vez posteado, un asiento NO puede editarse ni eliminarse. Para corregir errores, use **Reversión** o **Ajuste**.

### 7.3 Detalle del asiento

**Ruta:** `/asientos/[id]`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📝 Asiento JE-028                    Estado: ✅ Posteado                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Fecha: 03/05/2026                  Período: Mayo 2026                       │
│  Descripción: Compra de mercaderías a Distribuidora ABC S.A.                 │
│  Referencia: Factura 001-001-012345  Origen: SIFEN                           │
│  Creado por: María L.                Posteado: 03/05/2026 10:30              │
│                                                                               │
│  ┌──────────┬─────────────────────────────────┬────────────┬────────────┐   │
│  │ Cuenta   │ Descripción                     │ Débito     │ Crédito    │   │
│  ├──────────┼─────────────────────────────────┼────────────┼────────────┤   │
│  │5.01.001  │ Compra de Mercaderías           │ 5.500.000  │            │   │
│  │1.03.001  │ IVA Crédito Fiscal 10%          │ 605.000    │            │   │
│  │2.01.001  │ Proveedor ABC S.A.              │            │ 6.105.000  │   │
│  ├──────────┴─────────────────────────────────┼────────────┼────────────┤   │
│  │  TOTALES                                   │ 6.105.000  │ 6.105.000  │   │
│  └────────────────────────────────────────────┴────────────┴────────────┘   │
│                                                                               │
│  📎 Documentos vinculados: [Factura 001-001-012345]                          │
│                                                                               │
│  [✎ Editar Borrador]  [🔄 Reversión]  [📎 Ajuste]  [📤 Exportar]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Reversión de asiento (Contra-asiento)

Para anular un asiento posteado (ej: factura incorrecta):

1. Abra el asiento que desea revertir
2. Haga clic en **"🔄 Reversión"**
3. Confirme el motivo de la reversión:

```
┌────────────────────────────────────────────────────────────────────┐
│  🔄 Reversión de Asiento JE-028                                    │
│                                                                     │
│  Se creará un contra-asiento que invierte todos los débitos         │
│  y créditos del asiento original.                                   │
│                                                                     │
│  Motivo: [Factura incorrecta, se emite NC                     ]    │
│  Fecha de reversión: [📅 05/05/2026]                                │
│                                                                     │
│  [Cancelar]                          [✓ Confirmar Reversión]       │
└────────────────────────────────────────────────────────────────────┘
```

4. El sistema crea un nuevo asiento con débitos y créditos intercambiados
5. Ambos asientos quedan vinculados (original y reversión)

### 7.5 Ajuste de asiento

Para corregir parcialmente un asiento sin revertirlo completamente:

1. Abra el asiento a ajustar
2. Haga clic en **"📎 Ajuste"**
3. Cree un asiento complementario que solo corrija las líneas necesarias
4. El sistema vincula el ajuste al original mediante `versionOf`

---

## 8. Módulo Plan de Cuentas

### 8.1 Vista del árbol de cuentas

**Ruta:** Contabilidad → Plan de Cuentas → `/cuentas`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  #📊 Plan de Cuentas          Imp. del Este    [+ Nueva Cuenta] [⚙️]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔍 [Buscar cuenta por código o nombre...]                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 📁 1. Activo                          Naturaleza: Deudora            │  │
│  │  ├─ 📁 1.01. Activo Corriente                                       │  │
│  │  │  ├─ 📄 1.01.001 Caja y Bancos               Gs. 45.200.000       │  │
│  │  │  ├─ 📄 1.01.002 Clientes                    Gs. 23.100.000       │  │
│  │  │  ├─ 📄 1.01.003 IVA Crédito Fiscal          Gs. 3.250.000        │  │
│  │  │  └─ 📄 1.01.004 Deudores Varios             Gs. 1.500.000        │  │
│  │  ├─ 📁 1.02. Activo No Corriente                                     │  │
│  │  │  ├─ 📄 1.02.001 Bienes de Uso               Gs. 120.000.000      │  │
│  │  │  └─ 📄 1.02.002 Deprec. Acumulada           Gs. -15.000.000      │  │
│  │                                                                      │  │
│  │ 📁 2. Pasivo                           Naturaleza: Acreedora         │  │
│  │  ├─ 📁 2.01. Pasivo Corriente                                        │  │
│  │  │  ├─ 📄 2.01.001 Proveedores                  Gs. 18.500.000       │  │
│  │  │  ├─ 📄 2.01.002 IVA Débito Fiscal            Gs. 4.100.000        │  │
│  │  │  └─ 📄 2.01.003 Retenciones a Pagar          Gs. 850.000          │  │
│  │                                                                      │  │
│  │ 📁 3. Patrimonio Neto                      Naturaleza: Acreedora     │  │
│  │  ├─ 📄 3.01.001 Capital                     Gs. 50.000.000           │  │
│  │  └─ 📄 3.01.002 Resultados Acumulados       Gs. 12.000.000           │  │
│  │                                                                      │  │
│  │ 📁 4. Ingresos                           Naturaleza: Acreedora       │  │
│  │  ├─ 📄 4.01.001 Ventas                    Gs. 31.050.000             │  │
│  │                                                                      │  │
│  │ 📁 5. Egresos                            Naturaleza: Deudora         │  │
│  │  ├─ 📄 5.01.001 Compras                   Gs. 18.200.000             │  │
│  │  ├─ 📄 5.01.002 Sueldos                   Gs. 50.000.000             │  │
│  │  └─ 📄 5.01.003 Servicios                 Gs. 3.400.000              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Leyenda: 📁 Grupo/Subgrupo  📄 Cuenta de imputación                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Crear / Editar cuenta

Haga clic en **"+ Nueva Cuenta"** o en el icono ✎ de una cuenta existente:

```
┌────────────────────────────────────────────────────────────────────┐
│  ➕ Nueva Cuenta Contable                                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Código:     [5.01.004_________]                                   │
│  Nombre:     [Fletes y Acarreos______________________________]     │
│  Naturaleza: [▼ Deudora                                           ] │
│                                                                     │
│  Cuenta padre: [▼ 5.01. Egresos Operativos                       ]  │
│                                                                     │
│  ⚙️ Configuración                                                  │
│  [✓] Permite posteo (cuenta de imputación)                        │
│  [ ] Requiere centro de costo                                     │
│  [✓] Afecta al libro IVA                                          │
│                                                                     │
│  🏷️ Mapeo fiscal                                                   │
│  Tasas de IVA aplicables: [✓ IVA 10%] [✓ IVA 5%] [☐ Exento]      │
│  Rubro IRE:        [▼ No aplica                                   ] │
│  Rubro IRP:        [▼ No aplica                                   ] │
│  Línea EEF:        [▼ No aplica                                   ] │
│                                                                     │
│  [✓] Admite ajuste por diferencia de cambio                         │
│  [ ] No deducible para IRE                                         │
│                                                                     │
│  [Cancelar]                              [✓ Guardar Cuenta]        │
└────────────────────────────────────────────────────────────────────┘
```

**Campos clave:**

| Campo | Descripción |
|---|---|
| **Código** | Jerárquico (1.01.001). Define el nivel en el árbol |
| **Naturaleza** | Deudora (Activo/Gasto) o Acreedora (Pasivo/Patrimonio/Ingreso) |
| **Permite posteo** | Solo las cuentas de imputación (hojas) pueden recibir asientos |
| **Mapeo fiscal** | Define qué impuestos aplican a esta cuenta |
| **Admite ajuste** | Para cuentas en moneda extranjera que requieren revaluación |

---

## 9. Módulo Libros Contables

### 9.1 Libro Diario

**Ruta:** Contabilidad → Libros Diarios/Mayores → `/libros`

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  📖 Libro Diario                      Imp. del Este     [Mayo 2026 ▼]           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Fecha: [01/05/2026] a [31/05/2026]                                              │
│                                                                                   │
│  ┌────────┬─────────┬──────────┬──────────────┬─────────────┬──────────────┐    │
│  │ Fecha  │ Nro.    │ Cuenta   │ Descripción  │ Débito      │ Crédito      │    │
│  ├────────┼─────────┼──────────┼──────────────┼─────────────┼──────────────┤    │
│  │03/05   │ JE-028  │5.01.001  │ Compra ABC   │ 5.500.000   │              │    │
│  │03/05   │ JE-028  │1.03.001  │ IVA CF       │ 605.000     │              │    │
│  │03/05   │ JE-028  │2.01.001  │ Proveedor    │             │ 6.105.000    │    │
│  ├────────┼─────────┼──────────┼──────────────┼─────────────┼──────────────┤    │
│  │02/05   │ JE-027  │4.01.001  │ Venta        │             │ 3.500.000    │    │
│  │02/05   │ JE-027  │1.01.003  │ Clientes     │ 3.850.000   │              │    │
│  │02/05   │ JE-027  │2.01.002  │ IVA DF       │             │ 350.000      │    │
│  └────────┴─────────┴──────────┴──────────────┴─────────────┴──────────────┘    │
│                                                                                   │
│  Totales período: Débito Gs. 152.300.000  |  Crédito Gs. 152.300.000            │
│                                                                                   │
│  [📤 Exportar a PDF]  [📤 Exportar a Excel]                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Libro Mayor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📖 Libro Mayor                    Cuenta: 2.01.001 — Proveedores           │
│                                   Imp. del Este      Mayo 2026             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Saldo inicial al 01/05/2026: Gs. 12.400.000 (Acreedor)                     │
│                                                                              │
│  ┌────────┬─────────┬──────────────┬──────────┬──────────┬──────────────┐  │
│  │ Fecha  │ Nro.    │ Descripción  │ Débito   │ Crédito  │ Saldo        │  │
│  ├────────┼─────────┼──────────────┼──────────┼──────────┼──────────────┤  │
│  │03/05   │ JE-028  │ Compra ABC   │          │6.105.000 │ 18.505.000   │  │
│  │05/05   │ JE-029  │ Pago Fact.   │5.000.000 │          │ 13.505.000   │  │
│  │10/05   │ JE-030  │ Compra XYZ   │          │2.300.000 │ 15.805.000   │  │
│  ├────────┴─────────┴──────────────┼──────────┼──────────┼──────────────┤  │
│  │  Totales del período            │5.000.000 │8.405.000 │              │  │
│  └─────────────────────────────────┴──────────┴──────────┴──────────────┘  │
│                                                                              │
│  Saldo final al 31/05/2026: Gs. 15.805.000 (Acreedor)                       │
│                                                                              │
│  [📤 Exportar]                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Módulo Libro IVA

### 10.1 Libro IVA Compras y Ventas

**Ruta:** Gestión Fiscal → Libro IVA / RG90 → `/libro-iva`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📕 Libro IVA                    Imp. del Este     [Mayo 2026 ▼]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Compras]  [Ventas]  [Libro Electrónico (Hechauka)]                         │
│                                                                              │
│  ┌─ COMPRAS ────────────────────────────────────────────────────────────┐  │
│  │ Fecha   │ Proveedor    │ Factura    │ Grav.10% │ IVA10 │ Grav.5% │Ex.│  │
│  ├─────────┼──────────────┼────────────┼──────────┼───────┼─────────┼───┤  │
│  │03/05/26 │ ABC S.A.     │001-001-1234│5.500.000 │550.000│         │   │  │
│  │05/05/26 │ Ferremax     │001-003-5678│2.000.000 │200.000│         │   │  │
│  │10/05/26 │ Tigo         │001-004-9012│          │       │         │850K│  │
│  │15/05/26 │ XYZ S.A.     │001-002-3456│          │       │300.000 │15K │  │
│  ├─────────┴──────────────┴────────────┼──────────┼───────┼─────────┼───┤  │
│  │  Totales Compras                    │7.500.000 │750.000│300.000  │865K│  │
│  └─────────────────────────────────────┴──────────┴───────┴─────────┴───┘  │
│                                                                              │
│  ┌─ VENTAS ─────────────────────────────────────────────────────────────┐  │
│  │ Fecha  │ Cliente      │ Factura    │ Grav.10% │ IVA10 │ Grav.5% │Ex │  │
│  ├────────┼──────────────┼────────────┼──────────┼───────┼─────────┼───┤  │
│  │02/05/26│ ComerPar     │001-001-1001│3.500.000 │350.000│         │   │  │
│  │08/05/26│ Cliente B    │001-001-1002│2.000.000 │200.000│         │   │  │
│  └────────┴──────────────┴────────────┴──────────┴───────┴─────────┴───┘  │
│                                                                              │
│  Resumen IVA: Débito Gs. 550.000 | Crédito Gs. 750.000 | A favor: 200.000 │
│                                                                              │
│  [📤 Exportar a Excel]  [📤 Exportar CSV Hechauka]  [🔄 Calcular F.104]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

| Pestaña | Descripción |
|---|---|
| **Compras** | IVA crédito fiscal (compras/gastos). Base gravada y desglose por tasa |
| **Ventas** | IVA débito fiscal (ventas/ingresos) |
| **Libro Electrónico** | Hechauka: formato oficial SET para envío mensual |

**Resumen automático:**

- **Débito IVA** = Suma de IVA de todas las ventas
- **Crédito IVA** = Suma de IVA de todas las compras
- **Saldo** = Crédito − Débito (positivo = a favor; negativo = a pagar)
- Botón **"Calcular F.104"** → precarga el Formulario 104 con estos datos

---

## 11. Módulo Activos Fijos (Bienes de Uso)

### 11.1 Listado de activos

**Ruta:** Contabilidad → Bienes de Uso → `/activos`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📦 Bienes de Uso (Activos Fijos)                        [+ Nuevo Activo]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┬────────────────┬──────────┬───────────┬─────────┬───────────┐ │
│  │ Código   │ Descripción    │ F.Adq.   │ Costo     │ Dep.Acum│ V.Net o   │ │
│  ├──────────┼────────────────┼──────────┼───────────┼─────────┼───────────┤ │
│  │AF-001    │Camión Ford Cgo │15/03/2024│85.000.000 │28.300.00│56.700.000 │ │
│  │AF-002    │Computadoras    │10/01/2025│15.000.000 │ 7.500.00│ 7.500.000 │ │
│  │AF-003    │Muebles Oficina │01/06/2023│12.000.000 │ 6.000.00│ 6.000.000 │ │
│  │AF-004    │Equipo Indust.  │20/08/2024│45.000.000 │ 7.800.00│37.200.000 │ │
│  └──────────┴────────────────┴──────────┴───────────┴─────────┴───────────┘ │
│                                                                               │
│  Total Valor Neto: Gs. 107.400.000                                           │
│                                                                               │
│  [⚙️ Calcular Depreciación del Período]                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Crear activo fijo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ➕ Nuevo Bien de Uso                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Código:        [AF-005__________________]                                   │
│  Descripción:   [Equipo de Aire Acondicionado Industrial                 ]  │
│                                                                               │
│  Fecha de Adquisición:  [📅 15/01/2026]                                     │
│  Costo de Adquisición:   [Gs. 25.000.000__________________________________] │
│                                                                               │
│  Vida Útil:       [5] años        Método: [▼ Lineal                       ] │
│  Valor Residual:  [Gs. 2.500.000_________________________________________]  │
│                                                                               │
│  Cuenta Contable (Activo): [▼ 1.02.001 Bienes de Uso                      ]  │
│  Cuenta Depreciación:      [▼ 5.02.001 Depreciaciones                     ]  │
│  Cuenta Deprec. Acumulada: [▼ 1.02.002 Deprec. Acumulada                 ]  │
│                                                                               │
│  Estado: [● Activo  ○ Vendido  ○ Dado de Baja  ○ En Desuso]                 │
│                                                                               │
│  [Cancelar]                              [✓ Guardar Activo]                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Calcular depreciación

1. Seleccione los activos a depreciar
2. Haga clic en **"Calcular Depreciación del Período"**
3. El sistema calcula automáticamente el gasto según el método (lineal)
4. Genere el asiento de depreciación:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Depreciación — Mayo 2026                                             │
│                                                                           │
│  Activos a depreciar: 4                                                  │
│  Total depreciación del período: Gs. 1.500.000                           │
│                                                                           │
│  Asiento a generar:                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  5.02.001 Depreciaciones            1.500.000                    │   │
│  │  1.02.002 Deprec. Acumulada                    1.500.000        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  [Cancelar]                       [✓ Generar Asiento y Postear]        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Módulo Terceros (Clientes/Proveedores)

### 12.1 Listado

**Ruta:** Contabilidad → Clientes/Proveedores → `/terceros`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  👥 Terceros                                    [+ Nuevo Tercero]       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  🔍 [Buscar...]  Tipo: [Todos ▼]  Estado: [Todos ▼]                     │
│                                                                           │
│  ┌──────────┬──────────────┬──────────────┬────────┬────────┬─────────┐ │
│  │ RUC      │ Nombre       │ Tipo         │ Tel.   │ Email  │ Saldo   │ │
│  ├──────────┼──────────────┼──────────────┼────────┼────────┼─────────┤ │
│  │80011111-3│Dist. ABC S.A.│ Proveedor    │021 1111│abc@... │Gs. 6.1M │ │
│  │80111111-1│ComerPar      │ Cliente      │021 2222│com@... │Gs. 3.5M │ │
│  │80222222-5│Tigo          │ Ambos        │021 3333│tigo@.. │Gs. 850K │ │
│  └──────────┴──────────────┴──────────────┴────────┴────────┴─────────┘ │
│                                                                           │
│  Mostrando 1-3 de 25                                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Crear / Editar tercero

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ➕ Nuevo Tercero                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Tipo: [▼ Proveedor                    ]  Estado: [● Activo  ○ Inactivo] │
│                                                                           │
│  RUC:         [80011111-3________________________________________]       │
│  Razón Social:[Distribuidora ABC S.A.________________________________]   │
│  Nombre Fant.:[Distribuidora ABC____________________________________]   │
│  País:        [▼ Paraguay                                              ] │
│  Ciudad:      [Asunción_______________________________________________]   │
│  Dirección:   [Av. Santa Teresa 4567_________________________________]   │
│  Teléfono:    [021 111 111___________________________________________]   │
│  Email:       [ventas@distribuidoraabc.com___________________________]   │
│                                                                           │
│  💰 Condiciones Comerciales                                               │
│  Condición pago:  [▼ Crédito 30 días                                    ]│
│  Límite de crédito: [Gs. 50.000.000___________________________________]  │
│  Moneda:           [▼ PYG                                               ] │
│                                                                           │
│  📋 Perfil de Retención                                                   │
│  Perfil:  [▼ Servicios en general                                      ]  │
│  IVA:     [● Aplica retención 50%    ○ No aplica                      ]  │
│  IRE:     [● Aplica retención 30%    ○ No aplica                      ]  │
│  IRP:     [● Aplica retención según perfil   ○ No aplica             ]  │
│                                                                           │
│  [Cancelar]                              [✓ Guardar Tercero]             │
└──────────────────────────────────────────────────────────────────────────┘
```

El sistema **valida el RUC** en tiempo real:
- Formato correcto: `XXXXXXXX-X` (persona jurídica), `XXXXXXX-X` (persona natural)
- Dígito verificador mediante algoritmo Módulo 11 base 11
- Si el RUC no es válido, muestra error y no permite guardar

---

## 13. Módulo Bancos y Conciliación

### 13.1 Cuentas bancarias

**Ruta:** Tesorería y Finanzas → Conciliación Bancaria → `/banco`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  💳 Bancos y Conciliación                        [+ Nueva Cuenta Bco.]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─ Cuentas Bancarias ──────────────────────────────────────────────┐   │
│  │ Banco         │ Nro. Cuenta       │ Moneda │ GL Account  │ Saldo │   │
│  ├───────────────┼───────────────────┼────────┼─────────────┼───────┤   │
│  │ Banco Itaú    │ 123456-7          │ PYG    │ 1.01.001    │45.2M  │   │
│  │ Banco Continental│ 765432-1       │ USD    │ 1.01.001    │5.000  │   │
│  └───────────────┴───────────────────┴────────┴─────────────┴───────┘   │
│                                                                           │
│  [📤 Subir Extracto CSV]                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Conciliación Bancaria

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  💳 Conciliación Bancaria      Bco. Itaú — Cta. 123456-7                    │
│                                 Mayo 2026                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Saldo según Banco: Gs. 45.200.000                                           │
│  Saldo según Libros: Gs. 44.850.000                                          │
│  Diferencia:         Gs. 350.000                                              │
│                                                                               │
│  ┌─ MOVIMIENTOS BANCARIOS ───────────┐  ┌─ MOVIMIENTOS CONTABLES ──────────┐│
│  │ Fecha  │ Desc.     │ Importe│     │  │ Fecha  │ Asiento │ Importe│     ││
│  ├────────┼───────────┼────────┤     │  ├────────┼─────────┼────────┤     ││
│  │02/05   │Depósito   │+5.0M   │ ← → │  │02/05   │JE-027   │+5.0M   │     ││
│  │05/05   │Cheque 102 │-2.0M   │ ← → │  │05/05   │JE-029   │-2.0M   │     ││
│  │10/05   │Transf.     │+350K  │ ← → │  │10/05   │JE-030   │+350K   │     ││
│  │15/05   │Debito BCRA │-150K  │  ?  │  │—        │—        │—       │     ││
│  └────────┴───────────┴────────┘     │  └────────┴─────────┴────────┘     ││
│                                        └────────────────────────────────────┘│
│                                                                               │
│  Partidas conciliadas: 3 de 4   (75%)                                        │
│                                                                               │
│  🤖 IA: 1 movimiento sin contabilizar. ¿Desea crear asiento?                 │
│         Débito: Gasto Bancario — Crédito: Banco                             │
│                                                                               │
│  [✓ Aprobar conciliación]  [Rechazar]                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso a paso: Conciliar**

1. Suba el extracto bancario en CSV o ingrese los movimientos manualmente
2. El sistema carga los movimientos del banco y los compara con los asientos contables
3. Use **match automático** (IA) para emparejar movimientos similares por fecha, importe y concepto
4. Revise las sugerencias y confirme los pares
5. Para movimientos sin contrapartida, cree el asiento faltante
6. Una vez que la diferencia sea 0, confirme la conciliación

**Indicadores:**

| Símbolo | Significado |
|---|---|
| ← → | Conciliado (match perfecto) |
| ✓ | Manualmente conciliado |
| ? | Sin contrapartida |
| ⚠️ | Diferencia de importe |

---

## 14. Módulo Caja Chica

### 14.1 Fondos de caja chica

**Ruta:** Tesorería y Finanzas → Caja Chica → `/caja-chica`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  👛 Caja Chica (Fondo Fijo)                       [+ Nuevo Fondo]       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─ Fondos ──────────────────────────────────────────────────────────┐  │
│  │ Nombre      │ Custodio   │ Máximo    │ Disponible │ Estado       │  │
│  ├─────────────┼────────────┼───────────┼────────────┼──────────────┤  │
│  │ Caja Chica  │ Ana Pérez  │Gs. 3.000M │Gs. 1.200M  │ ● Activo     │  │
│  │ Oficina Sur │ Carlos Ruiz│Gs. 2.000M │Gs. 2.000M  │ ● Activo     │  │
│  └─────────────┴────────────┴───────────┴────────────┴──────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Registrar gasto de caja chica

```
┌──────────────────────────────────────────────────────────────────────────┐
│  👛 Registrar Gasto — Caja Chica (Fondo: Gs. 3.000.000)                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Fecha:         [📅 03/05/2026]                                          │
│  Concepto:      [Compra de insumos de oficina                       ]    │
│  Monto:         [Gs. 350.000________________________________________]    │
│  Beneficiario:  [Ana Pérez (custodio)________________________________]   │
│                                                                           │
│  📋 Detalle Fiscal                                                        │
│  Tipo de gasto: [▼ Insumos y materiales                                 ] │
│  IVA:           [● IVA 10%  ○ IVA 5%  ○ Exento  ○ IVA incluido        ] │
│  Con factura:   [✓ Sí, adjuntar comprobante                            ] │
│  Proveedor:     [Librería El Escritorio_______________________________]   │
│                                                                           │
│  📎 Comprobante: [📷 Tomar foto]  [📁 Subir archivo]                     │
│                                                                           │
│  [Cancelar]                    [✓ Registrar Gasto]                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 14.3 Reposición (Rendición)

Cuando el fondo se agota o llega a un mínimo, solicite la reposición:

1. Haga clic en **"Solicitar Reposición"** en el fondo activo
2. El sistema lista todos los gastos pendientes de reposición
3. Genere el asiento contable de reposición:
   - Débito: Cuentas de gasto (segregado por tipo)
   - Crédito: Banco (o Caja)

---

## 15. Módulo Tesorería

### 15.1 Órdenes de Pago (OP)

**Ruta:** Tesorería y Finanzas → Órdenes de Pago → `/tesoreria`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🪙 Órdenes de Pago y Cheques                    [+ Nueva OP]          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [Órdenes de Pago]  [Cheques]  [Transferencias]                           │
│                                                                           │
│  ┌──────┬────────────┬──────────┬──────────┬──────────┬──────────┐     │
│  │ Nro. │ Proveedor  │ Fecha    │ Importe  │ Vto.     │ Estado   │     │
│  ├──────┼────────────┼──────────┼──────────┼──────────┼──────────┤     │
│  │OP-001│Dist. ABC   │03/05/26  │6.105.000 │03/06/26  │ Pend.    │     │
│  │OP-002│ANDÉ        │15/04/26  │1.200.000 │15/05/26  │ Pagada   │     │
│  │OP-003│Tigo        │28/04/26  │ 850.000  │28/05/26  │ Emi.Cheq.│     │
│  └──────┴────────────┴──────────┴──────────┴──────────┴──────────┘     │
│                                                                           │
│  [✓ Aprobar] [💳 Pagar] [📤 Exportar]                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Crear orden de pago

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ➕ Nueva Orden de Pago                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Proveedor: [▼ Distribuidora ABC S.A.               ]  [+ Nuevo]        │
│  Factura:   [001-001-012345 — Gs. 6.105.000 — Vto. 03/06/2026]         │
│                                                                           │
│  Monto a pagar: [Gs. 6.105.000____________________________________]     │
│  Fecha de pago: [📅 03/06/2026]                                          │
│                                                                           │
│  Método de pago: [▼ Cheque Diferido                                    ] │
│                                                                           │
│  Si es cheque:                                                           │
│  Banco:     [▼ Banco Itaú                                             ]  │
│  Nro. Cheque:[________]  Fecha Cobro: [📅 03/06/2026]                   │
│                                                                           │
│  Concepto: [Pago Factura 001-001-012345 - Orden de Compra #4509     ]    │
│                                                                           │
│  [Cancelar]                              [✓ Crear Orden de Pago]         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Estados de una OP:**

| Estado | Descripción |
|---|---|
| **Pendiente** | Creada, esperando aprobación |
| **Aprobada** | Autorizada para pago |
| **Emitido Cheque** | Se emitió el cheque correspondiente |
| **Pagada** | Cobrada por el beneficiario |
| **Cancelada** | Anulada antes del pago |

---

## 16. Módulo Calendario Fiscal

### 16.1 Vista del calendario

**Ruta:** Gestión Fiscal → Calendario Fiscal → `/calendario`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📅 Calendario Fiscal                    2026          [Mayo ▼]             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────┐ │
│  │ Lun      │ Mar      │ Mié      │ Jue      │ Vie      │ Sáb      │ Dom  │ │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────┤ │
│  │          │          │          │          │ 1        │ 2        │ 3    │ │
│  │          │          │          │          │          │          │      │ │
│  │ 4        │ 5        │ 6        │ 7        │ 8        │ 9        │10    │ │
│  │          │          │          │🔴IVA F104│          │          │      │ │
│  │11        │12        │13        │14        │15        │16        │17    │ │
│  │🔴IVA F104│          │          │          │🔴IRE     │          │      │ │
│  │          │          │          │          │F1301     │          │      │ │
│  │18        │19        │20        │21        │22        │23        │24    │ │
│  │          │          │          │          │          │          │      │ │
│  │25        │26        │27        │28        │29        │30        │31    │ │
│  │🔴Hechauka│          │          │          │          │          │      │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────┘ │
│                                                                               │
│  📋 Obligaciones del mes:                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ 🔴 12 mayo — Vence IVA (Formulario 104) — Último dígito RUC: 1     │    │
│  │ 🔴 15 mayo — Vence IRE (Formulario 501/1301) — Bimestre Mar-Abr   │    │
│  │ 🔴 25 mayo — Vence Hechauka (Libro Electrónico) — Abril            │    │
│  │ 🟡 31 mayo — Cierre de mes contable                                │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

Las fechas de vencimiento se calculan automáticamente según:
- **IVA**: Día 10 del mes siguiente + último dígito del RUC (ajuste por fin de semana)
- **Hechauka**: Día 25 del mes siguiente
- **IRE**: Bimestral, según calendario de la SET
- **IRP**: Anual, según calendario de la SET

---

## 17. Módulo RG90

### 17.1 Conciliación de Comprobantes (RG 90/2021)

**Ruta:** Gestión Fiscal → Libro IVA / RG90 → `/rg90`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 RG90 — Conciliación de Comprobantes Electrónicos                         │
│                          Imp. del Este              [Mayo 2026 ▼]           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📊 Resumen: Confirmados: 40 | Pendientes: 3 | Discrepancias: 2             │
│                                                                               │
│  ┌──────────┬──────────┬──────────┬────────────┬──────────┬────────────┐   │
│  │ Documento│ SIFEN    │ Libros   │ Diferencia │ Estado   │ Acción     │   │
│  ├──────────┼──────────┼──────────┼────────────┼──────────┼────────────┤   │
│  │001-001-12│5.500.000 │5.500.000 │     0      │✅ Confirm │ —          │   │
│  │001-004-67│   —      │2.300.000 │ 2.300.000  │🟡 Pend.  │ [📝]       │   │
│  │001-001-90│1.200.000 │1.180.000 │  20.000    │🔴 Discr. │ [🔍]       │   │
│  └──────────┴──────────┴──────────┴────────────┴──────────┴────────────┘   │
│                                                                               │
│  [📤 Exportar CSV Compras (RFC 955)]  [📤 Exportar CSV Ventas (RFC 956)]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**¿Qué es RG90?** Es la Resolución General 90/2021 de la SET/DNIT que establece la conciliación entre los comprobantes electrónicos (SIFEN) y los registros contables del contribuyente. Los resultados se exportan en formato CSV para subir al sistema Marangatu.

**Estados RG90:**

| Estado | Significado |
|---|---|
| ✅ **Confirmado** | Coincide SIFEN vs Libros (diferencia ≤ tolerancia) |
| 🟡 **Pendiente** | Factura en libros pero no en SIFEN (o viceversa) |
| 🔴 **Discrepancia** | Diferencia > tolerancia. Requiere ajuste |

---

## 18. Módulo Impuestos (IVA/IRE/IRP)

### 18.1 Calculadora de impuestos

**Ruta:** Gestión Fiscal → Liquidación Impuestos → `/impuestos`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🧮 Liquidación de Impuestos               Imp. del Este   [Mayo 2026 ▼]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [IVA]  [IRE]  [IRP]  [INR]                                                   │
│                                                                               │
│  ┌─ IVA ─────────────────────────────────────────────────────────────────┐  │
│  │  Cálculo Rápido de IVA                                                │  │
│  │                                                                       │  │
│  │  Débito Fiscal (Ventas)              Crédito Fiscal (Compras)         │  │
│  │  ┌────────────────────────────┐     ┌────────────────────────────┐   │  │
│  │  │ Ventas Gravadas 10%: 5.5M  │     │ Compras Gravadas 10%: 7.5M │   │  │
│  │  │ IVA Débito 10%:    550K    │     │ IVA Crédito 10%:    750K   │   │  │
│  │  │ Ventas Gravadas 5%:  —     │     │ Compras Gravadas 5%: 300K   │   │  │
│  │  │ IVA Débito 5%:      —      │     │ IVA Crédito 5%:     15K    │   │  │
│  │  │ Ventas Exentas:      —     │     │ Compras Exentas:    865K    │   │  │
│  │  └────────────────────────────┘     └────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  Resultado:                                                           │  │
│  │  Total Débito: Gs. 550.000  |  Total Crédito: Gs. 765.000           │  │
│  │  ─────────────────────────────────────────────────────────────       │  │
│  │  **IVA a Favor: Gs. 215.000** (Crédito > Débito)                     │  │
│  │  Retenciones Sufridas: Gs. 85.000  |  Saldo Neto: Gs. 300.000       │  │
│  │                                                                       │  │
│  │  [🔄 Calcular Formulario 104]  [📤 Exportar]                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  🤖 InteliAsistente:                                                         │
│  "El IVA a favor de mayo asciende a Gs. 215.000. Recuerde que puede         │
│   compensarlo con el déficit de meses anteriores o solicitar devolución.     │
│   El vencimiento para presentación es el 12 de junio."                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Pestaña IRE (Renta Empresarial):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [IVA]  [IRE]  [IRP]  [INR]                                                  │
│                                                                               │
│  ┌─ IRE — Renta Empresarial ────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  Régimen: [● Renta General (10% IRE)  ○ Renta Simple  ○ Resimple]   │   │
│  │  Período: [▼ Bimestre Mar-Abr 2026                                   ]│   │
│  │                                                                       │   │
│  │  Ingresos Brutos:       Gs. 80.000.000                                │   │
│  │  Costos:                Gs. 35.000.000                                │   │
│  │  Gastos Administrat.:   Gs. 15.000.000                                │   │
│  │  Gastos de Venta:       Gs. 5.000.000                                 │   │
│  │  ─────────────────────────────────────────                            │   │
│  │  Renta Neta:            Gs. 25.000.000                                │   │
│  │                                                                       │   │
│  │  IRE Determinado (10%): Gs. 2.500.000                                 │   │
│  │  Retenciones Sufridas:  Gs. 450.000                                   │   │
│  │  Anticipos:             Gs. 200.000                                   │   │
│  │  ─────────────────────────────                                        │   │
│  │  **Saldo a Pagar: Gs. 1.850.000**                                     │   │
│  │                                                                       │   │
│  │  [🔄 Calcular Formulario 501]  [📤 Exportar]                         │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Pestaña IRP (Renta Personal):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [IVA]  [IRE]  [IRP]  [INR]                                                  │
│                                                                               │
│  ┌─ IRP — Renta Personal ────────────────────────────────────────────────┐  │
│  │                                                                        │  │
│  │  Ingresos del Ejercicio:  Gs. 120.000.000                              │  │
│  │  Gastos Deducibles:       Gs. 45.000.000                               │  │
│  │  ─────────────────────────────                                         │  │
│  │  Renta Neta Imponible:    Gs. 75.000.000                               │  │
│  │                                                                        │  │
│  │  Porcentaje IRP:        10% (según tramo)                              │  │
│  │  IRP Determinado:        Gs. 7.500.000                                 │  │
│  │  Retenciones Sufridas:   Gs. 1.200.000                                 │  │
│  │  ─────────────────────────────                                         │  │
│  │  **Saldo a Pagar: Gs. 6.300.000**                                      │  │
│  │                                                                        │  │
│  │  [📤 Exportar]                                                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 19. Módulo Retenciones Tesaka

### 19.1 Certificados de Retención

**Ruta:** Gestión Fiscal → Retenciones Tesaka → `/tesaka`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📋 Retenciones Tesaka                             [+ Nueva Retención]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [IVA]  [IRE]  [IRP]  [INR]  [Todas]                                     │
│                                                                           │
│  ┌──────────┬────────────┬──────────┬────────┬──────────┬───────────┐   │
│  │ Certif.  │ Proveedor  │ Factura  │ Base   │ % Ret.  │ Importe   │   │
│  ├──────────┼────────────┼──────────┼────────┼──────────┼───────────┤   │
│  │CR-8001.. │Dist. ABC   │001-001.. │6.105.00│IVA 50%  │ 302.500   │   │
│  │          │            │          │0       │          │           │   │
│  │CR-8001.. │Dist. ABC   │001-001.. │6.105.00│IRE 30%  │ 183.150   │   │
│  │          │            │          │0       │          │           │   │
│  │CR-8001.. │XYZ S.A.    │001-002.. │2.300.00│IVA 50%  │ 115.000   │   │
│  │          │            │          │0       │          │           │   │
│  └──────────┴────────────┴──────────┴────────┴──────────┴───────────┘   │
│                                                                           │
│  Totales: IVA Gs. 417.500 | IRE Gs. 183.150 | IRP Gs. 0 | Total 600.650 │
│                                                                           │
│  [📤 Exportar CSV Tesaka]  [🗑️ Eliminar selección]                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 19.2 Tipos de retención (Tesaka)

| Tipo | Tasa | Base de cálculo | Aplica a |
|---|---|---|---|
| **IVA 50%** | 50% del IVA total | Total IVA del comprobante | Servicios en general |
| **IVA 100%** | 100% del IVA total | Total IVA del comprobante | Sector público |
| **IRE 30%** | 30% del IRE (gral) | Base neta (gravado − IVA) | Servicios profesionales |
| **IRE Simple** | 30% del IRE (simple) | Base neta | Servicios a simple |
| **IRP Honorarios** | 10% | Base gravada | Honorarios profesionales |
| **IRP Alquileres** | 10% | Base gravada | Alquileres |
| **IRP Dividendos** | 6% | Total | Dividendos / IDU |
| **IRP Intereses** | 6% | Intereses | Intereses pagados |

### 19.3 Crear certificado de retención

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ➕ Nueva Retención                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Documento origen: [▼ Factura 001-001-012345 — ABC S.A. — Gs. 6.1M    ] │
│                                                                           │
│  Tipo de retención: [▼ IVA Parcial (50%)                               ] │
│  Base de cálculo:   Gs. 6.105.000                                        │
│  IVA del documento: Gs. 605.000                                          │
│  Tasa:              50%                                                  │
│  Monto retenido:    Gs. 302.500 (calculado automáticamente)              │
│                                                                           │
│  Nro. Certificado:  [CR-80012345-01-2026_____________________________]  │
│  Fecha:             [📅 03/05/2026]                                      │
│                                                                           │
│  [Cancelar]                              [✓ Crear Retención]            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Paso a paso:**

1. Seleccione el **documento origen** (factura)
2. El tipo de retención se **preselecciona automáticamente** según el perfil del proveedor y el tipo de comprobante
3. Revise la **base de cálculo** y **tasa** (calculadas automáticamente por el motor de retenciones)
4. Confirme el **número de certificado** (formato: `CR-{RUC}-{año}{mes}-{seq}`)
5. Haga clic en **"Crear Retención"**

---

## 20. Módulo Timbrados

### 20.1 Gestión de timbrados

**Ruta:** Gestión Fiscal → Timbrados y Autoimp. → `/timbrados`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏷️ Timbrados y Autorizaciones                 [+ Nuevo Timbrado]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────┬──────────┬──────────┬──────────┬────────────┬───────────┐   │
│  │ Número │ Empresa  │ Tipo     │ Desde    │ Hasta      │ Estado    │   │
│  ├────────┼──────────┼──────────┼──────────┼────────────┼───────────┤   │
│  │12345678│Imp.Este  │Factura   │01/01/2026│31/12/2026  │ ✅ Vigente │   │
│  │12345679│Imp.Este  │NC        │01/01/2026│31/12/2026  │ ✅ Vigente │   │
│  │12345677│Imp.Este  │Factura   │01/01/2025│31/12/2025  │ ❌ Vencido  │   │
│  │87654321│Tech Asun.│Factura   │15/03/2026│14/03/2027  │ ✅ Vigente │   │
│  └────────┴──────────┴──────────┴──────────┴────────────┴───────────┘   │
│                                                                           │
│  🔴 1 timbrado vencido  |  🟡 0 próximos a vencer (30 días)             │
└──────────────────────────────────────────────────────────────────────────┘
```

### 20.2 Crear timbrado

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ➕ Nuevo Timbrado                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Empresa:     [▼ Importadora del Este                                  ] │
│  Número:      [________]  (8 dígitos, otorgado por SET)                 │
│                                                                           │
│  Tipo de Documento:                                                       │
│  [● Factura Electrónica  ○ NC Electrónica  ○ ND Electrónica  ○ Otro]    │
│                                                                           │
│  Rango desde:  [001-001-_____________]                                   │
│  Rango hasta:  [001-001-_____________]                                   │
│                                                                           │
│  Fecha inicio: [📅 01/01/2026]                                           │
│  Fecha fin:    [📅 31/12/2026]                                           │
│                                                                           │
│  [Cancelar]                              [✓ Guardar Timbrado]            │
└──────────────────────────────────────────────────────────────────────────┘
```

El sistema alerta automáticamente cuando un timbrado está próximo a vencer (30 días antes) y bloquea la emisión de comprobantes con timbrados vencidos.

---

## 21. Formulario 104 (IVA)

### 21.1 Generar Formulario 104

**Ruta:** Gestión Fiscal → (desde Libro IVA o Impuestos) → `/formulario104`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 Formulario 104 — IVA Mensual                                             │
│  Imp. del Este                           Período: Mayo 2026                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─ SECCIÓN 1: DÉBITO FISCAL ────────────────────────────────────────────┐  │
│  │  Código │ Concepto                          │ Base Imponible  │ IVA   │  │
│  ├────────┼────────────────────────────────────┼─────────────────┼───────┤  │
│  │  101   │ Ventas Gravadas Tasa 10%           │ 5.500.000       │550.000│  │
│  │  102   │ Ventas Gravadas Tasa 5%            │ 0               │ 0     │  │
│  │  103   │ Exportaciones y Exentas            │ 0               │ 0     │  │
│  │  104   │ Arrendamiento c/IVA                │ 2.500.000       │250.000│  │
│  │  105   │ Débito por omisión (Ajustes)       │ 0               │ 0     │  │
│  │  ───── │ TOTAL DÉBITO                       │ 8.000.000       │800.000│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─ SECCIÓN 2: CRÉDITO FISCAL ──────────────────────────────────────────┐  │
│  │  Código │ Concepto                          │ Base Imponible  │ IVA   │  │
│  ├────────┼────────────────────────────────────┼─────────────────┼───────┤  │
│  │  201   │ Compras Gravadas Tasa 10%          │ 7.500.000       │750.000│  │
│  │  202   │ Compras Gravadas Tasa 5%           │ 300.000         │ 15.000│  │
│  │  203   │ Importaciones Gravadas             │ 1.000.000       │100.000│  │
│  │  204   │ Bienes de Uso (Activo Fijo)        │ 0               │ 0     │  │
│  │  205   │ Crédito por omisión (Ajustes)      │ 0               │ 0     │  │
│  │  ───── │ TOTAL CRÉDITO                      │ 8.800.000       │865.000│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─ SECCIÓN 3: LIQUIDACIÓN ─────────────────────────────────────────────┐   │
│  │  Total Débito:                              Gs. 800.000              │   │
│  │  Total Crédito:                             Gs. 865.000              │   │
│  │  ──────────────────────────────────────────                           │   │
│  │  IVA a Favor (Crédito) / a Pagar (Débito):  Gs. **-65.000** (Favor)  │   │
│  │  Retenciones Sufridas:                      Gs. 302.500              │   │
│  │  ──────────────────────────────────────────                           │   │
│  │  **Saldo Final: Gs. 367.500 a Favor**        (a compensar/devolver)   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [📤 Exportar PDF]  [📤 Exportar TXT (SET)]  [✓ Presentar]                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso a paso:**

1. Seleccione **empresa** y **período** (mes/año)
2. El sistema **autocompleta** los datos desde el Libro IVA (compras y ventas)
3. **Revise** cada código/campo. Puede editar manualmente si hay ajustes
4. La **liquidación** se calcula automáticamente
5. Exporte a **PDF** (para archivo) o a **TXT** (formato SET para presentación en Marangatu)
6. Una vez presentado, marque como **"Presentado"** en el sistema

---

## 22. Formulario 501 (IRE)

### 22.1 Generar Formulario 501

**Ruta:** Gestión Fiscal → `/formulario501`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 Formulario 501 — IRE Renta Empresarial                                   │
│  Imp. del Este                        Bimestre: Marzo-Abril 2026            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Régimen: [● Renta General (10%)  ○ Simple (10%)  ○ Resimple (6%)]         │
│                                                                               │
│  ┌─ INGRESOS ───────────────────────────────────────────────────────────┐   │
│  │  Código │ Concepto                           │ Importe               │   │
│  ├────────┼─────────────────────────────────────┼───────────────────────┤   │
│  │  001   │ Ingresos Brutos por Ventas          │ 80.000.000            │   │
│  │  002   │ Ingresos Exentos                    │ 0                     │   │
│  │  003   │ Ingresos por Arrendamiento          │ 5.000.000             │   │
│  │  004   │ Otros Ingresos                      │ 2.500.000             │   │
│  │  ───── │ TOTAL INGRESOS BRUTOS               │ 87.500.000            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ COSTOS Y GASTOS ────────────────────────────────────────────────────┐   │
│  │  Código │ Concepto                           │ Importe               │   │
│  ├────────┼─────────────────────────────────────┼───────────────────────┤   │
│  │  101   │ Costo de Ventas/Mercaderías         │ 35.000.000            │   │
│  │  102   │ Gastos Administrativos              │ 15.000.000            │   │
│  │  103   │ Gastos de Venta                     │ 5.000.000             │   │
│  │  104   │ Gastos Financieros                  │ 2.500.000             │   │
│  │  105   │ Gastos Extraordinarios              │ 500.000               │   │
│  │  106   │ Gastos No Deducibles (adiciones)    │ 1.000.000             │   │
│  │  ───── │ TOTAL COSTOS Y GASTOS               │ 59.000.000            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ LIQUIDACIÓN ────────────────────────────────────────────────────────┐   │
│  │  Renta Bruta:                  87.500.000                             │   │
│  │  Costos y Gastos Deducibles:   (59.000.000)                           │   │
│  │  ─────────────────────────────                                         │   │
│  │  Renta Neta:                   28.500.000                             │   │
│  │  Compensación Pérdidas:        (3.500.000)                            │   │
│  │  ─────────────────────────────                                         │   │
│  │  Renta Neta Imponible:         25.000.000                             │   │
│  │  IRE Determinado (10%):        2.500.000                              │   │
│  │  Anticipos Pagados:            (200.000)                              │   │
│  │  Retenciones Sufridas:         (450.000)                              │   │
│  │  ─────────────────────────────                                         │   │
│  │  **Saldo a Pagar: Gs. 1.850.000**                                     │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [📤 Exportar PDF]  [📤 Exportar TXT]  [✓ Marcar Presentado]                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 23. Módulo Fiscal / Hechauka

### 23.1 Hechauka — Libro Electrónico

**Ruta:** Gestión Fiscal → (módulo Fiscal) → `/fiscal/hechauka`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📖 Hechauka — Libro Electrónico (SET)                                       │
│  Imp. del Este                            Período: Abril 2026               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Compras]  [Ventas]  [Generar Archivo]                                      │
│                                                                               │
│  ┌─ REGISTRO DE COMPRAS ────────────────────────────────────────────────┐   │
│  │  Nro. │ CDC               │ RUC Prov.  │ Fecha   │ Nro. Fact.│ Total │   │
│  ├───────┼───────────────────┼────────────┼─────────┼───────────┼───────┤   │
│  │ 1     │001-001-00123456.. │ 80011111-3 │03/05/26 │001-001-12 │6.1M   │   │
│  │ 2     │001-001-00678901.. │ 80222222-5 │05/05/26 │001-001-13 │2.3M   │   │
│  └───────┴───────────────────┴────────────┴─────────┴───────────┴───────┘   │
│                                                                               │
│  Total registros: 45 compras | Gs. 52.3M                                     │
│                                                                               │
│  [📤 Generar CSV Hechauka]  [📤 Generar TXT SET]                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Hechauka** es el libro electrónico mensual que debe presentarse a la SET/DNIT. InteliCont lo genera automáticamente a partir de los comprobantes importados.

### 23.2 Formularios Fiscales

**Ruta:** `/fiscal/formularios`

Acceso centralizado a todos los formularios fiscales paraguayos:

| Formulario | Impuesto | Periodicidad |
|---|---|---|
| **104** | IVA | Mensual |
| **500 / 501** | IRE (Renta Empresarial) | Bimestral |
| **120** | IRP (Renta Personal) | Anual |
| **1300 / 1301** | IRE Simplificado | Bimestral |

---

## 24. Módulo Cierre de Períodos

### 24.1 Checklist de cierre

**Ruta:** Contabilidad → Cierre de Períodos → `/cierre`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔒 Cierre de Período                          Mayo 2026                     │
│  Imp. del Este                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📋 CHECKLIST DE CIERRE                                                      │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ [✓] Todos los XMLs SIFEN procesados  (47/47)           ✅           │   │
│  │ [✓] Comprobantes pendientes contabilizados (0)          ✅           │   │
│  │ [✓] Libro IVA Cuadrado (Débito=Crédito+Cta.Proveedor)   ✅           │   │
│  │ [✓] Conciliación bancaria completada                     ✅           │   │
│  │ [✓] Depreciación de activos calculada                    ✅           │   │
│  │ [✓] Ajustes por diferencia de cambio aplicados           ✅           │   │
│  │ [✓] Retenciones del período registradas (Tesaka)         ✅           │   │
│  │ [✓] Formulario 104 calculado y verificado                ✅           │   │
│  │ [✓] Formulario 501/1301 calculado y verificado           ✅           │   │
│  │ [✓] Hechauka generado                                    ✅           │   │
│  │ [✓] No hay asientos en borrador (draft)                  ✅           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Progreso: 11/11 — ✅ Listo para cerrar                                     │
│                                                                               │
│  [🔒 Cerrar Período]                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 24.2 Cerrar el período

1. Revise que todos los ítems del checklist estén completos
2. Haga clic en **"Cerrar Período"**
3. Confirme la acción:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠️ ¿Está seguro de cerrar el período Mayo 2026?                    │
│                                                                       │
│  Una vez cerrado:                                                     │
│  • No se podrán postear nuevos asientos en este período              │
│  • Los saldos quedan congelados para generación de EE.FF.           │
│  • Para modificar, se requerirá reapertura con registro de auditoría │
│                                                                       │
│  [Cancelar]                    [✓ Confirmar Cierre]                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 24.3 Reapertura de período

Si necesita modificar un período cerrado:

1. Acceda a **Períodos Fiscales** → busque el período cerrado
2. Haga clic en **"Reabrir"**
3. Ingrese el **motivo obligatorio** (queda registrado en audit log)
4. Solo los administradores pueden reabrir períodos

---

## 25. Módulo Estados Financieros

### 25.1 Balance General

**Ruta:** Contabilidad → Estados Financieros → `/estados-financieros`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📈 Estados Financieros          Imp. del Este    [Mayo 2026 ▼]             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Balance General]  [Estado de Resultados]  [Flujo de Efectivo]              │
│                                                                               │
│  ┌─ BALANCE GENERAL ──────────────────────────────────────────────────────┐ │
│  │  ACTIVO                               │  PASIVO + PATRIMONIO          │ │
│  │                                       │                               │ │
│  │  Activo Corriente                     │  Pasivo Corriente             │ │
│  │    Caja/Bancos:       45.200.000      │    Proveedores:   18.500.000  │ │
│  │    Clientes:          23.100.000      │    IVA Débito:     4.100.000  │ │
│  │    IVA Crédito Fiscal: 3.250.000      │    Retenciones:      850.000  │ │
│  │    Deudores Varios:    1.500.000      │    ──────────────             │ │
│  │    ──────────────                     │    Total Pasivo:  23.450.000  │ │
│  │    Total A.C.:        73.050.000      │                               │ │
│  │                                       │  Patrimonio Neto              │ │
│  │  Activo No Corriente                  │    Capital:       50.000.000  │ │
│  │    Bienes de Uso:    120.000.000      │    Result.Acum:   12.000.000  │ │
│  │    Deprec. Acum.:    (15.000.000)     │    Result. Ejerc.: 7.600.000  │ │
│  │    ──────────────                     │    ──────────────             │ │
│  │    Total A.N.C.:     105.000.000      │    Total Patrim.: 69.600.000  │ │
│  │                                       │                               │ │
│  │  TOTAL ACTIVO:       178.050.000      │  TOTAL PASIVO + PATRIMONIO:  │ │
│  │                                       │         178.050.000 ✓        │ │
│  └───────────────────────────────────────┴───────────────────────────────┘ │
│                                                                             │
│  [📤 Exportar PDF]  [📤 Exportar Excel]  [🔍 Ver detalle por cuenta]      │
└────────────────────────────────────────────────────────────────────────────┘
```

### 25.2 Estado de Resultados

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Balance General]  [Estado de Resultados]  [Flujo de Efectivo]              │
│                                                                               │
│  ┌─ ESTADO DE RESULTADOS ───────────────────────────────────────────────┐   │
│  │  Mayo 2026                                                           │   │
│  │                                                                       │   │
│  │  INGRESOS                                                             │   │
│  │    Ventas:                             31.050.000                     │   │
│  │    Otros Ingresos:                      2.500.000                     │   │
│  │    ──────────────                                                     │   │
│  │    Total Ingresos:                     33.550.000                     │   │
│  │                                                                       │   │
│  │  COSTOS Y GASTOS                                                      │   │
│  │    Costo de Mercaderías:               18.200.000                     │   │
│  │    Sueldos y Salarios:                 50.000.000                     │   │
│  │    Servicios Básicos:                   3.400.000                     │   │
│  │    Depreciaciones:                      1.500.000                     │   │
│  │    Gastos Financieros:                  1.200.000                     │   │
│  │    ──────────────                                                     │   │
│  │    Total Costos y Gastos:              (74.300.000)                   │   │
│  │                                                                       │   │
│  │  Resultado del Ejercicio:              (40.750.000) ← ✕ Pérdida      │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 25.3 Flujo de Efectivo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [Balance General]  [Estado de Resultados]  [Flujo de Efectivo]              │
│                                                                               │
│  ┌─ FLUJO DE EFECTIVO ──────────────────────────────────────────────────┐   │
│  │  Mayo 2026                                                           │   │
│  │                                                                       │   │
│  │  Flujo Operativo:                                                     │   │
│  │    Cobros a Clientes:                   28.000.000                     │   │
│  │    Pagos a Proveedores:                (15.500.000)                    │   │
│  │    Pagos de Sueldos:                   (8.000.000)                     │   │
│  │    Pago de IVA:                         (550.000)                      │   │
│  │    ──────────────                                                     │   │
│  │    Efectivo Neto Operativo:              3.950.000                     │   │
│  │                                                                       │   │
│  │  Flujo de Inversión:                                                  │   │
│  │    Compra de Activos:                  (25.000.000)                    │   │
│  │                                                                       │   │
│  │  Flujo de Financiación:                                               │   │
│  │    Aporte de Capital:                    0                             │   │
│  │    Préstamos:                            0                             │   │
│  │                                                                       │   │
│  │  Variación Neta del Efectivo:          (21.050.000)                    │   │
│  │  Saldo Inicial:                         66.250.000                     │   │
│  │  **Saldo Final:                         45.200.000**                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 26. Módulo Períodos Fiscales

### 26.1 Gestión de períodos

**Ruta:** `/periodos`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📅 Períodos Fiscales           Imp. del Este                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────┬───────┬──────────────┬──────────────┬──────────┬──────────┐ │
│  │ Año    │ Mes   │ Desde        │ Hasta        │ Estado   │ Acciones │ │
│  ├────────┼───────┼──────────────┼──────────────┼──────────┼──────────┤ │
│  │ 2026   │ Mayo  │ 01/05/2026   │ 31/05/2026   │ ✅ Abierto│ [🔒]    │ │
│  │ 2026   │ Abril │ 01/04/2026   │ 30/04/2026   │ 🔒 Cerrado│ [🔓]    │ │
│  │ 2026   │ Marzo │ 01/03/2026   │ 31/03/2026   │ 🔒 Cerrado│ [🔓]    │ │
│  │ 2026   │ Feb.  │ 01/02/2026   │ 28/02/2026   │ 🔒 Cerrado│ [🔓]    │ │
│  │ 2026   │ Enero │ 01/01/2026   │ 31/01/2026   │ 🔒 Cerrado│ [🔓]    │ │
│  └────────┴───────┴──────────────┴──────────────┴──────────┴──────────┘ │
│                                                                           │
│  [+ Nuevo Período]                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

| Estado | Significado |
|---|---|
| ✅ **Abierto** | Se pueden postear asientos. Solo un período abierto por empresa |
| 🔒 **Cerrado** | No se pueden postear asientos. Para modificar, reabrir con motivo |
| 🔓 **Reabierto** | Fue cerrado y luego reabierto. Queda registro en auditoría |

---

## 27. Módulo Cuentas Corrientes

### 27.1 Estado de cuentas corrientes

**Ruta:** `/cuentas-corrientes`

```
┌──────────────────────────────────────────────────────────────────────────┐
│  💰 Cuentas Corrientes          Imp. del Este   [Mayo 2026 ▼]           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [Clientes]  [Proveedores]                                                │
│                                                                           │
│  ┌──────────┬──────────────┬──────────┬──────────┬──────────┬─────────┐ │
│  │ Tercero  │ Debe         │ Haber    │ Saldo    │ Antigüedad│ Acción │ │
│  ├──────────┼──────────────┼──────────┼──────────┼──────────┼─────────┤ │
│  │ComerPar  │ 3.850.000    │ 0        │ 3.850.000│ 30 días  │ [👁]   │ │
│  │ABC S.A.  │ 0            │6.105.000 │(6.105.00)│ 30 días  │ [👁]   │ │
│  │          │              │          │        0│          │         │ │
│  │XYZ       │ 0            │2.300.000 │(2.300.00)│ 15 días  │ [👁]   │ │
│  │          │              │          │        0│          │         │ │
│  └──────────┴──────────────┴──────────┴──────────┴──────────┴─────────┘ │
│                                                                           │
│  Antigüedad de saldos:                                                    │
│  🟢 0-30 días: 3 | 🟡 31-60 días: 1 | 🔴 61-90 días: 0 | ⚫ +90: 1    │
│                                                                           │
│  [📤 Exportar]                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Antigüedad de saldos (Aging):**

El sistema clasifica automáticamente las cuentas por antigüedad:

| Rango | Color | Acción recomendada |
|---|---|---|
| 0-30 días | 🟢 | Vigente, sin acción urgente |
| 31-60 días | 🟡 | Seguimiento de cobro |
| 61-90 días | 🔴 | Gestión de cobro judicial |
| +90 días | ⚫ | Provisión de incobrabilidad |

---

## 28. Módulo Cobros y Pagos

### 28.1 Registro de cobros

**Ruta:** `/cobros-pagos`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  💳 Cobros y Pagos                 Imp. del Este                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Cobros]  [Pagos]                                                            │
│                                                                               │
│  ┌───────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────┐ │
│  │ Nro.  │ Tercero  │ Fecha    │  Factura │ Monto    │ Método   │ Recibo  │ │
│  ├───────┼──────────┼──────────┼──────────┼──────────┼──────────┼─────────┤ │
│  │COB-001│ComerPar  │03/05/26  │001-001.. │3.850.000 │ Transfer.│ REC-001 │ │
│  │COB-002│Cliente B │28/04/26  │001-002.. │2.000.000 │ Efectivo │ REC-002 │ │
│  └───────┴──────────┴──────────┴──────────┴──────────┴──────────┴─────────┘ │
│                                                                               │
│  [+ Nuevo Cobro]  [+ Nuevo Pago]                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 28.2 Aplicación de cobro a facturas

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ➕ Nuevo Cobro                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Cliente: [▼ ComerPar — RUC 80111111-1                    ]                 │
│  Fecha:   [📅 03/05/2026]                                                     │
│                                                                               │
│  Facturas pendientes del cliente:                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ [☐] 001-001-1001 — Gs. 3.850.000 — Vto: 02/06/2026 — Pdte: 100%   │   │
│  │      Aplicar: [Gs. 3.850.000___________________________________]    │   │
│  │ [☐] 001-001-1005 — Gs. 1.500.000 — Vto: 15/06/2026 — Pdte: 100%   │   │
│  │      Aplicar: [Gs. 0___________________________________________]    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Total a cobrar: Gs. 3.850.000                                               │
│                                                                               │
│  Método de Pago: [▼ Transferencia Bancaria                                 ] │
│  Cuenta Bancaria: [▼ Banco Itaú — Cta. 123456-7                           ] │
│                                                                               │
│  📎 Comprobante: [📷 Adjuntar comprobante de transferencia]                  │
│                                                                               │
│  [Cancelar]                    [✓ Registrar Cobro y Generar Recibo]         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 29. Módulo Multimoneda

### 29.1 Operaciones en moneda extranjera

**Ruta:** `/multimoneda`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  💱 Multimoneda                  Imp. del Este   [Mayo 2026 ▼]              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📊 Tipos de Cambio                                                          │
│  ┌──────────┬──────────────┬──────────────┬──────────────┬────────────────┐ │
│  │ Moneda   │ Fecha        │ T.C. Compra  │ T.C. Venta   │ T.C. Contable  │ │
│  ├──────────┼──────────────┼──────────────┼──────────────┼────────────────┤ │
│  │ USD      │ 03/05/2026   │ 7.250        │ 7.300        │ 7.275          │ │
│  │ USD      │ 02/05/2026   │ 7.240        │ 7.290        │ 7.265          │ │
│  │ EUR      │ 03/05/2026   │ 7.850        │ 7.920        │ 7.885          │ │
│  │ ARS      │ 03/05/2026   │ 8.50         │ 9.00         │ 8.75           │ │
│  │ BRL      │ 03/05/2026   │ 1.410        │ 1.440        │ 1.425          │ │
│  └──────────┴──────────────┴──────────────┴──────────────┴────────────────┘ │
│                                                                               │
│  [💱 Registrar Tipo de Cambio]  [🔄 Ajuste por Diferencia de Cambio]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 29.2 Asiento multi-moneda

Al crear un asiento en moneda extranjera:

1. Seleccione la moneda (USD, EUR, ARS, BRL, etc.)
2. El tipo de cambio se **autocompleta** según la fecha
3. Ingrese los importes en moneda extranjera
4. El sistema calcula automáticamente el **equivalente en PYG** (base)
5. El balanceo se verifica **por moneda** (USD balancea en USD, PYG en PYG)

### 29.3 Ajuste por diferencia de cambio

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔄 Ajuste por Diferencia de Cambio   [Mayo 2026 ▼]                        │
│                                                                               │
│  Cuentas en moneda extranjera:                                                │
│  ┌──────────┬────────┬──────────────┬──────────────┬──────────┬──────────┐  │
│  │ Cuenta   │ Moneda │ Saldo ME     │ TC Anterior  │ TC Actual│ Dif. PYG │  │
│  ├──────────┼────────┼──────────────┼──────────────┼──────────┼──────────┤  │
│  │1.01.001  │ USD    │ 5.000        │ 7.265        │ 7.275    │ +50.000  │  │
│  │2.01.001  │ USD    │ (2.500)      │ 7.265        │ 7.275    │ (25.000) │  │
│  └──────────┴────────┴──────────────┴──────────────┴──────────┴──────────┘  │
│                                                                               │
│  Diferencia neta: Gs. +25.000 (Ganancia)                                     │
│                                                                               │
│  [✓ Generar Asiento de Ajuste]                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 30. Módulo Documentos

### 30.1 Gestión documental

**Ruta:** `/documentos`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📁 Documentos                                  [+ Subir Documento]         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar...]  Tipo: [Todos ▼]  Empresa: [Imp. del Este ▼]               │
│                                                                               │
│  ┌──────────┬────────────┬──────────┬──────────┬────────────┬────────────┐  │
│  │ Nombre   │ Tipo       │ Empresa  │ Fecha    │ Tamaño     │ Vinculado  │  │
│  ├──────────┼────────────┼──────────┼──────────┼────────────┼────────────┤  │
│  │Fact. ABC │ XML SIFEN  │Imp.Este  │03/05/26  │ 12 KB      │ JE-028     │  │
│  │Ext. Bco. │ CSV Banc.  │Imp.Este  │01/05/26  │ 45 KB      │ Conc-001   │  │
│  │KuDE Dic. │ PDF KuDE   │Tech Asun.│15/04/26  │ 120 KB     │ —          │  │
│  └──────────┴────────────┴──────────┴──────────┴────────────┴────────────┘  │
│                                                                               │
│  [📤 Subir]  [📥 Descargar]  [🔗 Vincular a...]  [🗑️ Eliminar]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Tipos de documentos soportados:**

| Tipo | Extensión | Almacenamiento |
|---|---|---|
| XML SIFEN | .xml | Upload → S3/R2 |
| Extracto Bancario | .csv, .xlsx | Upload → S3/R2 |
| PDF / KuDE | .pdf | Upload → S3/R2 |
| Imagen de comprobante | .jpg, .png | Upload → S3/R2 |
| Archivo de importación | .csv, .xlsx | Upload → S3/R2 |

Cada documento puede vincularse a:
- Un **asiento contable**
- Una **conciliación bancaria**
- Un **comprobante** específico
- Un **activo fijo**

---

## 31. Módulo Importaciones (Despachos)

### 31.1 Despachos de importación

**Ruta:** `/importaciones`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🚢 Importaciones (Despachos)                    [+ Nuevo Despacho]         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┬────────────┬──────────┬──────────┬──────────┬──────────┬─────┐│
│  │ Nro.     │ Descripción│ Fecha    │ FOB      │ Gastos   │ IVA Adu. │ Estado│
│  ├──────────┼────────────┼──────────┼──────────┼──────────┼──────────┼─────┤│
│  │DIMP-001  │Mercadería  │15/04/26  │50.000.000│12.000.000│6.200.000 │Pend. ││
│  │          │China       │          │          │          │          │     ││
│  │DIMP-002  │Repuestos   │20/03/26  │25.000.000│ 5.000.000│3.000.000 │Cont. ││
│  └──────────┴────────────┴──────────┴──────────┴──────────┴──────────┴─────┘│
│                                                                               │
│  [📤 Generar Asiento de Importación]                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 31.2 Crear despacho de importación

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ➕ Nuevo Despacho de Importación                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Proveedor exterior: [Shenzhen Trading Co.                             ]    │
│  Descripción:        [Contenedor con mercadería electrónica             ]    │
│  Fecha de despacho:  [📅 15/04/2026]                                           │
│                                                                               │
│  💰 Costos de Importación                                                     │
│  │ Valor FOB (USD):              [6.850_____________________________]       │
│  │ Flete (USD):                  [1.200_____________________________]       │
│  │ Seguro (USD):                 [150______________________________]        │
│  │                                                                           │
│  │ T.C. utilizado:              [7.265________________________________]      │
│  │ Valor CIF (PYG):             [59.598.800 (calculado automáticamente)]    │
│  │                                                                           │
│  │ Derechos de Aduana (%):      [10%_________________________________]      │
│  │ IVA Aduana (10%):            [6.200.000 (calculado automáticamente) ]    │
│  │ Gastos de Despacho:          [500.000______________________________]     │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  El sistema genera automáticamente el asiento de liquidación de importación  │
│  con las cuentas correspondientes (Inventario, IVA Aduana, Proveedores).    │
│                                                                               │
│  [Cancelar]                    [✓ Registrar Despacho]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 32. Módulo Importar (CSV/XML)

### 32.1 Asistente de importación

**Ruta:** `/importar`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📤 Importar Datos                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Paso 1: Seleccione el tipo de importación                                   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [📄 Comprobantes]  [🏦 Extractos Bancarios]  [👥 Terceros]         │   │
│  │  [📦 Productos]     [📋 Asientos]             [✉️ XML SIFEN]        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Paso 2: Seleccione el archivo                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  📁 [Seleccionar archivo]  o  arrastre aquí                            │   │
│  │                                                                       │   │
│  │  Formatos: .csv, .xlsx, .xml                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Paso 3: Mapeo de columnas                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Columna del archivo  →  Campo del sistema                             │   │
│  │  ─────────────────────────────────────────                             │   │
│  │  [Fecha        ▼]    →  [Fecha          ▼]  ⚡ Autodetectado          │   │
│  │  [Descripción  ▼]    →  [Concepto       ▼]  ⚡ Autodetectado          │   │
│  │  [Importe      ▼]    →  [Monto          ▼]  ⚡ Autodetectado          │   │
│  │  [______________▼]   →  [_______________▼]  [+ Agregar mapeo]         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Paso 4: Vista previa y confirmación                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Registros detectados: 45                                             │   │
│  │  Registros válidos:    42   ⚠️ 3 con errores                         │   │
│  │                                                                       │   │
│  │  ┌──────────┬────────────┬──────────┬─────────────────────────┐     │   │
│  │  │ Fecha    │ Concepto   │ Importe  │ Estado                  │     │   │
│  │  ├──────────┼────────────┼──────────┼─────────────────────────┤     │   │
│  │  │03/05/26  │Venta A     │ 3.500.000│ ✅ Válido               │     │   │
│  │  │03/05/26  │Venta B     │  ABC     │ ❌ Importe inválido     │     │   │
│  │  └──────────┴────────────┴──────────┴─────────────────────────┘     │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [⟵ Atrás]                                            [✓ Importar 42 registros]│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Pasos del asistente:**

1. **Tipo** → Seleccione qué va a importar
2. **Archivo** → Suba el CSV, XLSX o XML
3. **Mapeo** → El sistema autodetecta las columnas. Confirme o ajuste
4. **Vista previa** → Revise los registros, corrija errores
5. **Importar** → Confirme la importación

---

## 33. Módulo Reportes

### 33.1 Reportes disponibles

**Ruta:** Soporte y Configuración → Reportes Varios → `/reportes`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📊 Reportes Varios                        Imp. del Este   [Mayo 2026 ▼]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📋 Reportes Contables                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ [📊 Balance de Sumas y Saldos]                                  │       │
│  │ [📈 Mayor Analítico por Cuenta]                                 │       │
│  │ [📖 Libro Diario]                                              │       │
│  │ [📖 Libro Mayor]                                               │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  📋 Reportes Fiscales                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ [📕 Libro IVA Compras]                                          │       │
│  │ [📕 Libro IVA Ventas]                                           │       │
│  │ [📋 RG90 Conciliación]                                          │       │
│  │ [📤 Hechauka CSV]                                               │       │
│  │ [📋 Formulario 104]                                             │       │
│  │ [📋 Formulario 501]                                             │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  📋 Reportes de Gestión                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │ [💰 Antigüedad de Saldos (Aging)]                               │       │
│  │ [📊 Cuentas Corrientes]                                          │       │
│  │ [📈 Flujo de Efectivo]                                           │       │
│  │ [📊 Estados Financieros]                                         │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  [📤 Exportar]                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 33.2 Balance de Sumas y Saldos

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📊 Balance de Sumas y Saldos     Imp. del Este   [Mayo 2026 ▼]            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┬────────────────────────┬────────────┬────────────┬──────────┐ │
│  │ Cuenta   │ Nombre                 │ Suma Débito│ Suma Créd. │ Saldo    │ │
│  ├──────────┼────────────────────────┼────────────┼────────────┼──────────┤ │
│  │1.01.001  │ Caja y Bancos          │ 45.200.000 │    0       │ 45.200.00│ │
│  │1.01.002  │ Clientes               │  3.850.000 │    0       │  3.850.00│ │
│  │1.01.003  │ IVA Crédito Fiscal     │ 865.000    │    0       │ 865.000  │ │
│  │1.03.001  │ IVA Débito Fiscal      │    0       │ 800.000    │ (800.000)│ │
│  │2.01.001  │ Proveedores            │    0       │ 6.105.000  │(6.105.00)│ │
│  │4.01.001  │ Ventas                 │    0       │ 5.500.000  │(5.500.00)│ │
│  │5.01.001  │ Compras                │ 5.500.000  │    0       │ 5.500.000│ │
│  ├──────────┴────────────────────────┼────────────┼────────────┼──────────┤ │
│  │  TOTALES                          │ 55.415.000 │ 55.415.000 │    0 ✓   │ │
│  └───────────────────────────────────┴────────────┴────────────┴──────────┘ │
│                                                                               │
│  [📤 Exportar PDF]  [📤 Exportar Excel]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 34. Módulo Configuración

### 34.1 Perfil y configuración del sistema

**Ruta:** Soporte y Configuración → Mi Estudio → `/configuracion`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configuración                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [👤 Perfil]  [🤖 IA]  [🔔 Notificaciones]  [🔒 Seguridad]  [🎨 Apariencia] │
│                                                                               │
│  ┌─ PERFIL ─────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  Nombre:  [Gustavo A.___________________________________________]    │   │
│  │  Email:   [gustavo@estudiocontable.com__________________________]    │   │
│  │  Rol:     Administrador                                                │   │
│  │                                                                       │   │
│  │  [✓ Guardar Cambios]                                                  │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─ INTELIASISTENTE (IA) ───────────────────────────────────────────────┐   │
│  │  Proveedor de IA: [▼ Anthropic Claude Sonnet                       ]  │   │
│  │  API Key: [••••••••••••••••••••••••••] [✓ Verificar conexión]       │   │
│  │                                                                       │   │
│  │  [✓] Sugerir contabilización automática al importar XML              │   │
│  │  [✓] Detectar anomalías en asientos                                  │   │
│  │  [✓] Recomendar vencimientos próximos                                │   │
│  │                                                                       │   │
│  │  Confianza mínima para aprobación automática: [80% ███████░░░]       │   │
│  │                                                                       │   │
│  │  [✓ Guardar Configuración IA]                                        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 34.2 Pestañas de configuración

| Pestaña | Configuraciones |
|---|---|
| **👤 Perfil** | Nombre, email, cambiar contraseña |
| **🤖 IA** | Proveedor (Claude, Gemini, reglas), API keys, umbral de confianza, comportamientos automáticos |
| **🔔 Notificaciones** | Alertas por email, frecuencia, tipos de notificaciones (vencimientos, actividad, sistema) |
| **🔒 Seguridad** | Sesiones activas, 2FA, historial de acceso |
| **🎨 Apariencia** | Tema (Claro/Oscuro/Sistema), tamaño de fuente, compacto/normal |

---

## 35. Módulo Auditoría

### 35.1 Registro de auditoría

**Ruta:** Soporte y Configuración → Auditoría Contable → `/auditoria`

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔍 Auditoría Contable                       Imp. del Este                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar...]  Tipo: [Todos ▼]  Usuario: [Todos ▼]                       │
│  Desde: [01/01/2026]  Hasta: [31/05/2026]                                    │
│                                                                               │
│  ┌──────────┬──────────┬────────────┬──────────┬──────────────────────────┐ │
│  │ Fecha    │ Usuario  │ Acción     │ Entidad  │ Detalle                  │ │
│  ├──────────┼──────────┼────────────┼──────────┼──────────────────────────┤ │
│  │03/05 10:30│María L.  │ Asiento    │ JE-028   │ Creación y posteo       │ │
│  │          │          │ Creado     │          │ Compra ABC              │ │
│  │03/05 09:15│María L.  │ SIFEN      │ 001-001. │ XML importado, IA 94%   │ │
│  │          │          │ Importado  │ 012345   │ Aprobado autom.         │ │
│  │01/05 18:00│Gustavo A.│ Período    │ Mayo 26  │ Período abierto        │ │
│  │          │          │ Abierto    │          │                         │ │
│  │30/04 23:55│Gustavo A.│ Período    │ Abr 26   │ Cierre contable        │ │
│  │          │          │ Cerrado    │          │ Checklist 10/10        │ │
│  │28/04 16:30│María L.  │ Asiento    │ JE-025   │ Reversión de JE-024    │ │
│  │          │          │ Reversión  │          │ Ajuste cambiario        │ │
│  └──────────┴──────────┴────────────┴──────────┴──────────────────────────┘ │
│                                                                               │
│  📊 Resumen: 245 eventos en el período  |  📤 [Exportar CSV]                │
│                                                                               │
│  🤖 InteliAsistente: "Se detectan 3 reversiones en el mes. Considere        │
│   revisar los criterios de contabilización para reducir correcciones."       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Eventos auditados (todos los cambios):**

| Categoría | Eventos registrados |
|---|---|
| **Asientos** | Creación, posteo, reversión, ajuste |
| **SIFEN** | Importación, aprobación, rechazo |
| **Períodos** | Apertura, cierre, reapertura (con motivo) |
| **Configuración** | Cambios en cuentas, empresas, miembros |
| **Seguridad** | Inicio/cierre de sesión, cambios de contraseña |
| **IA** | Decisiones automáticas (aceptación/rechazo) |

---

## 36. Superadmin SaaS

### 36.1 Panel de administración del SaaS

**Ruta:** Soporte y Configuración → Superadmin SaaS → `/superadmin`

Solo visible para usuarios con rol **Superadmin**. Permite gestionar el negocio SaaS:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔧 Superadmin SaaS                                    📊 MRR: Gs. 15.2M   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [🏢 Empresas]  [👥 Usuarios]  [💎 Planes]  [📊 Métricas]  [⚙️ Global]    │
│                                                                               │
│  ┌─ EMPRESAS ───────────────────────────────────────────────────────────┐   │
│  │  ┌──────────┬──────────────┬──────────┬──────────┬──────────────┐    │   │
│  │  │ Empresa  │ RUC          │ Plan     │ MRR      │ Estado       │    │   │
│  │  ├──────────┼──────────────┼──────────┼──────────┼──────────────┤    │   │
│  │  │Imp.Este  │ 80012345-1   │ Profes.  │ Gs. 500K │ ● Activo     │    │   │
│  │  │Tech Asun.│ 80123456-3   │ Profes.  │ Gs. 500K │ ● Activo     │    │   │
│  │  │Dist. Ña. │ 80234567-5   │ Básico   │ Gs. 200K │ ● Activo     │    │   │
│  │  │TEST      │ 00000000-0   │ Test     │ Gs. 0    │ ⚪ Trial     │    │   │
│  │  └──────────┴──────────────┴──────────┴──────────┴──────────────┘    │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 37. Portal del Cliente

### 37.1 Acceso del cliente

**Ruta:** `/portal`

El portal del cliente es una vista limitada que permite a los clientes de un estudio contable consultar su información sin acceder al sistema principal.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  👤 Portal — Importadora del Este                        [Cerrar Sesión]    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📊 Resumen del Mes: Mayo 2026                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ Ingresos │ │ Gastos   │ │ IVA      │ │ Doc.     │                      │
│  │ Gs. 31.1M│ │ Gs. 18.2M│ │ Pend.    │ │ Pend.    │                      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                      │
│                                                                               │
│  [📊 Estados Financieros]  [📄 Mis Documentos]  [📋 Declaraciones]        │
│  [📥 Descargar Reportes]                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Disponible para clientes:**

| Sección | Descripción |
|---|---|
| **📊 Estados Financieros** | Balance General, Estado de Resultados (solo lectura) |
| **📄 Mis Documentos** | Facturas, comprobantes asociados a la empresa |
| **📋 Declaraciones** | Formularios presentados (PDF de respaldo) |
| **📥 Descargar Reportes** | Exportar estados financieros, libros, etc. |

---

## 38. Offline y PWA

### 38.1 Modo offline

InteliCont funciona como **Progressive Web App (PWA)**, lo que permite:

- **Instalación** en el dispositivo (como una app nativa)
- **Uso offline parcial**: las páginas ya cargadas permanecen accesibles sin internet
- **Captura de comprobantes** con la cámara aunque no haya conexión
- **Sincronización automática** cuando se recupera la conexión

**Para instalar la PWA:**

1. Abra InteliCont en Chrome/Edge/Safari
2. Busque el icono de instalación en la barra de direcciones
3. Haga clic en "Instalar InteliCont"
4. Aparecerá como una aplicación en su dispositivo

### 38.2 Servicio de sincronización

Las operaciones realizadas offline se encolan y sincronizan automáticamente cuando el dispositivo recupera la conexión a internet. Esto incluye:

- Captura de imágenes de comprobantes
- Datos de caja chica registrados offline
- Notas y comentarios

---

## 39. Atajos de Teclado

### 39.1 Atajos globales

| Atajo | Acción |
|---|---|
| `⌘K` / `Ctrl+K` | Abrir paleta de comandos |
| `⌘N` / `Ctrl+N` | Nuevo asiento contable |
| `⌘E` / `Ctrl+E` | Abrir selector de empresa |
| `⌘,` / `Ctrl+,` | Abrir configuración |
| `Esc` | Cerrar modal/paleta |
| `⌘/` / `Ctrl+/` | Mostrar esta ayuda de teclado |

### 39.2 En la paleta de comandos

| Tecla | Acción |
|---|---|
| `↑` `↓` | Navegar entre resultados |
| `Enter` | Seleccionar/abrir |
| `Esc` | Cerrar |
| `⌫` (Backspace) | Limpiar búsqueda |
| `Tab` | Ir a siguiente grupo |

### 39.3 En formularios

| Tecla | Acción |
|---|---|
| `Tab` | Siguiente campo |
| `Shift+Tab` | Campo anterior |
| `Enter` | Guardar/Postear (en formularios) |
| `⌘Enter` | Guardar y postear directamente |
| `Esc` | Cancelar / cerrar formulario |

---

## 40. Apéndice: Glosario PY

### 40.1 Términos fiscales paraguayos

| Término | Significado |
|---|---|
| **SET** | Subsecretaría de Estado de Tributación (autoridad fiscal) |
| **DNIT** | Dirección Nacional de Ingresos Tributarios (nuevo nombre de la SET) |
| **RUC** | Registro Único de Contribuyentes. Formato: `XXXXXXXX-X` |
| **CDC** | Código de Control de 44 dígitos del SIFEN |
| **Timbrado** | Autorización fiscal para emitir comprobantes. 8 dígitos |
| **SIFEN** | Sistema de Facturación Electrónica Nacional |
| **KuDE** | Representación gráfica del comprobante (PDF) |
| **Hechauka** | Libro Electrónico (Libro de Registro) mensual |
| **Aranduka** | Aplicativo de la SET para libro electrónico |
| **Tesaka** | Sistema de Retenciones |
| **Marangatu** | Portal web de la SET para declaraciones y pagos |
| **RG 90/2021** | Resolución General de Conciliación de Comprobantes |
| **IVA** | Impuesto al Valor Agregado. Tasas: 10% (general), 5% (reducido), 0% (exento) |
| **IRE** | Impuesto a la Renta Empresarial. Regímenes: General (10%), Simple (10%), Resimple (6%) |
| **IRP** | Impuesto a la Renta Personal. Progresivo según tramos |
| **INR** | Impuesto a la Renta de No Residentes |
| **IDU** | Impuesto a los Dividendos y Utilidades (6%) |

### 40.2 Tipos de comprobantes

| Tipo | Descripción |
|---|---|
| **Factura** | Comprobante de venta |
| **Nota de Crédito (NC)** | Anula total o parcialmente una factura |
| **Nota de Débito (ND)** | Incrementa el importe de una factura |
| **Autofactura** | Factura emitida por el comprador |
| **Remito** | Comprobante de traslado de mercadería |
| **Recibo** | Comprobante de pago/cobro |

### 40.3 Régimen de IVA

| Tasa | Aplica a |
|---|---|
| **10% (General)** | Mayoría de bienes y servicios |
| **5% (Reducido)** | Productos de canasta familiar, transporte, salud, educación |
| **Exento (0%)** | Exportaciones, servicios financieros, seguros, alquiler de vivienda |

### 40.4 Retenciones (Tesaka)

| Retención | Tasa | Base |
|---|---|---|
| **IVA 50%** | 50% del IVA | IVA total del comprobante |
| **IVA 100%** | 100% del IVA | IVA total (sector público) |
| **IRE General** | 3% (30% × 10%) | Base neta (gravado − IVA) |
| **IRE Simple** | 3% (30% × 10%) | Base neta |
| **IRP Honorarios** | 10% | Base gravada |
| **IRP Alquileres** | 10% | Base gravada |
| **INR** | 15%-35% | Según actividad |

### 40.5 Vencimientos fiscales

| Obligación | Fecha de vencimiento |
|---|---|
| **IVA (Formulario 104)** | Día 10 del mes siguiente + último dígito del RUC (ajuste fin de semana) |
| **Hechauka** | Día 25 del mes siguiente al período |
| **IRE (Formulario 501)** | Bimestral, 15 días después del cierre del bimestre |
| **IRP** | Anual, hasta el 30 de abril del año siguiente |
| **Tesaka (Retenciones)** | Hasta el día 15 del mes siguiente |

### 40.6 Solución de problemas comunes

| Problema | Causa posible | Solución |
|---|---|---|
| No puedo postear un asiento | El período está cerrado | Reabra el período (admin) |
| El asiento no balancea | Suma débitos ≠ créditos | Revise cada línea. El sistema muestra la diferencia |
| El RUC no se valida | Formato incorrecto o dígito verificador erróneo | Verifique el RUC en el portal SET |
| No encuentro una cuenta | La cuenta no existe o está inactiva | Busque en el plan de cuentas o créela |
| El XML SIFEN da error | Archivo corrupto o formato no válido | Verifique que sea XML SIFEN válido |
| La conciliación no cierra | Hay movimientos sin contrapartida | Cree asientos para los movimientos faltantes |
| No veo una empresa en el selector | No tengo membresía activa | Solicite al admin que me invite |

---

## Índice de Funciones por Módulo

| # | Módulo | Funciones principales |
|---|---|---|
| 1 | Dashboard | KPIs, gráfico IVA, vencimientos, InteliInsights, accesos rápidos |
| 2 | Empresas | CRUD, configuración, miembros, planes, plan de cuentas automático |
| 3 | SIFEN | Carga XML, escaneo portal, vista previa, sugerencia IA, historial, emisión |
| 4 | Comprobantes | Bandeja, aprobación masiva, registro manual, recibos, vinculación IA |
| 5 | Asientos | CRUD, partida doble, borrador/posteo, reversión, ajuste, detalle |
| 6 | Plan de Cuentas | Árbol jerárquico, creación/edición, mapeo fiscal, búsqueda |
| 7 | Libros | Diario, Mayor, Sumas y Saldos, exportación PDF/Excel |
| 8 | Libro IVA | Compras, Ventas, Hechauka, resumen, cálculo F.104 |
| 9 | Activos Fijos | Registro, depreciación lineal, asiento automático, valor neto |
| 10 | Terceros | Clientes/proveedores, RUC validation, perfil retención, saldos |
| 11 | Bancos | Cuentas, extractos CSV, conciliación visual, match IA, asientos |
| 12 | Caja Chica | Fondos, gastos, reposición, comprobantes, IVA |
| 13 | Tesorería | OP, cheques, transferencias, aprobación, pagos |
| 14 | Calendario | Vencimientos automáticos, vista mensual, alertas |
| 15 | RG90 | Conciliación SIFEN vs libros, exportación CSV RFC 955/956 |
| 16 | Impuestos | IVA, IRE, IRP, INR, cálculo automático, asesoría IA |
| 17 | Tesaka | Certificados, tipos, cálculo automático, exportación CSV |
| 18 | Timbrados | CRUD, vigencias, alertas vencimiento, control de rangos |
| 19 | Formulario 104 | Cálculo IVA mensual, secciones, exportación PDF/TXT |
| 20 | Formulario 501 | Cálculo IRE bimestral, secciones, exportación |
| 21 | Hechauka | Libro electrónico, generación CSV/TXT formato SET |
| 22 | Cierre | Checklist, verificación, cierre, reapertura con auditoría |
| 23 | EE.FF. | Balance, Resultados, Flujo Efectivo, exportación |
| 24 | Períodos | Apertura, cierre, reapertura, control de estados |
| 25 | Ctas. Ctes. | Antigüedad, saldos, aging, gestión de cobro |
| 26 | Cobros/Pagos | Aplicación a facturas, recibos, métodos de pago |
| 27 | Multimoneda | TC, ajuste cambio, asientos ME, balanceo por moneda |
| 28 | Documentos | Upload, tagging, vinculación, almacenamiento S3 |
| 29 | Importaciones | Despachos, cálculo CIF, IVA aduana, asiento |
| 30 | Importar | Asistente CSV/XML, mapeo columnas, validación, preview |
| 31 | Reportes | Sumas/Saldos, Mayor, Diario, Aging, exportación |
| 32 | Configuración | Perfil, IA, notificaciones, seguridad, apariencia |
| 33 | Auditoría | Log eventos, búsqueda, filtros, exportación, análisis IA |
| 34 | Superadmin | Empresas, planes, MRR, métricas, gestión global |
| 35 | Portal Cliente | Resumen, EE.FF., documentos, descargas |
| 36 | Offline/PWA | Instalación app, modo offline, sincronización |

---

*Fin del Manual de Usuario de InteliCont v1.0.0*
*Para soporte: soporte@intelicont.com | +595 21 123 456*
