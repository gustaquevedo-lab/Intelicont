# InteliCont — Manual de Usuario Completo

> **Versión:** 1.0.0  
> **Última actualización:** Julio 2026  
> **Sistema:** Contabilidad Inteligente para Paraguay  
> **Propósito:** Este manual está diseñado para que cualquier persona pueda aprender a usar InteliCont en su totalidad solo leyéndolo. Cada pantalla, botón, campo y flujo está explicado con detalle absoluto.

---

## 📑 Tabla de Contenidos

1. [¿Qué es InteliCont?](#1-qué-es-intelicont)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Requisitos y preparación](#3-requisitos-y-preparación)
4. [Pantalla de Login — Acceso al sistema](#4-pantalla-de-login--acceso-al-sistema)
5. [Onboarding — Primera configuración](#5-onboarding--primera-configuración)
6. [Interfaz principal — Mapa completo](#6-interfaz-principal--mapa-completo)
7. [Barra superior (TopBar)](#7-barra-superior-topbar)
8. [Barra lateral (Sidebar)](#8-barra-lateral-sidebar)
9. [Selector de empresa (Entity Switcher)](#9-selector-de-empresa-entity-switcher)
10. [Paleta de comandos (⌘K)](#10-paleta-de-comandos-k)
11. [Dashboard — Panel General](#11-dashboard--panel-general)
12. [Módulo Empresas](#12-módulo-empresas)
13. [Módulo SIFEN — Carga de facturas](#13-módulo-sifen--carga-de-facturas)
14. [Módulo SIFEN — Historial](#14-módulo-sifen--historial)
15. [Módulo SIFEN — Emitir comprobantes](#15-módulo-sifen--emitir-comprobantes)
16. [Módulo Comprobantes — Bandeja](#16-módulo-comprobantes--bandeja)
17. [Módulo Asientos Contables — Listado](#17-módulo-asientos-contables--listado)
18. [Módulo Asientos — Nuevo Asiento](#18-módulo-asientos--nuevo-asiento)
19. [Módulo Asientos — Detalle y reversión](#19-módulo-asientos--detalle-y-reversión)
20. [Módulo Plan de Cuentas](#20-módulo-plan-de-cuentas)
21. [Módulo Activos Fijos (Bienes de Uso)](#21-módulo-activos-fijos-bienes-de-uso)
22. [Módulo Terceros (Clientes/Proveedores)](#22-módulo-terceros-clientesproveedores)
23. [Módulo Bancos y Conciliación](#23-módulo-bancos-y-conciliación)
24. [Módulo Caja Chica](#24-módulo-caja-chica)
25. [Módulo Tesorería](#25-módulo-tesorería)
26. [Módulo Libro IVA](#26-módulo-libro-iva)
27. [Módulo Impuestos](#27-módulo-impuestos)
28. [Módulo Retenciones Tesaka](#28-módulo-retenciones-tesaka)
29. [Módulo Timbrados](#29-módulo-timbrados)
30. [Módulo Cierre de Períodos](#30-módulo-cierre-de-períodos)
31. [Módulo Estados Financieros](#31-módulo-estados-financieros)
32. [Módulo Calendario Fiscal](#32-módulo-calendario-fiscal)
33. [Módulo RG90](#33-módulo-rg90)
34. [Módulo Configuración](#34-módulo-configuración)
35. [Módulo Auditoría](#35-módulo-auditoría)
36. [Apéndice: Glosario de términos PY](#36-apéndice-glosario-de-términos-py)
37. [Apéndice: Solución de problemas](#37-apéndice-solución-de-problemas)
38. [Apéndice: Atajos de teclado](#38-apéndice-atajos-de-teclado)

---

## 1. ¿Qué es InteliCont?

InteliCont es un **sistema de contabilidad SaaS** (Software as a Service) diseñado específicamente para el **mercado paraguayo**. Está construido para estudios contables que manejan múltiples clientes (empresas) y necesitan cumplir con todas las obligaciones fiscales de la DNIT/SET.

### 1.1 Ecosistema Inteli*

InteliCont forma parte del ecosistema **Inteli\***, una suite de productos integrados:

| Producto | Función | Integración con InteliCont |
|---|---|---|
| **InteliCont** | Contabilidad general | — |
| **InteliAudit** | Auditoría externa | Envía hallazgos como asientos |
| **Sueldok** | RRHH y nómina | Envía asientos de liquidación de sueldos |
| **InteliMarket** | ERP comercial | Envía facturación, stock |

### 1.2 Filosofía y principios del sistema

1. **Doble partida estricta**: Cada asiento contable debe tener débitos = créditos, por moneda. El sistema valida esto automáticamente y NO permite postear un asiento desbalanceado.

2. **Libro inmutable**: Una vez que un asiento se "postea" (publica), NO se puede modificar ni eliminar. Jamás. Esto es obligatorio por normas contables y fiscales. Para corregir errores existen dos mecanismos:
   - **Reversión (contra-asiento)**: Invierte todos los débitos y créditos
   - **Ajuste (versión)**: Crea un asiento complementario

3. **Multi-tenant**: Una sola cuenta de usuario puede gestionar múltiples empresas. Cada empresa tiene su propio plan de cuentas, sus asientos, sus libros. Al cambiar de empresa en el selector, TODO el contexto cambia.

4. **AI-first (InteliAsistente)**: La inteligencia artificial sugiere asientos contables automáticamente cuando se importan facturas del SIFEN. Las sugerencias tienen un porcentaje de confianza y siempre requieren aprobación humana.

5. **Cumplimiento PY**: El sistema incorpora todas las reglas fiscales paraguayas:
   - Validación de RUC (formato + dígito verificador)
   - Validación de Timbrado (8 dígitos)
   - Validación de CDC (44 dígitos)
   - Cálculo de IVA 10%, 5% y exento
   - Cálculo de retenciones (IVA 50%, IVA 100%, IRE, IRP, INR)
   - Fechas de vencimiento según calendario DNIT
   - Generación de Hechauka (libro electrónico)
   - Generación de RG90 (conciliación de comprobantes)
   - Formularios 104 (IVA) y 501 (IRE)

### 1.3 Perfiles de usuario (Roles)

Cada usuario puede tener diferentes roles en diferentes empresas:

| Rol | Permisos |
|---|---|
| **Administrador** | Acceso TOTAL. Puede configurar la empresa, gestionar miembros, cerrar períodos, ver auditoría |
| **Contador** | Operativa contable completa. Crea/postea asientos, genera libros, calcula impuestos |
| **Asistente** | Operativa limitada. Puede cargar SIFEN, revisar comprobantes, consultar información |
| **Auditor** | Solo LECTURA de toda la información. No puede crear ni modificar nada |
| **Cliente** | Acceso al PORTAL DEL CLIENTE: ver balances, estados financieros, descargar reportes |

---

## 2. Arquitectura del sistema

### 2.1 Stack tecnológico

El sistema está construido con:

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI, Lucide icons |
| Estado | TanStack React Query, Zustand |
| API | tRPC (dentro de Next.js) |
| Base de datos | PostgreSQL 16 (Supabase) |
| ORM | Drizzle |
| Autenticación | Sistema propio con JWT + bcrypt + magic links |
| IA | Anthropic Claude, Google Gemini, o motor de reglas propio |
| Almacenamiento | S3 / Cloudflare R2 |
| Fondo de tareas | Inngest / Trigger.dev |

### 2.2 Estructura de navegación

```
Login (/login)
  → Onboarding (/onboarding) [solo primera vez]
    → Dashboard (/dashboard) [página principal]
      → Módulos desde la Sidebar o ⌘K
```

### 2.3 Convención de nombres

| Contexto | Convención | Ejemplo |
|---|---|---|
| Código fuente | camelCase en inglés | `createAsiento()` |
| Base de datos | snake_case, plural | `journal_entries` |
| Interfaz de usuario | Español paraguayo | "Asientos Contables" |
| Moneda | PYG (Guaraníes) por defecto | Gs. 1.000.000 |

---

## 3. Requisitos y preparación

### 3.1 Requisitos técnicos

| Requisito | Detalle |
|---|---|
| Navegador | Chrome 90+, Firefox 90+, Edge 90+, Safari 15+ |
| Conexión | Internet (con soporte offline limitado vía PWA) |
| Pantalla | Mínimo 1280×720 (recomendado 1920×1080) |
| Dispositivo | Desktop, laptop o tablet (responsive) |
| Email | Se necesita para recibir magic links e invitaciones |

### 3.2 ¿Qué necesito para empezar?

- Una **invitación** del administrador del estudio contable (recibida por email)
- O bien, si eres el **administrador**: registrarte y crear tu estudio

### 3.3 Tipos de cuenta

| Tipo | Descripción |
|---|---|
| **Estudio contable** | Gestiona múltiples empresas cliente. Tiene usuarios internos (contadores, asistentes) + clientes con acceso al portal |
| **Empresa individual** | Una sola empresa. Usuarios internos |

---

## 4. Pantalla de Login — Acceso al sistema

### 4.1 Mock completo de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│  ┌────────────────────────────────────────────┐  ┌──────────────────────────────────────┐    │
│  │  [Logo InteliCont]                         │  │                                      │    │
│  │  "Contabilidad Inteligente"                │  │     [Logo InteliCont]                 │    │
│  │  Ecosistema Inteli*                        │  │     (versión móvil)                   │    │
│  │                                            │  │                                      │    │
│  │  La contabilidad de tu estudio,            │  │     Accedé a tu estudio               │    │
│  │  automatizada de verdad.                   │  │     Recibí un enlace mágico en tu     │    │
│  │                                            │  │     email — sin contraseña.           │    │
│  │  ✅ Plan de cuentas DNIT estándar          │  │                                      │    │
│  │  ✅ Importación automática SIFEN           │  │  ┌──────────────────────────────┐    │    │
│  │  ✅ Hechauka y RG90 en un clic             │  │  │ [Magic Link] [Contraseña]   │    │    │
│  │  ✅ IA que sugiere asientos                │  │  └──────────────────────────────┘    │    │
│  │                                            │  │                                      │    │
│  │  © 2026 IntelliHouse · RUC 80144114-5      │  │  Email                               │    │
│  └────────────────────────────────────────────┘  │  ┌──────────────────────────────┐    │    │
│                                                  │  │ ✉️ [contador@estudio.com.py] │    │    │
│                                                  │  └──────────────────────────────┘    │    │
│                                                  │                                      │    │
│                                                  │  [✨ Enviar enlace mágico  →]        │    │
│                                                  │                                      │    │
│                                                  │  Te enviamos un enlace seguro por    │    │
│                                                  │  email. No necesitás recordar        │    │
│                                                  │  ninguna contraseña.                 │    │
│                                                  │                                      │    │
│                                                  │  ──────── o ────────                 │    │
│                                                  │                                      │    │
│                                                  │  ¿Todavía no tenés cuenta?           │    │
│                                                  │  [Contactá al estudio]              │    │
│                                                  │                                      │    │
│                                                  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Elementos de la pantalla

#### Panel izquierdo (solo desktop ≥ 1024px)

| Elemento | Tipo | Descripción |
|---|---|---|
| Logo | SVG | Logo de InteliCont con el infinito verde y azul |
| Título | Texto | "La contabilidad de tu estudio, automatizada de verdad." |
| Feature list | Lista con checks | 4 características principales del sistema |
| Footer | Texto | © 2026 IntelliHouse Soluciones E.A.S. · RUC 80144114-5 |

#### Panel derecho (formulario)

| Elemento | Tipo | Descripción |
|---|---|---|
| Mobile Logo | SVG | Solo visible en móvil (< 1024px) |
| Título | H1 | "Accedé a tu estudio" |
| Subtítulo | P | "Recibí un enlace mágico..." o "Ingresá con tu email y contraseña." |
| Mode Switcher | Toggle | Dos botones: "✨ Magic Link" y "🔒 Contraseña" |
| Campo Email | Input type="email" | Placeholder: "contador@estudio.com.py". Requerido. Autocomplete="email" |
| Campo Contraseña | Input type="password" | Solo visible en modo "Contraseña". Placeholder: "••••••••". Tiene botón 👁 para mostrar/ocultar |
| Link "Olvidaste tu contraseña" | Link | Solo visible en modo contraseña. Lleva a `/auth/forgot-password` |
| Botón Submit | Button | Texto dinámico según modo: "Enviar enlace mágico" o "Ingresar". Muestra spinner mientras carga |
| Mensaje de error | Alert | Fondo rojo, ícono ⚠️, texto del error. Se muestra cuando hay error |
| Mensaje de éxito | Alert | Fondo verde, ícono ✅, texto del éxito. Se muestra cuando se envió el magic link |
| Divider | Línea horizontal | "o" |
| Link de contacto | Link | "Contactá al estudio" → WhatsApp |

### 4.3 Paso a paso: Iniciar sesión con Magic Link

**Paso 1:** Abra el navegador y vaya a la URL de InteliCont

**Paso 2:** Verá la pantalla de login. Por defecto está seleccionado el modo **"Magic Link"** (el botón izquierdo del toggle aparece resaltado).

**Paso 3:** En el campo "Email", escriba su dirección de correo electrónico. Debe ser el mismo email con el que fue invitado al sistema.
- Formato válido: `nombre@dominio.com`
- El campo tiene validación de formato email (debe contener @ y dominio)
- Si el email no es válido, el navegador muestra un mensaje de error nativo

**Paso 4:** Haga clic en el botón **"Enviar enlace mágico"** (o presione Enter).

**Paso 5:** El botón cambia a mostrar un spinner giratorio y el texto "Enviando enlace...".

**Paso 6:** Una vez enviado, aparecerá un mensaje verde de éxito: "¡Listo! Revisá tu bandeja de entrada en [email]. El enlace expira en 1 hora."

**Paso 7:** Abra su bandeja de correo electrónico. Busque el email de InteliCont (asunto: "Tu enlace para acceder a InteliCont").

**Paso 8:** Haga clic en el enlace del email. Esto abrirá una nueva pestaña del navegador.

**Paso 9:** El sistema verificará el token. Si es válido, creará su sesión y lo redirigirá al Dashboard.

**Paso 10:** Si el enlace expiró (más de 1 hora), verá un mensaje de error: "El enlace expiró o es inválido. Solicitá uno nuevo." Vuelva al paso 3.

### 4.4 Paso a paso: Iniciar sesión con Contraseña

**Paso 1:** En la pantalla de login, haga clic en el botón **"Contraseña"** en el toggle superior.

**Paso 2:** El campo de contraseña aparece debajo del campo de email.

**Paso 3:** Ingrese su email.

**Paso 4:** Ingrese su contraseña.
- Si no la recuerda, haga clic en **"¿Olvidaste tu contraseña?"** (enlace debajo del campo)

**Paso 5:** Haga clic en **"Ingresar"**.

**Paso 6:** El sistema verifica las credenciales. Si son correctas, crea la sesión y redirige al Dashboard.

**Paso 7:** Si la contraseña es incorrecta, verá un mensaje de error rojo.

### 4.5 Estados de la pantalla

| Estado | Qué se ve | Qué hacer |
|---|---|---|
| **Idle** | Formulario vacío, botón activo | Ingresar email y enviar |
| **Loading** | Spinner en botón, "Enviando enlace..." | Esperar |
| **Success** | Mensaje verde "Enlace enviado" | Revisar email |
| **Error** | Mensaje rojo con descripción | Corregir el error y reintentar |
| **Callback error** | Mensaje rojo "Enlace expiró" al cargar | Solicitar nuevo magic link |

### 4.6 Validaciones

| Campo | Validación | Mensaje de error |
|---|---|---|
| Email | Formato email válido | El navegador muestra "Please include an @" |
| Email | No vacío | No se envía si está vacío |
| Contraseña | No vacía | No se envía si está vacía |
| Token magic link | Validez temporal (1 hora) | "El enlace expiró o es inválido" |

---

## 5. Onboarding — Primera configuración

### 5.1 Mock del asistente

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🚀 ¡Bienvenido a InteliCont!                   Paso 1 de 4                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                                                                      │    │
│  │  ¿Eres un estudio contable?                                          │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │ [○] Sí, soy un estudio contable                                │  │    │
│  │  │     → Gestionaré múltiples empresas                           │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │ [●] No, soy una empresa individual                             │  │    │
│  │  │     → Gestionaré solo mi empresa                              │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  [Salir]                                  [Continuar →]                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Pasos del onboarding

| Paso | Pantalla | Campos |
|---|---|---|
| **1/4** | Tipo de cuenta | Seleccionar: Estudio contable / Empresa individual |
| **2/4** | Datos del estudio | Razón social, RUC, nombre comercial, régimen tributario |
| **3/4** | Plan contable | Plantilla: PY Fiscal, NIIF, EEF, Mixto |
| **4/4** | Invitar equipo | Emails + roles de los primeros miembros |

### 5.3 ¿Qué se crea automáticamente?

Al completar el onboarding, el sistema crea:

1. **Su cuenta de usuario** (si ya no existía)
2. **Su primera empresa** (o estudio)
3. **Plan de cuentas completo** según la plantilla seleccionada
4. **Período fiscal corriente** (el mes actual, abierto)
5. **Configuraciones fiscales por defecto** (tasas de IVA, retenciones)

---

## 6. Interfaz principal — Mapa completo

### 6.1 Layout general

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Barra superior (TopBar) — Altura ~60px                                                              │
├──────────────────────────┬───────────────────────────────────────────────────────────────────────────┤
│                          │                                                                           │
│ ← Sidebar                │  ← Área de contenido                                                      │
│   (ancho: 256px)         │     (ocupa el resto de la pantalla)                                       │
│                          │                                                                           │
│  Gestión Principal       │  Aquí se renderiza la página activa:                                      │
│  ─────────────────       │  • Dashboard (panel general)                                              │
│  📊 Panel General        │  • Carga SIFEN (arrastrar XML)                                            │
│  📄 Carga SIFEN    [IA]  │  • Listado de asientos                                                    │
│  📄 Historial SIFEN      │  • Formulario de nuevo asiento                                           │
│  📁 Bandeja Comp.        │  • Plan de cuentas (árbol)                                                │
│  🏢 Empresas             │  • etc.                                                                   │
│                          │                                                                           │
│  Contabilidad            │                                                                           │
│  ─────────────────       │                                                                           │
│  📝 Asientos Contables   │                                                                           │
│  #📊 Plan de Cuentas     │                                                                           │
│  📖 Libros               │                                                                           │
│  📦 Bienes de Uso        │                                                                           │
│  🔒 Cierre Períodos      │                                                                           │
│  📈 Estados Financ.      │                                                                           │
│  👥 Clientes/Proveed.    │                                                                           │
│                          │                                                                           │
│  Tesorería y Finanzas    │                                                                           │
│  ─────────────────       │                                                                           │
│  💳 Conciliación Banc.   │                                                                           │
│  👛 Caja Chica           │                                                                           │
│  🪙 Órdenes de Pago      │                                                                           │
│                          │                                                                           │
│  Gestión Fiscal          │                                                                           │
│  ─────────────────       │                                                                           │
│  📅 Calendario Fiscal    │                                                                           │
│  📕 Libro IVA / RG90     │                                                                           │
│  🧮 Liquidación Imp.     │                                                                           │
│  📋 Retenciones Tesaka   │                                                                           │
│  🏷️ Timbrados/Autoimp.  │                                                                           │
│                          │                                                                           │
│  Soporte y Config.       │                                                                           │
│  ─────────────────       │                                                                           │
│  📊 Reportes Varios      │                                                                           │
│  🔍 Auditoría Contable   │                                                                           │
│  ⚙️ Mi Estudio            │                                                                           │
│  📖 Manual de Usuario    │                                                                           │
│  🔧 Superadmin SaaS      │                                                                           │
│                          │                                                                           │
│  [👤 IC] Contador        │                                                                           │
│  Administrador           │                                                                           │
│  [Cerrar Sesión]         │                                                                           │
├──────────────────────────┴───────────────────────────────────────────────────────────────────────────┤
│ ← Footer (barra de estado)                                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Elementos de la interfaz

| Elemento | Posición | Descripción |
|---|---|---|
| **TopBar** | Arriba, fixed (z-80) | Logo, buscador, selector de empresa, acciones (IA, tema, notificaciones, usuario) |
| **Sidebar** | Izquierda, fija | Navegación principal. 5 grupos con 24 ítems |
| **Área de contenido** | Centro | Donde se muestra la página activa |
| **Footer** | Abajo de la sidebar | Avatar del usuario, rol, botón de cerrar sesión |

### 6.3 Diseño responsive

| Pantalla | Sidebar | TopBar | Layout |
|---|---|---|---|
| ≥ 1024px (desktop) | Visible, fija, 256px | Completa | Sidebar + contenido |
| < 1024px (tablet/mobile) | Oculta, se abre con ☰ menú | Versión simplificada | Solo contenido |

---

## 7. Barra superior (TopBar)

### 7.1 Mock completo

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [☰] [Logo]  🔍 Buscar empresas, asientos...  ⌘K  │  🏢 Imp. del Este ▾  │  [🤖 IA] [🌙] [🔔3] [GA▾] │
│  <-- mobile -->                                    │    RUC 80012345-1     │                           │
│  [☰] [🔍]                                         │                      │                           │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Secciones de la TopBar

#### Sección izquierda

| Elemento | Visible en | Función |
|---|---|---|
| ☰ Menú hamburguesa | Mobile (< 1024px) | Abre/cierra la sidebar móvil |
| Logo | Mobile | Muestra el logo pequeño |
| Buscador | Desktop (≥ 640px) | Input de texto con lupa. Placeholder: "Buscar empresas, asientos, formularios..." |
| ⌘K badge | Desktop | Badge al final del buscador indicando el shortcut |
| 🔍 Lupa | Mobile | Botón que abre la paleta de comandos |

#### Sección central — Selector de empresa

| Elemento | Función |
|---|---|
| 🏢 Icono | Building, color primary |
| Nombre empresa | Texto truncado (max 140px), uppercase, bold |
| RUC | Texto pequeño debajo |
| ▾ Chevron | Indicador de dropdown |

#### Sección derecha — Acciones

| Elemento | Función | Comportamiento |
|---|---|---|
| 🤖 IA | Abre el panel de InteliAsistente | Fondo morado claro, texto "IA" |
| 🌙 / ☀️ / 🖥️ | Alterna entre temas | Abre dropdown con 3 opciones: Claro, Oscuro, Sistema |
| 🔔3 | Notificaciones | Muestra badge con cantidad de no leídas. Abre dropdown con lista |
| [GA] Avatar | Menú de usuario | Iniciales del usuario. Abre dropdown con Perfil, Config, Ayuda, Cerrar sesión |

### 7.3 Dropdown de notificaciones — Mock

```
┌──────────────────────────────────────────────────────────────────┐
│  Notificaciones                                    3 nuevas      │
├──────────────────────────────────────────────────────────────────┤
│  [🔴] IVA — Formulario 104                        7d            │
│       Imp. del Este — Vence en 7 días                            │
│  [🟡] Hechauka                                    20d           │
│       Imp. del Este — Presentación mensual                       │
│  [🔵] XML procesado                                               │
│       Factura 001-001-01145 — IA 94%                             │
│  [🟡] IRE — Formulario 1301                        10d           │
│       Tech Asunción — Vencimiento bimestral                      │
├──────────────────────────────────────────────────────────────────┤
│  [Marcar todo como leído]                                        │
└──────────────────────────────────────────────────────────────────┘
```

Cada notificación tiene:
- **Icono** con color según urgencia: 🔴 critical, 🟡 warning, 🔵 info
- **Título** en bold
- **Descripción** en gris
- **Días restantes** en rojo si es urgente
- **Link de acción** si corresponde
- Fondo azul claro si no está leída

### 7.4 Tipos de notificación

| Tipo | Urgencia | Descripción |
|---|---|---|
| `iva` | critical/warning | Vencimiento de IVA (Form. 104) |
| `ire` | warning | Vencimiento de IRE |
| `irp` | info | Vencimiento de IRP |
| `hechauka` | warning | Vencimiento de Hechauka |
| `sifen` | info | XML procesado por IA |
| `retencion` | info | Retención generada |
| `timbrado` | warning | Timbrado próximo a vencer |
| `cierre` | info | Cierre de período |
| `rg90` | info | Resultados de RG90 |

### 7.5 Dropdown de usuario

```
┌──────────────────────────────────────────┐
│  Gustavo A.                              │
│  gustavo@estudio.com.py                  │
├──────────────────────────────────────────┤
│  👤 Mi Perfil          → /configuracion  │
│  ⚙️ Configuración     → /configuracion  │
│  ❓ Ayuda              → manual          │
├──────────────────────────────────────────┤
│  🚪 Cerrar Sesión    (texto rojo)        │
└──────────────────────────────────────────┘
```

### 7.6 Dropdown de tema

```
┌──────────────────────────────────────────┐
│  Tema                                     │
├──────────────────────────────────────────┤
│  ☀️ Claro               ● (seleccionado) │
│  🌙 Oscuro                                │
│  🖥️ Sistema                              │
└──────────────────────────────────────────┘
```

El tema se guarda en `localStorage` como "intelicont-theme".

---

## 8. Barra lateral (Sidebar)

### 8.1 Mock completo de la sidebar expandida

```
┌──────────────────────────────────┐
│  [Logo InteliCont]               │
│  "Contabilidad Inteligente"      │
├──────────────────────────────────┤
│  🏢 Importadora del Este    ▾    │
│     RUC 80012345-1              │
├──────────────────────────────────┤
│                                  │
│  GESTIÓN PRINCIPAL               │
│  ───────────────────             │
│  📊 Panel General                │ ← activo si path=/
│  📄 Carga SIFEN            [IA]  │ ← badge IA
│  📄 Historial SIFEN              │
│  📁 Bandeja Comprobantes         │
│  🏢 Empresas                    │
│                                  │
│  CONTABILIDAD                    │
│  ───────────────────             │
│  📝 Asientos Contables           │
│  #📊 Plan de Cuentas             │
│  📖 Libros Diarios/Mayores       │
│  📦 Bienes de Uso               │
│  🔒 Cierre de Períodos           │
│  📈 Estados Financieros          │
│  👥 Clientes / Proveedores       │
│                                  │
│  TESORERÍA Y FINANZAS            │
│  ───────────────────             │
│  💳 Conciliación Bancaria        │
│  👛 Caja Chica                   │
│  🪙 Órdenes de Pago              │
│                                  │
│  GESTIÓN FISCAL                  │
│  ───────────────────             │
│  📅 Calendario Fiscal            │
│  📕 Libro IVA / RG90             │
│  🧮 Liquidación Impuestos        │
│  📋 Retenciones Tesakã           │
│  🏷️ Timbrados y Autoimp.        │
│                                  │
│  SOPORTE Y CONFIGURACIÓN         │
│  ───────────────────             │
│  📊 Reportes Varios              │
│  🔍 Auditoría Contable           │
│  ⚙️ Mi Estudio                   │
│  📖 Manual de Usuario            │
│  🔧 Superadmin SaaS              │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ [IC]   Contador            │  │
│  │        Administrador       │  │
│  └────────────────────────────┘  │
│  [🚪 Cerrar Sesión]              │
└──────────────────────────────────┘
```

### 8.2 Elementos de la sidebar

| Elemento | Descripción |
|---|---|
| **Logo** | Logo SVG con nombre y slogan |
| **Entity Switcher** | Botón con nombre de empresa actual y RUC. Al hacer clic, abre dropdown para cambiar de empresa |
| **Grupos de navegación** | 5 grupos. Cada grupo tiene título y lista de ítems |
| **Ítems de navegación** | Icono + label. Si la ruta coincide con la actual, se resalta con fondo blanco y texto azul |
| **Badge IA** | Badge "IA" en el ítem "Carga SIFEN" indicando que tiene inteligencia artificial |
| **Footer** | Avatar con iniciales, nombre del usuario, rol, botón de cerrar sesión |

### 8.3 Estados de navegación

| Estado | Apariencia |
|---|---|
| **Inactivo** | Texto azul claro (text-blue-100/60), hover: fondo semi-transparente blanco |
| **Activo (ruta actual)** | Fondo blanco, texto primary (azul), escala 1.02, sombra |

### 8.4 Sidebar colapsada (modo iconos)

Cuando el usuario colapsa la sidebar (escritorio), solo se ven los iconos (72px de ancho). Los tooltips muestran el nombre al hacer hover.

---

## 9. Selector de empresa (Entity Switcher)

### 9.1 Mock del dropdown

El selector de empresa está disponible tanto en la TopBar como en la Sidebar.

```
┌─────────────────────────────────────┐
│  Cambiar Empresa                     │
├─────────────────────────────────────┤
│                                     │
│  🏢 Importadora del Este      ✓     │ ← empresa activa (check)
│     RUC 80012345-1                  │
│                                     │
│  🏢 Tech Asunción S.A.             │
│     RUC 80123456-3                  │
│                                     │
│  🏢 Distribuciones Ñandutí         │
│     RUC 80234567-5                  │
│                                     │
│  🏢 Comercial ABC S.A.             │
│     RUC 80345678-7                  │
│                                     │
├─────────────────────────────────────┤
│  ➕ Nueva Empresa                   │
└─────────────────────────────────────┘
```

### 9.2 Comportamiento

- Al hacer clic en una empresa, se guarda en `localStorage` y en una cookie
- La página se recarga (`window.location.reload()`)
- Todo el contexto cambia: dashboard, asientos, cuentas, libros
- La empresa activa tiene un checkmark ✓ y fondo resaltado

---

## 10. Paleta de comandos (⌘K)

### 10.1 Mock completo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔍 Buscar páginas, acciones, configuraciones...                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ◆  Navegación                                                                │
│     📊 Panel General                                                         │
│     📄 Carga SIFEN                                             ⌘1           │
│     📄 Historial SIFEN                                                        │
│     📁 Bandeja Comprobantes                                                   │
│     🏢 Empresas                                                              │
│     📝 Asientos Contables                                                     │
│     #📊 Plan de Cuentas                                                      │
│     📖 Libros Diarios/Mayores                                                │
│     📦 Bienes de Uso                                                         │
│     🔒 Cierre de Períodos                                                    │
│     📈 Estados Financieros                                                   │
│     👥 Clientes / Proveedores                                                │
│     💳 Conciliación Bancaria                                                 │
│     👛 Caja Chica                                                            │
│     🪙 Órdenes de Pago                                                       │
│     📅 Calendario Fiscal                                                     │
│                                                                               │
│  ◆  Acciones rápidas                                                          │
│     ➕ Nuevo Asiento                                                          │
│     ➕ Nueva Empresa                                                          │
│     📤 Importar CSV                                                           │
│                                                                               │
│  ◆  Configuración                                                             │
│     ⚙️ Tema Oscuro                                                           │
│     🚪 Cerrar sesión                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Cómo usarla

| Acción | Resultado |
|---|---|
| `⌘K` (Mac) o `Ctrl+K` (Windows/Linux) | Abre la paleta |
| Escribir texto | Filtra resultados en tiempo real |
| `↑` `↓` | Navega entre resultados |
| `Enter` | Abre la opción seleccionada |
| `Esc` | Cierra la paleta |

Se pueden buscar términos parciales. Ej: "sif" → encuentra "Carga SIFEN" e "Historial SIFEN".

---

## 11. Dashboard — Panel General

### 11.1 Mock completo

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ Sistema Contable Inteligente                                                                        │
│  IMPORTADORA DEL ESTE                                                                                  │
│  mayo 2026 · RUC 80012345-1                                   [📤 Importar]        [➕ Nuevo Asiento]  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ Saldo IVA       │  │ Ingresos Mayo   │  │ SIFEN Pendientes│  │ Próx. Vencim.  │                    │
│  │ a Favor         │  │                 │  │                 │  │                │                    │
│  │                 │  │                 │  │                 │  │                │                    │
│  │ Gs. 2.5M        │  │ Gs. 31.1M      │  │ 4               │  │ 12 May          │                    │
│  │                 │  │                 │  │                 │  │                │                    │
│  │ Crédito Fiscal  │  │ Basado en       │  │ Gs. 6.4M total  │  │ IVA - Form 104 │                    │
│  │           ▲ 5%  │  │ facturación  ▲12│  │                 │  │                │                    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘                    │
│                                                                                                         │
│  ┌──────────────────────────────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │  Evolución de IVA                                        │  │  📅 Vencimientos                   │  │
│  │  Débito vs Crédito mensual                               │  │                                    │  │
│  │                                                          │  │  🔴 IVA — Form. 104               │  │
│  │  Gs. 6M ┤  ██                                           │  │     Importadora del Este          │  │
│  │  Gs. 4M ┤  ██ ██                                        │  │     ███████████░░░░░░░░░   7d     │  │
│  │  Gs. 2M ┤  ██ ██ ██  ██                                 │  │                                    │  │
│  │  Gs. 0  ┤──●──●──●──●──●──                              │  │  🟡 Hechauka                      │  │
│  │         │  Ene Feb Mar Abr May                           │  │     Importadora del Este          │  │
│  │                                                          │  │     █████░░░░░░░░░░░░░░░  20d     │  │
│  │  ● Débito (IVA Ventas)  ● Crédito (IVA Compras)          │  │                                    │  │
│  │                                                          │  │  🟡 IRE — Form. 1301              │  │
│  │  Accesos rápidos:                                        │  │     Tech Asunción                 │  │
│  │  [🧾] [📕] [🧮] [💳] [👛] [🚢] [🪙]                     │  │     ██████░░░░░░░░░░░░   10d     │  │
│  │  Fact.  Libros Imp.  Bcos  Caja  Imp.  Teso.             │  │                                    │  │
│  │                                                          │  │  🟡 Retenciones IRP               │  │
│  │                                                          │  │     Dist. Ñandutí                 │  │
│  │                                                          │  │     ████░░░░░░░░░░░░░░░   15d     │  │
│  │                                                          │  │                                    │  │
│  │                                                          │  │  [📅 Ver Calendario Fiscal →]     │  │
│  │                                                          │  ├────────────────────────────────────┤  │
│  │                                                          │  │  ✨ InteliInsights                 │  │
│  │                                                          │  │  Hemos detectado 4 nuevas          │  │
│  │                                                          │  │  facturas en el portal SIFEN que   │  │
│  │                                                          │  │  coinciden con gastos recurrentes. │  │
│  │                                                          │  │  ¿Deseas procesar los asientos?    │  │
│  │                                                          │  │                                    │  │
│  │                                                          │  │  [🤖 Revisar Ahora]              │  │
│  └──────────────────────────────────────────────────────────┘  └────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Header del Dashboard

| Elemento | Descripción |
|---|---|
| ⚡ Sistema Contable Inteligente | Tagline en azul, uppercase, tracking widest |
| **IMPORTADORA DEL ESTE** | Nombre de la empresa activa. Fuente grande (3xl), bold. Fuente: tradeName o legalName |
| mayo 2026 · RUC 80012345-1 | Fecha actual + RUC de la empresa |
| 📤 **Importar** | Botón que abre el asistente de importación |
| ➕ **Nuevo Asiento** | Botón primary que lleva a `/asientos/nuevo` |

### 11.3 Tarjetas KPI

Cada KPI es una tarjeta con gradiente de fondo, icono, valor grande y tendencia.

| KPI | Datos que muestra | Variant | Interpretación |
|---|---|---|---|
| **Saldo IVA a Favor** | Gs. 2.5M + tendencia ▲ 5% | secondary (verde) | Crédito fiscal − Débito fiscal. Positivo = crédito a favor |
| **Ingresos Mayo** | Gs. 31.1M + tendencia ▲ 12% | primary (azul) | Facturación del mes basada en comprobantes |
| **SIFEN Pendientes** | 4 documentos, Gs. 6.4M total | accent (ámbar) | Facturas importadas pendientes de contabilizar |
| **Próx. Vencimiento** | 12 May, IVA Form 104 | neutral (gris) | Próxima fecha límite fiscal |

**Estructura de una KPI Card:**
1. Título (texto pequeño, uppercase, gris)
2. Icono decorativo en círculo de color
3. Valor grande (text-3xl, font-black)
4. Badge de tendencia (▲ = positivo, ▼ = negativo) con porcentaje
5. Subtítulo descriptivo

### 11.4 Gráfico "Evolución de IVA"

- **Tipo**: Gráfico de barras (Recharts)
- **Datos**: 6 meses (Ene a Jun 2026)
- **Series**: Débito (azul) y Crédito (verde)
- **Tooltip**: Al hacer hover sobre una barra, muestra los valores exactos en Gs.
- **Eje Y**: Formateado en millones (1M, 2M, etc.)
- **Eje X**: Meses abreviados (Ene, Feb, etc.)

### 11.5 Accesos rápidos (Shortcut Cards)

7 tarjetas que linkean a los módulos más usados:

| # | Icono | Label | Ruta | Color |
|---|---|---|---|---|
| 1 | 🧾 Receipt | Facturación | `/sifen` | primary |
| 2 | 📕 BookOpen | Libros IVA | `/libros` | secondary |
| 3 | 🧮 Calculator | Impuestos | `/impuestos` | amber |
| 4 | 💳 CreditCard | Bancos | `/banco` | primary |
| 5 | 👛 Wallet | Caja Chica | `/caja-chica` | secondary |
| 6 | 🚢 Ship | Importación | `/importaciones` | primary |
| 7 | 🪙 Coins | Tesorería | `/tesoreria` | amber |

### 11.6 Vencimientos (Deadlines)

Lista de obligaciones fiscales próximas:

| Elemento | Descripción |
|---|---|
| Badge | Label con fondo rojo (urgente) o gris (normal) |
| Nombre | "IVA — Form. 104" |
| Empresa | Nombre de la entidad afectada |
| Barra de progreso | Visualiza los días restantes |
| Días | "7d", "20d", etc. |
| Link "Ver Calendario Fiscal" | Al final de la lista, lleva a `/calendario` |

### 11.7 InteliInsights (Feed de IA)

| Elemento | Descripción |
|---|---|
| Icono | ✨ Sparkles en círculo primary |
| Título | InteliInsights |
| Subtítulo | "Asistente de Inteligencia" |
| Card de sugerencia | Texto con detalle + botón "Revisar Ahora" |
| Feed de actividad | Lista de eventos recientes (asientos posteados, XML procesados, vencimientos) |

---

## 12. Módulo Empresas

### 12.1 Mock del listado

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Empresas                                              [➕ Nueva Empresa]    │
│  Gestiona las empresas de tu estudio                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─ Formulario de nueva empresa (visible al hacer clic en "+") ──────────┐   │
│  │  ✕ Nueva Empresa                                                      │   │
│  │                                                                        │   │
│  │  RUC* [_______________]      Razón Social* [______________________]    │   │
│  │  Nombre Comercial [________]  Régimen Tributario* [▼                 ] │   │
│  │  Dirección [________________]  Email [_____________________________]   │   │
│  │                                                                        │   │
│  │                         [Cancelar]  [Crear Empresa]                   │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 [Buscar empresa..._________________________________  ]  [Filtros]│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  🏢 Importadora del Este S.A.                                      Activa││
│  │     Importadora del Este                                                 ││
│  │     RUC: 80012345-1 • Renta General                                     ││
│  │                                                    [✏️] [⋮]             ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  🏢 Tech Asunción S.A.                                            Activa││
│  │     Tech Asunción                                                       ││
│  │     RUC: 80123456-3 • Renta Simple                                     ││
│  │                                                    [✏️] [⋮]             ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │  🏢 Distribuciones Ñandutí                                        Activa││
│  │     Dist. Ñandutí                                                        ││
│  │     RUC: 80234567-5 • Renta General                                    ││
│  │                                                    [✏️] [⋮]             ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Mostrando 3 empresas                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Elementos del listado

| Elemento | Descripción |
|---|---|
| 🔍 Search | Input con lupa, filtra por nombre, RUC o nombre comercial |
| Filtros | Botón para filtros avanzados (por régimen, estado) |
| Cada empresa | Icono 🏢 + razón social + nombre comercial + RUC + régimen |

### 12.3 Formulario de nueva empresa — Todos los campos

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| **RUC** | Text | Sí | Formato XXXXXXXX-X. Validación de dígito verificador |
| **Razón Social** | Text | Sí | No vacío |
| **Nombre Comercial** | Text | No | — |
| **Régimen Tributario** | Select | Sí | Opciones: IVA General / IRE General, IVA General / IRE Simple, ReSimple, Exportador |
| **Dirección** | Text | No | — |
| **Email** | Email | No | Formato email válido |

### 12.4 Estados del listado

| Estado | Qué se ve |
|---|---|
| **Loading** | Spinner circular + "Cargando empresas..." |
| **Empty** | Icono 🏢 grande + "No se encontraron empresas" |
| **Populated** | Lista con empresas |
| **Search no results** | "No se encontraron empresas" (con filtro activo) |

---

## 13. Módulo SIFEN — Carga de facturas

### 13.1 Mock — Estado inicial (upload)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📄 Carga de Facturas SIFEN                                                  │
│  Arrastra archivos XML de facturas electrónicas paraguayas.                  │
│  La IA sugerirá el asiento contable automáticamente.      [🕐 Bandeja (0)]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │                         ┌────────────────┐                           │   │
│  │                         │   📄 FileCode  │                           │   │
│  │                         └────────────────┘                           │   │
│  │                                                                      │   │
│  │              Arrastrá tus archivos XML aquí                          │   │
│  │         o hacé clic para seleccionar — múltiples archivos           │   │
│  │                                                                      │   │
│  │                    [.xml] Facturas SIFEN — DNIT Paraguay             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [✨ Probar con factura de demostración]                                     │
│                                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                             │
│  │ 📄 Parseo  │  │ ✨ Asiento │  │ ✅ Revisión│                             │
│  │ automático │  │inteligente │  │   humana   │                             │
│  │ Extrae CDC,│  │Genera auto│  │Verificá y  │                             │
│  │ timbrado,  │  │débitos y  │  │aprobá antes│                             │
│  │ montos     │  │créditos   │  │de publicar │                             │
│  └────────────┘  └────────────┘  └────────────┘                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Mock — Estado de revisión

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← [ArrowLeft]  Revisar Factura SIFEN              [✅ Aprobar y Publicar]   │
│                   Verificar datos y aprobar asiento sugerido por IA          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─ DATOS DE LA FACTURA ───────────────────┐  ┌─ ASIENTO SUGERIDO POR IA ──┐ │
│  │                                          │  │                            │ │
│  │  🧾 Número    001-001-00234              │  │  Empresa destino:          │ │
│  │  📅 Fecha     2026-05-01                 │  │  [▼ Importadora del Este ▼]│ │
│  │  🏢 Emisor    ImportEste                 │  │                            │ │
│  │  💳 Condición Crédito                    │  │  Cuenta       Débito Créd. │ │
│  │                                          │  │  ───────────────────────── │ │
│  │  Desglose de Montos                      │  │  1.2.01 Mercad.  10.000M   │ │
│  │  Gravado 10%      10.000.000             │  │  1.1.06 IVA CF   1.000M   │ │
│  │  IVA 10%           1.000.000             │  │  2.1.01 Prove.         11M│ │
│  │  Total             11.000.000             │  │  ───────────────────────── │ │
│  │                                          │  │  TOTALES     11M     11M   │ │
│  │  ▼ 0 ítems (expandir para ver)          │  │  ✓ Balanceado     Score 94%│ │
│  │                                          │  │                            │ │
│  └──────────────────────────────────────────┘  │  El XML corresponde a una │ │
│                                                │  compra de mercaderías con │ │
│                                                │  IVA 10%. Se sugiere débito│ │
│                                                │  a compras y crédito fiscal│ │
│                                                └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 13.3 Mock — Estado de éxito

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                         ┌──────────────┐                                     │
│                         │   ✅ Check   │                                     │
│                         └──────────────┘                                     │
│                                                                               │
│                    Asiento Publicado                                          │
│         La factura 001-001-00234 fue procesada y el asiento                  │
│         contable fue creado exitosamente.                                    │
│                                                                               │
│  ┌──────────────────────────────────────────┐                               │
│  │  Proveedor: ImportEste                   │                               │
│  │  Total:     ₲ 11.000.000                 │                               │
│  │  Líneas:    3                            │                               │
│  └──────────────────────────────────────────┘                               │
│                                                                               │
│  [📤 Cargar otra]          [📝 Ver Asientos →]                               │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 13.4 Elementos — Pantalla de carga

| Elemento | Tipo | Descripción |
|---|---|---|
| Zona de drop | Área clickeable | Arrastrar XML o hacer clic para seleccionar |
| Input file oculto | `<input type="file" accept=".xml" multiple>` | Soporta múltiples archivos |
| Botón demo | Button | "Probar con factura de demostración" — carga un XML de ejemplo |
| Info cards | 3 tarjetas | Parseo automático, Asiento inteligente, Revisión humana |

### 13.5 Elementos — Pantalla de revisión

| Sección | Elementos |
|---|---|
| **Datos de factura** | Número, Fecha, Emisor, Condición, Desglose de montos (Gravado 10%, IVA 10%, Total), Botón expandir ítems |
| **Asiento sugerido** | Selector de empresa, Tabla de líneas (Cuenta, Débito, Crédito), Badge de balance, Score de confianza, Razonamiento de IA |

### 13.6 El proceso completo paso a paso

**Escenario: Importar una factura de compra desde XML SIFEN**

**Paso 1:** Vaya a Gestión Principal → Carga SIFEN (o `/sifen`)

**Paso 2:** Verá la zona de carga con borde punteado.

**Paso 3:** Arrastre un archivo XML desde su computadora y suéltelo en la zona. Alternativamente, haga clic en la zona y seleccione el archivo.

**Paso 4:** Mientras se procesa, verá un spinner "Procesando factura... Extrayendo datos y generando asiento con IA".

**Paso 5:** El sistema analiza el XML:
   - Extrae el CDC (44 dígitos), timbrado, RUC del emisor, fecha, montos
   - Valida el formato y la integridad
   - Cruza el RUC del proveedor con su base de datos de terceros

**Paso 6:** Pasa automáticamente a la pantalla de **Revisión**.

**Paso 7:** Revise los datos de la factura en el panel izquierdo:
   - Confirme que el número, fecha y montos sean correctos
   - Expanda "▼ 0 ítems" para ver el detalle de cada línea

**Paso 8:** Revise el asiento sugerido por la IA en el panel derecho:
   - **Score de confianza**: 94% (verde = alto, amarillo = medio, rojo = bajo)
   - **Líneas del asiento**: Cuenta contable + débito + crédito
   - **Balance**: ✓ Balanceado (débitos = créditos)
   - **Razonamiento**: Texto explicativo de por qué se sugirió ese asiento

**Paso 9:** Seleccione la **Empresa destino** (si tiene varias empresas, seleccione a cuál pertenece esta factura).

**Paso 10:** Tome una decisión:

| Opción | Botón | Resultado |
|---|---|---|
| **Aprobar y Publicar** | Verde, arriba a la derecha | Crea el asiento contable en estado "posted" y vincula el comprobante |
| **Rechazar** | No visible en esta pantalla (ir a Bandeja) | Descarta la sugerencia, el comprobante queda como pendiente |
| **Editar** | No visible en esta pantalla (ir a Bandeja) | Modifica las cuentas antes de postear |

**Paso 11:** Si hace clic en **"Aprobar y Publicar"**:
   - El botón muestra spinner "Procesando..."
   - El sistema crea el asiento en el libro diario
   - La factura queda vinculada al asiento
   - Aparece la pantalla de **éxito** con resumen

**Paso 12:** Desde la pantalla de éxito puede:
   - **"Cargar otra"**: Volver a la zona de carga para otra factura
   - **"Ver Asientos →"**: Ir al listado de asientos para ver el resultado

### 13.7 ¿Qué pasa si cargo múltiples XML a la vez?

Si selecciona o arrastra múltiples archivos, el sistema los procesa **secuencialmente** (uno por uno). Cada uno se analiza y se muestra en la pantalla de revisión. Al aprobar uno, puede cargar el siguiente.

### 13.8 Validaciones del XML SIFEN

| Validación | Qué verifica | Si falla |
|---|---|---|
| Formato XML | Que sea XML válido del SIFEN | Error "Formato inválido" |
| CDC (44 dígitos) | Que tenga 44 caracteres, que el RUC interno sea válido | Error "CDC inválido" |
| Timbrado (8 dígitos) | Que sea numérico de 8 dígitos | Error "Timbrado inválido" |
| Fecha de emisión | Que no sea futura, que no sea anterior a 2022 | Error "Fecha fuera de rango" |
| Montos | Que Gravado + IVA = Total | Error "Inconsistencia en montos" |

### 13.9 Estados del procesamiento

| Estado | Descripción |
|---|---|
| **upload** | Pantalla de carga, esperando archivo |
| **review** | Datos extraídos, esperando aprobación |
| **success** | Asiento creado exitosamente |

---

## 14. Módulo SIFEN — Historial

### 14.1 Mock

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📄 Historial SIFEN                                         [📤 Exportar]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar por CDC/factura...]  Empresa: [Todas ▼]  Estado: [Todos ▼]      │
│  Desde: [📅 01/05/2026]  Hasta: [📅 31/05/2026]                              │
│                                                                               │
│  ☐ │ Documento      │ Proveedor     │ Fecha    │ Total     │ Estado      │JE │
│  ───┼────────────────┼───────────────┼──────────┼───────────┼─────────────┼───│
│  ☐ │ 001-001-012345 │ Dist. ABC     │ 03/05/26 │ Gs. 6.1M  │ ✅ Contab.  │028│
│  ☐ │ 001-004-067890 │ Ferretería XYZ│ 02/05/26 │ Gs. 2.3M  │ 🟡 Pend.    │ — │
│  ☐ │ 001-001-054321 │ Tigo          │ 28/04/26 │ Gs. 850K  │ ✅ Contab.  │025│
│  ☐ │ 001-001-098765 │ ANDE          │ 15/04/26 │ Gs. 1.2M  │ ❌ Error    │ — │
│                                                                               │
│  [✓ Aprobar sel.]  [✕ Rechazar sel.]              Mostrando 1-4 de 47       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Columnas del historial

| Columna | Descripción |
|---|---|
| ☐ | Checkbox para selección múltiple |
| **Documento** | Número de factura (001-001-XXXXX) o CDC |
| **Proveedor** | Nombre del emisor |
| **Fecha** | Fecha de emisión |
| **Total** | Importe total del documento |
| **Estado** | Contabilizado / Pendiente / Error / Analizando |
| **JE** | Número del asiento contable vinculado (si existe) |

### 14.3 Estados posibles

| Estado | Acción disponible |
|---|---|
| ✅ **Contabilizado** | Ver asiento vinculado |
| 🟡 **Pendiente** | Aprobar / Rechazar |
| ❌ **Error** | Ver detalle del error, reimportar |
| ⏳ **Analizando** | Esperar a que termine el procesamiento |

---

## 15. Módulo SIFEN — Emitir comprobantes

### 15.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📤 Emitir Comprobante SIFEN                              [✕ Cerrar]        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Tipo de comprobante:                                                        │
│  ┌─────────────────────────────────────────────────┐                         │
│  │ ● Factura Electrónica  ○ Nota de Crédito         │                         │
│  │ ○ Nota de Débito       ○ Autofactura             │                         │
│  └─────────────────────────────────────────────────┘                         │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Datos del comprobante                                               │    │
│  │                                                                      │    │
│  │  Timbrado:      [________]  (8 dígitos)    [🔍 Validar]             │    │
│  │  Punto de Exp.: [________]  Ej: 001                                 │    │
│  │  Número inicio: [________]  Ej: 00001234                             │    │
│  │  Fecha emisión: [📅 27/07/2026]                                     │    │
│  │                                                                      │    │
│  │  Cliente:                                                               │    │
│  │  ┌──────────────────────────────────────────────────────────────┐      │    │
│  │  │ [🔍 Buscar tercero...]     ○ Nuevo                         │      │    │
│  │  │                                                              │      │    │
│  │  │  RUC: 8.014.411-5    Nombre: Estudio ABC S.A.               │      │    │
│  │  │  Dirección: Av. Mariscal López 1234, Asunción               │      │    │
│  │  └──────────────────────────────────────────────────────────────┘      │    │
│  │                                                                      │    │
│  │  Moneda: ○ PYG  ● USD  Tipo de cambio: [7.450,00]  (fecha: 27/07)   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Items del comprobante                                                │    │
│  │                                                                       │    │
│  │  # │ Descripción            │ Cant. │ Precio Unit. │ IVA │ Subtotal │   │
│  │  ──┼────────────────────────┼───────┼──────────────┼─────┼──────────│   │
│  │  1 │ Servicio de consultoría│   1   │ 5.000.000    │ 10% │ 5.000.000│   │
│  │  2 │ Material didáctico     │   3   │   350.000    │  5% │ 1.050.000│   │
│  │    │                        │       │              │     │          │   │
│  │  [+ Agregar item]                                                      │   │
│  │                                                                        │   │
│  │  ─────────────────────────────────────────────────────────               │   │
│  │  Subtotal gravado 10%:       Gs. 5.000.000                               │   │
│  │  Subtotal gravado 5%:        Gs. 1.050.000                               │   │
│  │  Subtotal exento:            Gs. 0                                        │   │
│  │  IVA 10%:                    Gs. 500.000                                  │   │
│  │  IVA 5%:                     Gs. 52.500                                    │   │
│  │  ─────────────────────────────────────────────────────────               │   │
│  │  TOTAL:                      Gs. 6.602.500                                │   │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  [💾 Guardar borrador]  [📤 Emitir comprobante  →]                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Sección: Tipo de comprobante

| Campo | Opciones | Descripción |
|---|---|---|
| **Factura Electrónica** | Radio | Comprobante de venta estándar |
| **Nota de Crédito** | Radio | Anula total o parcialmente una factura |
| **Nota de Débito** | Radio | Incrementa el monto de una factura existente |
| **Autofactura** | Radio | Factura emitida por el comprador (régimen especial) |

### 15.3 Sección: Datos del comprobante

| Campo | Tipo | Validación |
|---|---|---|
| **Timbrado** | Input text (8 dígitos) | Requerido. Exactamente 8 dígitos numéricos. Al perder foco se valida contra DB |
| **Punto de Exp.** | Input text (3 dígitos) | Requerido. Formato 001-003 |
| **Número inicio** | Input text (8 dígitos) | Requerido. Debe ser correlativo al anterior |
| **Fecha emisión** | Date picker | Requerido. No puede ser futuro. No puede ser anterior a timbrado |
| **Cliente** | Autocomplete + botón "Nuevo" | Busca en terceros existentes o permite crear uno nuevo |
| **Moneda** | Radio PYG/USD | Si USD, se activa campo tipo de cambio |
| **Tipo de cambio** | Input numérico | Solo si moneda USD. Se auto-completa con la cotización del día |

### 15.4 Sección: Items del comprobante

Cada item tiene:

| Campo | Tipo | Descripción |
|---|---|---|
| **Descripción** | Text | Detalle del producto o servicio |
| **Cantidad** | Number | Unidades (mínimo 1, decimales permitidos) |
| **Precio Unitario** | Number | Precio por unidad, en la moneda del comprobante |
| **IVA** | Select | 10% / 5% / Exento |
| **Subtotal** | Calculado | Cantidad × Precio Unitario (automático) |

### 15.5 Totales

El sistema calcula automáticamente:
- **Subtotal gravado 10%**: Suma de items con IVA 10%
- **Subtotal gravado 5%**: Suma de items con IVA 5%
- **Subtotal exento**: Suma de items con IVA exento
- **IVA 10%**: 10% del subtotal gravado 10%
- **IVA 5%**: 5% del subtotal gravado 5%
- **TOTAL**: Suma de todos los subtotales + IVAs

### 15.6 Botones de acción

| Botón | Acción |
|---|---|
| **Guardar borrador** | Guarda el comprobante como borrador (no emitido aún). Se puede retomar después desde Historial |
| **Emitir comprobante** | Valida todos los campos, firma digitalmente con el CDC, envía al SIFEN si corresponde, guarda en el historial |

### 15.7 Paso a paso: Emitir una factura electrónica

**Paso 1:** Haga clic en **SIFEN** en la Sidebar, luego en la pestaña **"Emitir"**.

**Paso 2:** Seleccione **"Factura Electrónica"** (viene seleccionado por defecto).

**Paso 3:** Complete el campo **Timbrado** con los 8 dígitos del timbrado autorizado. Haga clic en **"Validar"** para confirmar que está activo.

**Paso 4:** Ingrese **Punto de Exp.** (ej: 001) y **Número inicio** (correlativo).

**Paso 5:** Seleccione la **Fecha de emisión** con el calendario.

**Paso 6:** En el campo **Cliente**, comience a escribir el nombre o RUC. El sistema muestra resultados coincidentes. Si el cliente no existe, haga clic en "Nuevo" y complete sus datos.

**Paso 7:** Seleccione la **Moneda**. Si elige USD, verifique que el tipo de cambio sea correcto.

**Paso 8:** En la sección **Items**, haga clic en **"+ Agregar item"**.

**Paso 9:** Complete descripción, cantidad, precio unitario y seleccione la tasa de IVA. El subtotal se calcula automáticamente.

**Paso 10:** Repita para cada item. La sección de totales se actualiza en tiempo real.

**Paso 11:** Revise todos los datos. Si no va a emitir ahora, haga clic en **"Guardar borrador"**.

**Paso 12:** Para emitir, haga clic en **"Emitir comprobante"**. El sistema valida todo, genera el CDC, firma digitalmente y registra el comprobante.

**Paso 13:** Verá el comprobante emitido con su CDC. Puede descargar el XML y el KuDE (representación gráfica).

### 15.8 Estados de emisión

| Estado | Descripción |
|---|---|
| **Borrador** | Guardado pero no emitido. Se puede editar y emitir después |
| **Emitido** | Comprobante emitido y registrado. No se puede modificar |
| **Rechazado** | El SIFEN rechazó el comprobante (ej: timbrado inválido). Ver detalle del error |
| **Anulado** | Comprobante anulado con nota de crédito |

---

## 16. Módulo Comprobantes — Bandeja

La bandeja de comprobantes es la cola de procesamiento donde los documentos del SIFEN esperan ser clasificados, revisados y convertidos en asientos contables. Es el "centro de comando" diario del contador.

### 16.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 Bandeja de Comprobantes         [Filtrar ▼] [📤 Exportar] [🔄 Sync SIFEN]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍  [Buscar por RUC, nombre, CDC...]    Estado: [Pendientes ▼]              │
│  Desde: [📅 01/06/2026]    Hasta: [📅 27/07/2026]   Empresa: [Todas ▼]      │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ 📄 001-001-012345 │ Dist. ABC S.A.       │ 03/06 │ Gs. 6.102.500 │ 🟡  │  │
│  │   RUC: 80012345-6  │ Timbrado: 12345678 │ CDC: 001-001-0000123...     │  │
│  │   [🤖 Sugerir asiento]  [🗑 Descartar]                                  │  │
│  ├─────────────────────────────────────────────────────────────────────────┤  │
│  │ 📄 001-003-067890 │ Ferretería XYZ      │ 02/06 │ Gs. 2.350.000 │ 🟡  │  │
│  │   RUC: 80123456-7  │ Timbrado: 87654321 │ CDC: 001-003-0000456...     │  │
│  │   [🤖 Sugerir asiento]  [🗑 Descartar]                                  │  │
│  ├─────────────────────────────────────────────────────────────────────────┤  │
│  │ 📄 001-001-054321 │ Personal Soft S.A.  │ 28/05 │ Gs. 850.000  │ ✅  │  │
│  │   RUC: 80234567-8  │ Timbrado: 23456789 │ CDC: 001-001-0000789...     │  │
│  │   [📎 JE-2026-028]  [👁 Ver asiento]                                   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  [✓ Aprobar seleccionados]  [✕ Rechazar]  [🧠 IA Sugerir todos]             │
│                                                                               │
│  Mostrando 3 de 23 comprobantes                         [1] [2] [3] [▶]      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 16.2 Columnas de la bandeja

Cada tarjeta de comprobante muestra:

| Elemento | Descripción |
|---|---|
| 📄 **Documento** | Número de factura: 001-001-XXXXX |
| **Proveedor/Cliente** | Nombre completo (link para ver detalle del tercero) |
| **Fecha** | Fecha de emisión del comprobante |
| **Total** | Importe total en la moneda original |
| **Estado** | 🟡 Pendiente / ✅ Contabilizado / ❌ Error |
| **RUC** | RUC del emisor |
| **Timbrado** | Número de timbrado |
| **CDC** | Código de Control de 44 dígitos (truncado) |
| **Acciones** | Botones contextuales según estado |

### 16.3 Botones de acción globales

| Botón | Descripción |
|---|---|
| **Filtrar** | Menú desplegable con opciones: pendientes, contabilizados, errores, todos |
| **Exportar** | Exporta la lista actual a CSV o Excel |
| **Sync SIFEN** | Forza una sincronización con el SIFEN para traer comprobantes nuevos. Muestra spinner durante la sincronización |
| **IA Sugerir todos** | Pide a la IA que genere asientos sugeridos para TODOS los pendientes. Aparece un modal de progreso |
| **Aprobar seleccionados** | Aplica la sugerencia de la IA como asiento oficial (posteado) |
| **Rechazar** | Descarta los seleccionados con opción de marcar como "no contabilizable" |

### 16.4 Flujo de trabajo diario

**Paso 1:** Entre al módulo **Comprobantes** desde la Sidebar.

**Paso 2:** Verá todos los comprobantes pendientes (arriba, filtro "Pendientes").

**Paso 3:** Examine cada comprobante. Haga clic en el CDC para ver el XML completo.

**Paso 4:** Para cada comprobante, tiene dos opciones:
- **Opción A (IA):** Haga clic en **"Sugerir asiento"**. La IA analiza el comprobante y propone una contrapartida. Aparece el modal de sugerencia.
- **Opción B (Manual):** Ignore la IA y vaya directamente al módulo Asientos para crearlo manualmente.

**Paso 5:** En el modal de sugerencia, revise la cuenta sugerida, el monto y la contrapartida. Si está correcto, haga clic en **"Aprobar"**. Si no, haga clic en **"Editar sugerencia"** y modifique antes de aprobar.

**Paso 6:** El comprobante pasa a estado ✅ **Contabilizado** y se vincula al asiento generado.

### 16.5 Modal de sugerencia IA

```
┌──────────────────────────────────────────────────────────────────────┐
│  🤖 Sugerencia de Asiento — Dist. ABC S.A.                         │
│  Confianza: █████████░ 92%                                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Factura: 001-001-012345  |  Fecha: 03/06/2026  |  Total: 6.102.500 │
│                                                                       │
│  📊 Asiento sugerido:                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Cuenta                     │ Débito     │ Crédito   │ Moneda     │ │
│  │────────────────────────────┼────────────┼───────────┼────────────│ │
│  │ 5.01.001 Compras           │ 5.550.000  │           │ PYG        │ │
│  │ 3.03.001 IVA Crédito 10%  │   555.000  │           │ PYG        │ │
│  │ 2.01.001 Proveedores       │            │ 6.105.000│ PYG        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  📝 Razonamiento: Compra de mercaderías gravadas al 10%.              │
│  Se debita la cuenta de compras y el IVA crédito, se acredita        │
│  la cuenta por pagar al proveedor.                                   │
│                                                                       │
│  [✏ Editar sugerencia]  [✓ Aprobar y contabilizar]  [✕ Rechazar]    │
└──────────────────────────────────────────────────────────────────────┘
```

### 16.6 Estados posibles en la bandeja

| Estado | Icono | Acción posible |
|---|---|---|
| **Pendiente** | 🟡 | Sugerir asiento, descartar |
| **Contabilizado** | ✅ | Ver asiento vinculado, descargar comprobante |
| **Error** | ❌ | Ver detalle del error, reimportar, descartar |
| **Analizando** | ⏳ | Esperar procesamiento de IA |
| **Descartado** | 🗑 | No se contabiliza. Se puede restaurar |

---

## 17. Módulo Asientos Contables — Listado

La pantalla de asientos muestra el libro diario de la empresa seleccionada. Cada fila representa un asiento contable con su fecha, número, descripción y totales.

### 17.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📒 Asientos Contables          [+ Nuevo] [📤 Exportar] [🔄]                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar por descripción...]                                               │
│  Estado: [Todos ▼]  Período: [Julio 2026 ▼]   Moneda: [Todas ▼]             │
│                                                                               │
│  ☐ │ Nro.     │ Fecha       │ Descripción            │ Debe      │ Haber   │
│  ───┼─────────┼─────────────┼────────────────────────┼───────────┼─────────│
│  ☐ │ JE-2026-│ 27/07/2026  │ Pago proveedor ABC     │ 6.105.000 │6.105.000│
│  ☐ │ JE-2026-│ 25/07/2026  │ Factura venta XYZ      │ 3.450.000 │3.450.000│
│  ☐ │ JE-2026-│ 20/07/2026  │ Ajuste tipo de cambio  │   250.000 │  250.000│
│  ☐ │ JE-2026-│ 15/07/2026  │ Compra activo fijo      │45.000.000 │45.000.000│
│                                                                               │
│  [✓ Postear sel.]  [✕ Reversar sel.]                                         │
│                                                                               │
│  Mostrando 1-10 de 156                              [◀] [1] [2] [3] [▶]      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 17.2 Columnas

| Columna | Descripción |
|---|---|
| ☐ | Checkbox para selección múltiple |
| **Nro.** | Número de asiento: JE-2026-NNN (correlativo por año-empresa) |
| **Fecha** | Fecha contable del asiento |
| **Descripción** | Texto breve que explica el asiento |
| **Debe** | Suma total del debe (formateado con Gs.) |
| **Haber** | Suma total del haber (formateado con Gs.) |

### 17.3 Filtros

| Filtro | Opciones |
|---|---|
| **Estado** | Todos, Borrador, Posteado, Reversado, Ajuste |
| **Período** | Selector de mes/año. Muestra períodos con datos |
| **Moneda** | Todas, PYG, USD |
| **Búsqueda** | Texto libre sobre descripción y número de asiento |

### 17.4 Botones de acción

| Botón | Descripción |
|---|---|
| **+ Nuevo** | Abre el formulario de nuevo asiento |
| **Exportar** | Exporta la lista a CSV/Excel con las columnas visibles |
| **🔄** | Refresca la lista |
| **Postear sel.** | Postea asientos en estado borrador (los pasa a estado definitivo) |
| **Reversar sel.** | Crea un contra-asiento que invierte los débitos/créditos |

### 17.5 Estados de asiento

| Estado | Icono | Significado | Modificable |
|---|---|---|---|
| **Borrador** | 📝 | En creación, no posteado. Se puede editar y eliminar | ✅ Sí |
| **Posteado** | ✅ | Definitivo, inmodificable. Afecta saldos contables | ❌ No |
| **Reversado** | 🔄 | Tiene un contra-asiento que lo anula | ❌ No |
| **Ajuste** | 📐 | Asiento de ajuste (corrección o reclasificación) | ❌ No |

### 17.6 Paso a paso: Navegar el listado

**Paso 1:** Haga clic en **Asientos** en la Sidebar.

**Paso 2:** Por defecto, ve los asientos del período actual. Use los filtros de período para cambiar de mes.

**Paso 3:** Para buscar un asiento específico, escriba en el campo de búsqueda (palabras de la descripción o número de asiento).

**Paso 4:** Haga clic en cualquier fila para ver el **detalle completo** del asiento (líneas individuales de débito y crédito).

**Paso 5:** Seleccione uno o más asientos con los checkboxes y use **"Postear"** o **"Reversar"** según el estado.

---

## 18. Módulo Asientos — Nuevo Asiento

### 18.1 Mock del formulario

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ✏ Nuevo Asiento Contable                                  [✕ Cancelar]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Datos generales                                                         ││
│  │                                                                          ││
│  │  Fecha: [📅 27/07/2026]                          Número: (automático)   ││
│  │  Moneda: ● PYG  ○ USD                             Tipo de cambio: [—]   ││
│  │  Descripción: [_________________________________________________]        ││
│  │                                                                          ││
│  │  Tipo: [Ordinario ▼]  |  Origen: [Manual ▼]                              ││
│  │                                                                          ││
│  │  Referencia: [001-001-012345]  (opcional: factura, comprobante, etc.)    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Líneas del asiento                                      [+ Agregar]    ││
│  │                                                                          ││
│  │  # │ Cuenta                        │ Descripción        │ Débito  │ Crédito││
│  │  ──┼───────────────────────────────┼────────────────────┼─────────┼───────││
│  │  1 │ [🔍 Buscar cuenta por código] │ [descripción]      │ [______]│ [____]││
│  │  2 │ [🔍 Buscar cuenta por código] │ [descripción]      │ [______]│ [____]││
│  │    │                               │                    │         │       ││
│  │  ─────────────────────────────────────────────────────────────────         ││
│  │  TOTAL:                            │                    │ 6.105.000│6.105.000│
│  │  Diferencia:                       │                    │         0  │      ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [💾 Guardar borrador]  [📌 Postear asiento]                                  │
│                                                                               │
│  ⚠ El asiento no está balanceado: diferencia de Gs. 500.000                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 18.2 Campos del formulario

#### Datos generales

| Campo | Tipo | Descripción |
|---|---|---|
| **Fecha** | Date picker | Fecha contable. No puede estar en un período cerrado |
| **Moneda** | Radio PYG/USD | Moneda base del asiento. Todas las líneas deben estar en esta moneda |
| **Tipo de cambio** | Number | Solo si USD. Se autocompleta con cotización del día |
| **Descripción** | Text | Texto obligatorio que explica el asiento |
| **Tipo** | Select | Ordinario / Ajuste / Apertura / Cierre / Reversión |
| **Origen** | Select | Manual / SIFEN / Sueldok / InteliMarket / InteliAudit / Importación |
| **Referencia** | Text | Vínculo opcional a factura, comprobante, o documento externo |

#### Líneas del asiento

Cada línea representa una cuenta contable con un movimiento de débito o crédito.

| Campo | Tipo | Descripción |
|---|---|---|
| **Cuenta** | Autocomplete | Busca por código o nombre en el plan de cuentas. Muestra jerarquía |
| **Descripción** | Text | Detalle específico de esta línea (opcional si ya hay descripción general) |
| **Débito** | Number | Importe del debe (0 si la línea es crédito) |
| **Crédito** | Number | Importe del haber (0 si la línea es débito) |

### 18.3 Validaciones automáticas

- **Balance**: La suma de débitos debe ser idéntica a la suma de créditos (por moneda). Si no, se muestra una advertencia roja con la diferencia.
- **Cuenta existente**: La cuenta debe existir en el plan de cuentas de la empresa.
- **Cuenta activa**: La cuenta no debe estar desactivada.
- **Período abierto**: La fecha no debe caer en un período cerrado (a menos que tenga permisos `allowRetroactive`).

### 18.4 Atajos de teclado en el formulario

| Tecla | Acción |
|---|---|
| **Enter** | Agrega una nueva línea (desde el último campo de la última línea) |
| **Tab** | Navega al siguiente campo dentro de la línea |
| **Ctrl+Enter** | Postea el asiento directamente |
| **↑/↓** | Navega entre líneas |

### 18.5 Paso a paso: Crear un asiento manual

**Paso 1:** Haga clic en **"+ Nuevo"** en la pantalla de Asientos.

**Paso 2:** Complete la **fecha**. El calendario muestra los días del mes actual. Si el período está cerrado, el campo se marca en rojo y no permite avanzar.

**Paso 3:** Seleccione la **moneda**. Si elige USD, verifique el tipo de cambio.

**Paso 4:** Escriba una **descripción** clara. Ej: "Pago factura 001-001-012345 — Dist. ABC S.A."

**Paso 5:** Seleccione el **tipo de asiento** (Ordinario para la mayoría de los casos).

**Paso 6:** En la sección de líneas, comience a escribir el código o nombre de la **cuenta**. Seleccione de la lista desplegable.

**Paso 7:** Escriba el **monto en débito o crédito**. El sistema valida que débito y crédito no tengan ambos valor positivo en la misma línea.

**Paso 8:** Presione **Enter** para agregar otra línea. Repita hasta tener todas las líneas necesarias.

**Paso 9:** Verifique que la **diferencia** sea 0. Si no lo es, ajuste los montos hasta balancear.

**Paso 10:** Haga clic en **"Guardar borrador"** (para postear después) o **"Postear asiento"** (para hacerlo definitivo ahora).

### 18.6 Diferencia entre Guardar borrador y Postear

| Acción | Efecto | Reversible |
|---|---|---|
| **Guardar borrador** | Guarda como borrador. NO afecta saldos contables. Se puede editar o eliminar después | ✅ Eliminar directamente |
| **Postear asiento** | Lo hace definitivo. Afecta saldos contables. Aparece en el libro diario. Aparece en balances | ❌ Solo mediante reversión |

---

## 19. Módulo Asientos — Detalle y Reversión

### 19.1 Mock del detalle

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📄 Asiento JE-2026-045                                        [✕ Cerrar]   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Estado: ✅ Posteado       Fecha: 27/07/2026    Moneda: PYG             ││
│  │  Descripción: Pago factura 001-001-012345 — Dist. ABC S.A.              ││
│  │  Tipo: Ordinario          Origen: Manual       Ref: 001-001-012345      ││
│  │  Creado por: admin@estudio.com.py  |  27/07/2026 14:32                   ││
│  │  Posteado por: admin@estudio.com.py  |  27/07/2026 14:33                 ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Líneas del asiento                                                      ││
│  │                                                                          ││
│  │  # │ Código │ Cuenta                        │ Débito    │ Crédito       ││
│  │  ──┼────────┼───────────────────────────────┼───────────┼───────────────││
│  │  1 │ 5.01.001 │ Compras                     │ 5.550.000 │               ││
│  │  2 │ 3.03.001 │ IVA Crédito 10%             │   555.000 │               ││
│  │  3 │ 2.01.001 │ Proveedores                  │           │ 6.105.000    ││
│  │    │          │                               │           │               ││
│  │    │          │ TOTAL                        │ 6.105.000 │ 6.105.000    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  📎 Comprobantes vinculados                                               ││
│  │                                                                          ││
│  │  📄 001-001-012345 — Dist. ABC S.A.  (SIFEN)   [👁 Ver]                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  📋 Historial de versiones                                               ││
│  │                                                                          ││
│  │  ● Versión 1 (Posteado) — 27/07/2026 por admin                           ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [🔄 Reversar asiento]  [📝 Versión ajuste]  [📤 Exportar PDF]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 19.2 Secciones del detalle

| Sección | Contenido |
|---|---|
| **Encabezado** | Estado, fecha, moneda, descripción, tipo, origen, referencia |
| **Auditoría** | Creado por (email + timestamp), Posteado por (email + timestamp) |
| **Líneas** | Tabla con código, nombre de cuenta, débito y crédito |
| **Comprobantes vinculados** | Documentos SIFEN, facturas, etc. asociados al asiento |
| **Historial de versiones** | Lista de versiones del asiento (si fue ajustado) |

### 19.3 Botones de acción

| Botón | Descripción |
|---|---|
| **Reversar asiento** | Crea un contra-asiento que invierte TODAS las líneas (débito ↔ crédito). El nuevo asiento queda vinculado como "reversalOf" del original |
| **Versión ajuste** | Crea una copia del asiento para hacer modificaciones. La copia se vincula como "versionOf" del original |
| **Exportar PDF** | Genera un PDF imprimible del asiento con todas las líneas |

### 19.4 Reversión paso a paso

**Paso 1:** Abra el detalle de un asiento posteado.

**Paso 2:** Haga clic en **"Reversar asiento"**.

**Paso 3:** Aparece un modal de confirmación:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠ Reversar Asiento                                                 │
│                                                                       │
│  Se creará un contra-asiento que invierte TODAS las líneas del       │
│  asiento JE-2026-045.                                                │
│                                                                       │
│  Motivo de la reversión:                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Se registró un asiento incorrecto.                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  [Cancelar]  [✓ Confirmar reversión]                                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Paso 4:** Escriba el **motivo** (obligatorio). Queda registrado en el audit log.

**Paso 5:** Haga clic en **"Confirmar reversión"**.

**Paso 6:** El sistema crea automáticamente un nuevo asiento con todas las líneas invertidas (débitos ↔ créditos). La fecha del contra-asiento es la fecha actual (no puede ser anterior al original).

**Paso 7:** El asiento original cambia a estado **"Reversado"**. El nuevo asiento queda **Posteado** automáticamente.

### 19.5 Ajuste (versión) paso a paso

**Paso 1:** Abra el detalle del asiento.

**Paso 2:** Haga clic en **"Versión ajuste"**.

**Paso 3:** Se abre el formulario de nuevo asiento con una copia de las líneas del original. Puede modificar cuentas, montos, descripción.

**Paso 4:** Al postear, el nuevo asiento queda vinculado como `versionOf` del original. Ambos asientos afectan saldos.

---

## 20. Módulo Plan de Cuentas

El plan de cuentas es el catálogo de cuentas contables de la empresa. Sigue la estructura estándar de la DNIT paraguaya con 4 niveles de jerarquía.

### 20.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📊 Plan de Cuentas                     [+ Nueva cuenta] [📤 Importar]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar por código o nombre...]                                          │
│                                                                               │
│  ├── 1. Activo                                                               │
│  │   ├── 1.01 Activo Corriente                                               │
│  │   │   ├── 1.01.001 Caja                                                  │
│  │   │   ├── 1.01.002 Bancos                                                │
│  │   │   ├── 1.01.003 Clientes                                              │
│  │   │   └── 1.01.004 Deudores por Ventas                                   │
│  │   └── 1.02 Activo No Corriente                                           │
│  │       ├── 1.02.001 Inmuebles                                              │
│  │       └── 1.02.002 Equipos                                               │
│  ├── 2. Pasivo                                                                │
│  │   ├── 2.01 Pasivo Corriente                                               │
│  │   │   ├── 2.01.001 Proveedores                                            │
│  │   │   └── 2.01.002 Cuentas por Pagar                                     │
│  │   └── 2.02 Pasivo No Corriente                                           │
│  ├── 3. Patrimonio Neto                                                      │
│  ├── 4. Ingresos                                                              │
│  ├── 5. Egresos                                                               │
│  ├── 6. Costos                                                                │
│  ├── 7. Cuentas de Orden                                                    │
│  ├── 8. Cuentas Diferenciales                                               │
│  └── 9. Cuentas Analíticas de Gestión                                       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Detalle de cuenta seleccionada                                          ││
│  │                                                                          ││
│  │  Cuenta: 1.01.003  Clientes                                              ││
│  │  Tipo: Activo Corriente  |  Naturaleza: Deudora  |  Nivel: 4             ││
│  │  Moneda: PYG  |  Acepta movimientos: Sí  |  Apertura: 01/01/2026         ││
│  │  Saldo actual: Gs. 45.230.000                                             ││
│  │                                                                          ││
│  │  [✏ Editar]  [🔒 Desactivar]  [📋 Historial]                            ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 20.2 Estructura jerárquica

| Nivel | Formato | Ejemplo | Descripción |
|---|---|---|---|
| 1 | X | 1 | Grupo: Activo, Pasivo, Ingresos |
| 2 | X.XX | 1.01 | Subgrupo: Activo Corriente |
| 3 | X.XX.XXX | 1.01.001 | Rubro: Caja |
| 4 (opcional) | X.XX.XXX.XX | 1.01.001.01 | Subrubro: Caja Chica |

### 20.3 Información de cada cuenta

| Campo | Descripción |
|---|---|
| **Código** | Código jerárquico único |
| **Nombre** | Nombre de la cuenta |
| **Tipo** | Activo / Pasivo / Patrimonio / Ingreso / Egreso / Costo / Orden |
| **Naturaleza** | Deudora (activo, egreso) o Acreedora (pasivo, ingreso) |
| **Nivel** | 1 (grupo) a 4 (subrubro). Solo nivel 4 acepta movimientos |
| **Moneda** | PYG / USD / Multimoneda |
| **Acepta movimientos** | Sí (solo nivel 4) / No (cuentas de agrupación) |
| **Estado** | Activa / Inactiva |

### 20.4 Paso a paso: Crear una cuenta

**Paso 1:** Haga clic en **"+ Nueva cuenta"**.

**Paso 2:** Seleccione la **cuenta padre** en el árbol (ej: 1.01 Activo Corriente).

**Paso 3:** Complete el **código** (se autocompleta según la jerarquía, puede editarlo).

**Paso 4:** Escriba el **nombre** de la cuenta.

**Paso 5:** Seleccione la **moneda** de la cuenta.

**Paso 6:** Marque **"Acepta movimientos"** solo si esta cuenta va a recibir transacciones.

**Paso 7:** Haga clic en **"Guardar"**. La cuenta aparece en el árbol inmediatamente.

### 20.5 Importar plan de cuentas

**Paso 1:** Haga clic en **"Importar"**.

**Paso 2:** Seleccione el formato: **CSV** o **Excel**.

**Paso 3:** Use la plantilla descargable provista por el sistema (formato: código, nombre, tipo, naturaleza, moneda).

**Paso 4:** Arrastre el archivo o haga clic para seleccionarlo.

**Paso 5:** El sistema valida el archivo y muestra una previsualización de las cuentas a importar.

**Paso 6:** Confirme la importación. Las cuentas se agregan al plan existente.

---

## 21. Módulo Activos Fijos (Bienes de Uso)

Gestiona los activos fijos de la empresa con cálculo de depreciación automático.

### 21.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏢 Activos Fijos                                    [+ Nuevo] [📤 Exportar] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar activo...]    Estado: [Activos ▼]     Tipo: [Todos ▼]           │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ 📦 Notebook Dell Latitude           │ Código: ACT-001                    │
│  │ Tipo: Equipo de Computación         │ Fecha adq.: 15/03/2026            ││
│  │ Costo: Gs. 8.500.000                │ Deprec.: Gs. 2.125.000 (25%)      ││
│  │ Valor actual: Gs. 6.375.000         │ Estado: 🟢 En uso                 ││
│  │ [👁 Ver] [✏ Editar] [📄 Depreciar]                                     ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ 🚗 Toyota Hilux 2026               │ Código: ACT-002                    ││
│  │ Tipo: Vehículo                      │ Fecha adq.: 02/01/2026            ││
│  │ Costo: Gs. 280.000.000              │ Deprec.: Gs. 46.666.667 (20%)     ││
│  │ Valor actual: Gs. 233.333.333       │ Estado: 🟢 En uso                 ││
│  │ [👁 Ver] [✏ Editar] [📄 Depreciar]                                     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Mostrando 1-2 de 8 activos                            [1] [2] [▶]           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 21.2 Campos de un activo

| Campo | Tipo | Descripción |
|---|---|---|
| **Código** | Text (automático) | Código único: ACT-NNN |
| **Nombre** | Text | Descripción del activo |
| **Tipo** | Select | Inmueble / Vehículo / Equipo de Computación / Mueble / Maquinaria / Otro |
| **Fecha de adquisición** | Date | Fecha de compra del activo |
| **Costo de adquisición** | Number | Valor de compra (sin IVA) |
| **Vida útil (años)** | Number | Años de vida útil del activo |
| **Método de depreciación** | Select | Lineal (único soportado actualmente) |
| **Estado** | Select | En uso / Depreciado total / Vendido / Baja |
| **Cuenta contable** | Autocomplete | Cuenta del activo en el plan de cuentas |
| **Cuenta depreciación** | Autocomplete | Cuenta de depreciación acumulada |

### 21.3 Paso a paso: Registrar un activo

**Paso 1:** Haga clic en **"+ Nuevo"** en la pantalla de Activos Fijos.

**Paso 2:** Complete **nombre** del activo, **tipo** y **fecha de adquisición**.

**Paso 3:** Ingrese el **costo de adquisición** (sin IVA).

**Paso 4:** Defina la **vida útil** en años. El sistema calcula automáticamente el porcentaje anual (100%/vida_útil).

**Paso 5:** Seleccione **cuenta contable** (cuenta de activo) y **cuenta de depreciación** (cuenta de depreciación acumulada).

**Paso 6:** Guarde el activo. Queda en estado "En uso".

### 21.4 Depreciación

**Paso 1:** Desde la lista, haga clic en **"Depreciar"** en el activo deseado.

**Paso 2:** Aparece un modal:

```
┌──────────────────────────────────────────────────────────────────────┐
│  📄 Depreciar Activo — Notebook Dell Latitude                       │
│                                                                       │
│  Costo: Gs. 8.500.000  |  Vida útil: 4 años  |  % anual: 25%        │
│                                                                       │
│  Período a depreciar: [Julio 2026 ▼]                                 │
│  Depreciación del mes: Gs. 177.083                                    │
│  (cálculo: 8.500.000 × 25% / 12 meses)                               │
│                                                                       │
│  Asiento de depreciación:                                            │
│    → 5.02.001 Depreciaciones (Débito): Gs. 177.083                   │
│    → 1.02.999 Dep. Acumulada (Crédito): Gs. 177.083                  │
│                                                                       │
│  [Cancelar]  [✓ Depreciar y generar asiento]                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Paso 2:** Seleccione el **período** a depreciar.

**Paso 3:** Revise el cálculo automático de la depreciación.

**Paso 4:** Haga clic en **"Depreciar y generar asiento"**.

**Paso 5:** El sistema crea automáticamente un asiento contable de depreciación y actualiza el valor actual del activo.

---

## 22. Módulo Terceros (Clientes/Proveedores)

Gestiona el catálogo de personas y empresas con las que la empresa se relaciona comercialmente.

### 22.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  👥 Terceros                                    [+ Nuevo] [📤 Importar CSV] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar por RUC, nombre...]                                              │
│  Tipo: [Todos ▼]  |  Estado: [Activos ▼]                                    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ 📇 Estudio ABC S.A.             │ RUC: 8.014.411-5     │ 🟢 Activo      ││
│  │  Cliente  ·  Av. Mariscal López 1234, Asunción         │                ││
│  │  Tel: (021) 123-456  |  Email: info@estudioabc.com.py  │                ││
│  │  [✏ Editar] [📋 Comprobantes]  [📊 Saldo: Gs. 6.105.000]               ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ 📇 Distribuidora ABC            │ RUC: 8.012.345-6     │ 🟢 Activo      ││
│  │  Proveedor  ·  Av. Eusebio Ayala 567, Asunción        │                ││
│  │  Tel: (021) 789-012  |  Email: ventas@distabc.com.py  │                ││
│  │  [✏ Editar] [📋 Comprobantes]  [📊 Saldo: Gs. 12.300.000]             ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Mostrando 1-10 de 34 terceros                           [1] [2] [3] [▶]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 22.2 Campos de un tercero

| Campo | Tipo | Validación |
|---|---|---|
| **Tipo** | Radio/Select | Cliente / Proveedor / Ambos / Empleado / Otro |
| **RUC** | Text | Formato: X.XXX.XXX-X (válido paraguayo con dígito verificador) |
| **Razón Social** | Text | Nombre completo (obligatorio) |
| **Nombre Comercial** | Text | Opcional |
| **Dirección** | Text | Calle, número, ciudad |
| **Teléfono** | Text | |
| **Email** | Email | |
| **Contacto** | Text | Nombre de la persona de contacto |
| **Estado** | Select | Activo / Inactivo |
| **Moneda por defecto** | Select | PYG / USD |
| **Lista de precios** | Select | Si aplica |

### 22.3 Paso a paso: Crear un tercero

**Paso 1:** Haga clic en **"+ Nuevo"**.

**Paso 2:** Seleccione el **tipo** de tercero (Cliente, Proveedor, o Ambos).

**Paso 3:** Ingrese el **RUC** del tercero. El sistema valida el formato y el dígito verificador automáticamente al perder el foco.

**Paso 4:** Complete la **razón social** (obligatorio).

**Paso 5:** Complete los datos opcionales: nombre comercial, dirección, teléfono, email, contacto.

**Paso 6:** Seleccione la **moneda por defecto** y la **lista de precios** si corresponde.

**Paso 7:** Haga clic en **"Guardar"**. El tercero queda activo y disponible en los autocompletados.

---

## 23. Módulo Bancos y Conciliación

### 23.1 Mock de la pantalla principal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏦 Bancos                  [+ Nueva cuenta] [🔄 Sincronizar] [📤 Exportar]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Cuenta                    │ Saldo Libro   │ Saldo Banco  │ Diferencia   ││
│  │───────────────────────────┼───────────────┼──────────────┼──────────────││
│  │ 🏦 Banco Continental     │ Gs. 45.230.000│ Gs. 45.500.000│   270.000 🔴││
│  │    Cta. Cte. 123-456-789 │               │               │ (Conciliar) ││
│  │    Última conc.: 15/07/26│               │               │             ││
│  │    [👁 Ver] [🔄 Conciliar] [📊 Estado]                                   │
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ 🏦 Banco Itaú             │ Gs. 12.800.000│ Gs. 12.800.000│         0 ✅││
│  │    Cta. Ahorro 987-654-321│               │               │ (Conciliado)││
│  │    Última conc.: 20/07/26│               │               │             ││
│  │    [👁 Ver] [🔄 Conciliar] [📊 Estado]                                   │
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 23.2 Campos de una cuenta bancaria

| Campo | Tipo | Descripción |
|---|---|---|
| **Banco** | Select | Banco Continental, Itaú, BBVA, Familiar, Regional, etc. |
| **Tipo de cuenta** | Select | Cuenta Corriente / Caja de Ahorro / Cuenta Vista |
| **Número de cuenta** | Text | Número de cuenta bancaria |
| **Moneda** | Select | PYG / USD |
| **Saldo inicial** | Number | Saldo al iniciar el sistema |
| **Fecha saldo inicial** | Date | Fecha del saldo inicial |
| **Cuenta contable** | Autocomplete | Cuenta del activo en el plan de cuentas (1.01.002) |

### 23.3 Mock de conciliación

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔄 Conciliación Bancaria — Banco Continental                            │
│  Cta. Cte. 123-456-789                          Período: [Julio 2026 ▼]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Saldo según Libro: Gs. 45.230.000                                           │
│  Saldo según Banco: Gs. 45.500.000                                           │
│  Diferencia: Gs. 270.000  🔴                                                 │
│                                                                               │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │  📊 Movimientos del Libro    │  │  🏦 Extracto Bancario            │     │
│  │                              │  │                                  │     │
│  │  ☑ │ Fecha   │ Concepto │Mto│  │  ☑ │ Fecha   │ Concepto     │Mto │     │
│  │  ──┼─────────┼──────────┼────│  │  ──┼─────────┼──────────────┼────│     │
│  │  ☑ │ 01/07   │ Depósito │2.0M│  │  ☑ │ 01/07   │ Depósito     │2.0M│     │
│  │  ☑ │ 05/07   │ Cheque   │1.5M│  │  ☑ │ 05/07   │ Cheque       │1.5M│     │
│  │  ☐ │ 10/07   │ Transf.  │ 270K│  │  ☐ │ —       │ —            │ —  │     │
│  │  ☑ │ 15/07   │ Pago     │ 500K│  │  ☑ │ 15/07   │ Débito       │ 500K│     │
│  │                              │  │  │ 15/07   │ Comisión      │  50K│     │
│  │                              │  │  │                                  │     │
│  └──────────────────────────────┘  └──────────────────────────────────┘     │
│                                                                               │
│  🔍 Diferencias detectadas:                                                   │
│  - Transf. Gs. 270.000 (Libro) → No aparece en banco (flotante)              │
│  - Comisión Gs. 50.000 (Banco) → No está registrada en libro                 │
│                                                                               │
│  [+ Agregar asiento de ajuste]  [✓ Confirmar conciliación]                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 23.4 Paso a paso: Conciliar

**Paso 1:** Desde el módulo Bancos, haga clic en **"Conciliar"** en la cuenta deseada.

**Paso 2:** Seleccione el **período** de conciliación (normalmente el mes).

**Paso 3:** Verá dos paneles: **Movimientos del Libro** (izquierda) y **Extracto Bancario** (derecha).

**Paso 4:** Cargue el extracto bancario: haga clic en **"Cargar extracto"** y seleccione el archivo CSV/OFX de su banco. El sistema importa los movimientos automáticamente.

**Paso 5:** Marque con ☑ los movimientos que coinciden en ambos lados. El sistema sugiere coincidencias automáticas por monto y fecha.

**Paso 6:** Revise las **diferencias detectadas** en la parte inferior:
- Movimientos en libro que no están en banco (flotantes: cheques no cobrados, depósitos no acreditados)
- Movimientos en banco que no están en libro (comisiones, intereses, débitos automáticos)

**Paso 7:** Para cada diferencia que requiera ajuste, haga clic en **"Agregar asiento de ajuste"**. El sistema sugiere el asiento correspondiente.

**Paso 8:** Una vez que la diferencia es 0, haga clic en **"Confirmar conciliación"**.

**Paso 9:** La conciliación queda registrada con fecha, usuario, y todos los movimientos conciliados.

### 23.5 Estados de conciliación

| Estado | Descripción |
|---|---|
| **Pendiente** | No se ha conciliado este mes aún |
| **En progreso** | Se está conciliando (guardado automáticamente) |
| **Conciliado** | La diferencia es 0 y se confirmó la conciliación |
| **Diferencia** | Se concilió pero quedaron diferencias justificadas |

---

## 24. Módulo Caja Chica

### 24.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  💰 Caja Chica                [+ Nuevo fondo] [🤖 Reponer] [📤 Exportar]    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Fondo: Caja Chica General               │ Saldo: Gs. 800.000 / 2.000.000││
│  │ Responsable: Juan Pérez                 │ Estado: 🟢 Activo             ││
│  │ [👁 Ver movimientos] [✏ Editar fondo] [🔒 Cerrar fondo]                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Movimientos recientes                                                    ││
│  │                                                                          ││
│  │  Fecha       │ Concepto               │ Gasto     │ Reposición │ Saldo  ││
│  │ ────────────┼────────────────────────┼───────────┼────────────┼────────││
│  │  27/07/2026 │ Café para reunión       │   45.000  │            │ 955.000││
│  │  26/07/2026 │ Pasaje encomienda       │   35.000  │            │ 1.000.000│
│  │  25/07/2026 │ Refrigerios             │  120.000  │            │ 1.035.000│
│  │  20/07/2026 │ Reposición fondo        │           │ 1.000.000  │ 1.155.000│
│  │  15/07/2026 │ Resma de papel          │   65.000  │            │   155.000│
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [Registrar gasto]  [Solicitar reposición]                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 24.2 Campos de un fondo

| Campo | Tipo | Descripción |
|---|---|---|
| **Nombre** | Text | Nombre del fondo (ej: "Caja Chica General") |
| **Monto asignado** | Number | Monto total del fondo |
| **Responsable** | Select | Usuario del sistema responsable del fondo |
| **Cuenta contable** | Autocomplete | Cuenta del activo en el plan de cuentas |
| **Estado** | Activo/Cerrado | Si está cerrado no se pueden registrar gastos |

### 24.3 Registrar un gasto de caja chica

**Paso 1:** Haga clic en **"Registrar gasto"**.

**Paso 2:** Complete:
- **Fecha** del gasto
- **Concepto** (ej: "Café para reunión con cliente")
- **Monto** en guaraníes
- **Beneficiario** (opcional)
- **Comprobante** (opcional, foto del ticket/factura)
- **Categoría** (Útiles / Viajes / Refrigerios / Varios)

**Paso 3:** Guarde el gasto. El saldo del fondo se descuenta automáticamente.

**Paso 4:** Cuando el fondo llegue a un mínimo (ej: 20% del monto asignado), el sistema muestra una alerta para reponer.

### 24.4 Reposición de fondo

**Paso 1:** Haga clic en **"Reponer"**.

**Paso 2:** El sistema calcula el monto a reponer (monto asignado - saldo actual).

**Paso 3:** Se genera automáticamente un **asiento contable**:
- Débito: Gastos de caja chica (agrupa todos los gastos del período)
- Crédito: Banco / Caja

**Paso 4:** Confirme la reposición. El fondo vuelve a su monto asignado completo.

---

## 25. Módulo Tesorería

### 25.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  💼 Tesorería / Cash Flow                         [📤 Exportar] [🔄]        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  📅 Período: [Julio 2026 ▼]                                                  │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Resumen del mes                                                          ││
│  │                                                                          ││
│  │  Ingresos:        Gs. 120.500.000  ↑  ████████████████░░░░░░░           ││
│  │  Egresos:         Gs.  98.200.000  ↓  █████████████░░░░░░░░░            ││
│  │  ─────────────────────────────────                                        ││
│  │  Saldo operativo: Gs.  22.300.000  🟢                                 ││
│  │                                                                          ││
│  │  Saldo inicial:   Gs.  10.500.000                                        ││
│  │  Saldo final:     Gs.  32.800.000                                        ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Proyección a 30 días                                                     ││
│  │                                                                          ││
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐          ││
│  │  │28/07│29/07│30/07│31/07│01/08│02/08│03/08│04/08│05/08│06/08│          ││
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤          ││
│  │  │32.8 │31.5 │29.0 │27.2 │42.2 │40.0 │38.5 │36.0 │34.0 │33.0 │          ││
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘          ││
│  │  📈 Proyección de saldo (en millones)                                    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Próximos vencimientos (7 días)                                           ││
│  │                                                                          ││
│  │  Fecha     │ Concepto                      │ Monto      │ Estado        ││
│  │ ──────────┼──────────────────────────────┼─────────────┼───────────────││
│  │ 28/07/2026│ Pago a Proveedor XYZ         │ Gs. 6.105.000│ 🔴 Vence mañana││
│  │ 30/07/2026│ Sueldos                      │ Gs. 25.000.000│ 🟡 Esta semana││
│  │ 31/07/2026│ IVA (Formulario 104)         │ Gs. 4.500.000│ 🟡 Esta semana││
│  │ 03/08/2026│ Alquiler local               │ Gs. 3.500.000│ 🟢 Próxima sem││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 25.2 Secciones de tesorería

| Sección | Descripción |
|---|---|
| **Resumen del mes** | Ingresos, egresos, saldo operativo del mes actual |
| **Proyección a 30 días** | Gráfico de barras con saldo proyectado día a día basado en cobros y pagos esperados |
| **Próximos vencimientos** | Lista de pagos con vencimiento en los próximos 7 días (codificados por color) |

### 25.3 Codificación de colores

| Color | Significado |
|---|---|
| 🟢 Verde | Vence en más de 3 días o ya está pagado |
| 🟡 Amarillo | Vence en 1-3 días |
| 🔴 Rojo | Vence hoy o ya venció |
| ⚪ Gris | Ya pagado/cobrado |

### 25.4 Paso a paso: Usar tesorería

**Paso 1:** Entre a **Tesorería** desde la Sidebar.

**Paso 2:** Revise el **resumen del mes** para tener una visión rápida de ingresos vs egresos.

**Paso 3:** Mire la **proyección a 30 días** para identificar días con problemas de liquidez (saldo negativo en rojo).

**Paso 4:** Revise los **próximos vencimientos** priorizando los de color rojo.

**Paso 5:** Haga clic en cualquier vencimiento para ver el detalle y registrar el pago.

---

## 26. Módulo Libro IVA

El Libro IVA registra todas las operaciones de compra y venta con su desglose de IVA. Es obligatorio para la presentación del Formulario 104.

### 26.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📖 Libro IVA                              Período: [Julio 2026 ▼]          │
│  [🔄 Generar] [📤 Exportar CSV] [📤 Exportar Hechauka] [🖨 Imprimir]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  COMPRAS (IVA Crédito)                                                    ││
│  │                                                                          ││
│  │  Fecha   │ RUC         │ Proveedor     │ Nro. Fact. │ Base 10% │ Base 5%││
│  │ ─────────┼─────────────┼──────────────┼────────────┼──────────┼────────││
│  │ 03/07/26 │ 80012345-6 │ Dist. ABC     │ 001-001... │5.550.000 │        ││
│  │ 05/07/26 │ 80123456-7 │ Farmacia XYZ  │ 001-003... │          │1.000.00││
│  │                                                                          ││
│  │  Totales:                        │ Gs. 5.550.000 │ Gs. 1.000.000         ││
│  │  IVA 10%: Gs. 555.000  |  IVA 5%: Gs. 50.000  |  IVA Total: Gs. 605.000││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  VENTAS (IVA Débito)                                                      ││
│  │                                                                          ││
│  │  Fecha   │ RUC         │ Cliente        │ Nro. Fact. │ Base 10% │ Base 5%││
│  │ ─────────┼─────────────┼──────────────┼────────────┼──────────┼────────││
│  │ 02/07/26 │ 80234567-8 │ Cliente XYZ   │ 001-001... │3.000.000 │        ││
│  │                                                                          ││
│  │  Totales:                        │ Gs. 3.000.000 │ Gs. 0                  ││
│  │  IVA 10%: Gs. 300.000  |  IVA 5%: Gs. 0  |  IVA Total: Gs. 300.000     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Resumen IVA del período                                                  ││
│  │                                                                          ││
│  │  IVA Débito (Ventas):          │ Gs. 300.000                             ││
│  │  IVA Crédito (Compras):        │ Gs. 605.000                             ││
│  │  ──────────────────────────────┼────────────────────────────────────────  ││
│  │  IVA a Pagar (Débito - Créd.): │ Gs. 0 (Crédito fiscal: Gs. 305.000)    ││
│  │  IVA a Favor (si crédito > débito): Saldo a favor del contribuyente     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 26.2 Secciones del Libro IVA

| Sección | Descripción |
|---|---|
| **Compras (IVA Crédito)** | Todas las facturas de compra del período con su desglose de IVA |
| **Ventas (IVA Débito)** | Todas las facturas de venta del período con su desglose de IVA |
| **Resumen IVA** | Cálculo del IVA a pagar o saldo a favor |

### 26.3 Generación del Libro IVA

**Paso 1:** Seleccione el **período** (mes/año) para generar el libro.

**Paso 2:** Haga clic en **"Generar"**.

**Paso 3:** El sistema recopila todos los comprobantes SIFEN del período y genera automáticamente las tablas de Compras y Ventas.

**Paso 4:** Revise los totales. Si faltan comprobantes, el sistema muestra una advertencia.

**Paso 5:** Exporte a CSV, o al formato de **Hechauka** (libro electrónico exigido por la SET).

**Paso 6:** También puede **imprimir** el libro directamente.

---

## 27. Módulo Impuestos

### 27.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📊 Impuestos                                  Período: [Julio 2026 ▼]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Declaraciones disponibles:                                                   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  📋 Formulario 104 — IVA                                  ➡️ [Declarar] ││
│  │  IVA a Pagar: Gs. 0 (Crédito Fiscal: Gs. 305.000)                       ││
│  │  Vencimiento: 15/08/2026  |  Presentado: No                        🔴  ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  📋 Formulario 501 — IRE (Impuesto a la Renta Empresarial)   ➡️ [Declarar]│
│  │  IRE Determinado: Gs. 2.450.000 (Régimen General)                        ││
│  │  Vencimiento: 31/08/2026  |  Presentado: No                        🔴    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  📋 Formulario 400 — IRP (Impuesto a la Renta Personal)    ➡️ [Declarar]  │
│  │  Presentación: Anual  |  Vencimiento: 31/03/2027                         ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Historial de declaraciones:                                                  │
│                                                                               │
│  Fecha       │ Formulario │ Período │ Monto      │ Estado   │ Comprobante  │
│ ────────────┼────────────┼─────────┼────────────┼──────────┼──────────────│
│  15/06/2026 │ 104        │ Mayo    │ Gs. 520.000│ ✅ Pagado│ Pago-104-... │
│  30/04/2026 │ 501        │ 2025    │ Gs. 3.100.000│ ✅ Pagado│ Pago-501-...│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 27.2 Tipos de impuestos soportados

| Impuesto | Formulario | Periodicidad | Descripción |
|---|---|---|---|
| **IVA** | 104 | Mensual | Impuesto al Valor Agregado (10% y 5%) |
| **IRE** | 501 | Anual (anticipos mensuales) | Impuesto a la Renta Empresarial |
| **IRP** | 400 | Anual | Impuesto a la Renta Personal |
| **IRP - RG** | 400 | Mensual | IRP por ingresos brutos |
| **IDU** | 250 | Eventual | Impuesto a los Dividendos y Utilidades |

### 27.3 Paso a paso: Declarar IVA (Formulario 104)

**Paso 1:** En el módulo Impuestos, haga clic en **"Declarar"** en el Formulario 104.

**Paso 2:** El sistema abre el detalle del formulario con los datos precargados del Libro IVA.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 Formulario 104 — IVA                          Período: Julio 2026       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  RUC: 8.014.411-5  |  Razón Social: Estudio ABC S.A.                        │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Código │ Concepto                                   │ Valor            ││
│  │ ────────┼────────────────────────────────────────────┼─────────────────││
│  │  101    │ Ventas Gravadas Tasa 10%                    │ 3.000.000       ││
│  │  102    │ Ventas Gravadas Tasa 5%                     │ 0               ││
│  │  103    │ Ventas Exentas                              │ 0               ││
│  │  201    │ Compras Gravadas Tasa 10%                   │ 5.550.000       ││
│  │  202    │ Compras Gravadas Tasa 5%                    │ 1.000.000       ││
│  │  301    │ IVA Débito (10% de 101)                     │ 300.000         ││
│  │  302    │ IVa Débito (5% de 102)                      │ 0               ││
│  │  401    │ IVA Crédito (10% de 201)                    │ 555.000         ││
│  │  402    │ IVA Crédito (5% de 202)                     │ 50.000          ││
│  │  501    │ IVA a Pagar (301+302) - (401+402)            │ 0               ││
│  │  502    │ Crédito Fiscal a Favor                      │ 305.000         ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [✏ Editar]  [✅ Presentar declaración]  [📤 Descargar PDF]                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso 3:** Revise todos los valores. Si necesita ajustar, haga clic en **"Editar"**.

**Paso 4:** Haga clic en **"Presentar declaración"**.

**Paso 5:** Si hay monto a pagar, el sistema redirige al pago. Si es cero o saldo a favor, la declaración queda presentada.

**Paso 6:** El sistema genera un comprobante de presentación. Opcionalmente, puede descargar el PDF del formulario para presentar en la SET/DNIT.


---

## 28. Módulo Retenciones Tesaka

Tesaka es el módulo de gestión de retenciones (retenciones de IVA, IRE, IRP, INR). Sigue las reglas fiscales paraguayas para cada tipo de retención.

### 28.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏛 Retenciones (Tesaka)                        [+ Nueva] [📤 Exportar]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar por RUC, comprobante...]                                         │
│  Tipo: [Todas ▼]  Período: [Julio 2026 ▼]  Estado: [Pendientes ▼]          │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ 📄 Ret. IVA 50%  │ Proveedor: ABC S.A.       │ RUC: 80012345-6         ││
│  │   Factura: 001-001-012345  │ Base: Gs. 1.000.000  │ Ret.: Gs. 50.000    ││
│  │   Fecha: 27/07/2026        │ Vencimiento: 15/08/2026  │ 🟡 Pendiente    ││
│  │   [👁 Ver] [📤 Descargar certificado]                                    ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ 📄 Ret. IRE 2%   │ Proveedor: Distribuidora XYZ  │ RUC: 80123456-7     ││
│  │   Factura: 001-001-067890  │ Base: Gs. 5.000.000  │ Ret.: Gs. 100.000   ││
│  │   Fecha: 25/07/2026        │ Vencimiento: 15/08/2026  │ ✅ Pagado       ││
│  │   [👁 Ver] [📤 Descargar certificado]                                    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Mostrando 1-10 de 22 retenciones                        [1] [2] [3] [▶]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 28.2 Tipos de retención soportados

| Tipo | Tasa | Aplica a | Formulario |
|---|---|---|---|
| **IVA 50%** | 50% del IVA total (5% × 50% = 2.5% o 10% × 50% = 5%) | Facturas de servicios en general | 120 |
| **IVA 100%** | 100% del IVA total | Facturas del Estado, ONGs, organismos internacionales | 120 |
| **IRE — General** | 1.5% | Servicios personales, honorarios | 501 |
| **IRE — Simple** | 1% | Pequeños contribuyentes | 501 |
| **IRE — Resimple** | 0.5% | Microcontribuyentes | 501 |
| **IRP** | Escala progresiva hasta 10% | Honorarios profesionales, servicios personales | 400 |
| **INR** | 15% | Servicios del exterior | 220 |

### 28.3 Paso a paso: Calcular y registrar retención

**Paso 1:** Haga clic en **"+ Nueva"**.

**Paso 2:** Seleccione el **tipo de retención** (IVA 50%, IRE, IRP, etc.).

**Paso 3:** Seleccione el **proveedor** (autocomplete de terceros).

**Paso 4:** Seleccione la **factura** a la que aplica la retención.

**Paso 5:** El sistema calcula automáticamente:
- Base imponible
- Tasa de retención
- Importe de la retención
- Fecha de vencimiento (según calendario DNIT)

**Paso 6:** Verifique los valores calculados. Puede ajustar si es necesario.

**Paso 7:** Haga clic en **"Registrar retención"**.

**Paso 8:** El sistema genera:
- El registro de la retención
- El **certificado de retención** (PDF descargable)
- El **asiento contable** de la retención

### 28.4 Certificado de retención

Cada retención genera un certificado PDF que contiene:
- RUC y datos del agente de retención (su empresa)
- RUC y datos del retenido (proveedor)
- Tipo y tasa de retención
- Importe retenido
- Fecha de emisión
- Número de certificado
- Código de verificación

---

## 29. Módulo Timbrados

Gestiona los timbrados fiscales de la empresa: fechas de vigencia, límites de facturas, estado.

### 29.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏷 Timbrados                                     [+ Nuevo] [🔄 Verificar]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Timbrado: 12345678              │ Tipo: Factura Electrónica             ││
│  │ Establecimiento: 001            │ Exp. Inicio: 001    │ Exp. Fin: 001   ││
│  │ Vigente desde: 01/01/2026       │ Hasta: 31/12/2026                      ││
│  │ Facturas usadas: 1.234 / 5.000  │ ████████░░░░░░░  (24.7%)              ││
│  │ Estado: 🟢 Vigente              │                                      ││
│  │ [✏ Editar] [🔒 Cerrar] [⛔ Inactivar]                                  ││
│  ├──────────────────────────────────────────────────────────────────────────┤│
│  │ Timbrado: 87654321              │ Tipo: Nota de Crédito                 ││
│  │ Establecimiento: 001            │ Exp. Inicio: 002    │ Exp. Fin: 002   ││
│  │ Vigente desde: 01/03/2026       │ Hasta: 28/02/2027                     ││
│  │ Facturas usadas: 45 / 2.000     │ ██░░░░░░░░░░░░░  (2.3%)              ││
│  │ Estado: 🟢 Vigente              │                                      ││
│  │ [✏ Editar] [🔒 Cerrar] [⛔ Inactivar]                                  ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 29.2 Campos de un timbrado

| Campo | Tipo | Descripción |
|---|---|---|
| **Número** | Text (8 dígitos) | Número único de 8 dígitos asignado por la SET/DNIT |
| **Tipo** | Select | Factura / Nota de Crédito / Nota de Débito / Autofactura |
| **Establecimiento** | Text (3 dígitos) | Código del establecimiento |
| **Exp. Inicio** | Text (3 dígitos) | Punto de expedición inicial |
| **Exp. Fin** | Text (3 dígitos) | Punto de expedición final |
| **Fecha desde** | Date | Inicio de vigencia |
| **Fecha hasta** | Date | Fin de vigencia |
| **Cantidad autorizada** | Number | Máximo de comprobantes a emitir |
| **Estado** | Select | Vigente / Vencido / Agotado / Cancelado |

### 29.3 Paso a paso: Registrar timbrado

**Paso 1:** Haga clic en **"+ Nuevo"**.

**Paso 2:** Ingrese el **número de timbrado** de 8 dígitos.

**Paso 3:** Seleccione el **tipo** de comprobante asociado.

**Paso 4:** Complete **establecimiento** y **puntos de expedición**.

**Paso 5:** Defina las **fechas de vigencia** (desde/hasta) según la resolución de la SET.

**Paso 6:** Ingrese la **cantidad de comprobantes autorizada**.

**Paso 7:** Guarde. El timbrado queda en estado **Vigente**.

### 29.4 Alertas automáticas

El sistema muestra alertas cuando:
- Un timbrado está por vencer (menos de 30 días)
- Un timbrado supera el 80% de facturas usadas
- Un timbrado expiró (cambia a "Vencido") automáticamente

---

## 30. Módulo Cierre de Períodos

El cierre de períodos bloquea un mes contable para evitar modificaciones posteriores. Es obligatorio para garantizar la inmutabilidad del libro contable.

### 30.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔒 Cierre de Períodos                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Año: [2026 ▼]                                                               │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ Mes       │ Estado        │ Asientos │ Libro IVA │ Retenc.│ Balance    ││
│  │──────────┼───────────────┼──────────┼───────────┼────────┼───────────││
│  │ Enero    │ 🔒 CERRADO     │  12      │ ✅ Generado│ ✅     │ ✅        ││
│  │ Febrero  │ 🔒 CERRADO     │  18      │ ✅ Generado│ ✅     │ ✅        ││
│  │ Marzo    │ 🔒 CERRADO     │  15      │ ✅ Generado│ ✅     │ ✅        ││
│  │ Abril    │ 🔒 CERRADO     │  20      │ ✅ Generado│ ✅     │ ❌        ││
│  │ Mayo     │ 🔒 CERRADO     │  14      │ ✅ Generado│ ✅     │ ✅        ││
│  │ Junio    │ ✅ ABIERTO     │  22      │ ✅ Generado│ ✅     │ 🟡        ││
│  │ Julio    │ ✅ ABIERTO     │   8      │ ❌ No gen. │ ❌ No  │ ❌        ││
│  │ Agosto   │ ⬜ FUTURO      │  —       │  —         │  —     │  —        ││
│  │          │               │          │           │        │           ││
│  │ [🔒 Cerrar Junio]  [🔓 Reabrir (admin)]                                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 30.2 Estados de período

| Estado | Significado |
|---|---|
| 🔒 **CERRADO** | Período bloqueado. No se pueden crear/modificar asientos. Sí se puede leer y exportar |
| ✅ **ABIERTO** | Período activo. Se pueden crear asientos, generar libros |
| ⬜ **FUTURO** | Mes aún no disponible (no se puede operar en el futuro) |
| 🟡 **En proceso** | En proceso de cierre (verificaciones en curso) |

### 30.3 Requisitos para cerrar un período

Antes de cerrar, el sistema verifica:

1. ✅ **Libro IVA generado** para el período
2. ✅ **Retenciones** registradas
3. ✅ **Balance de sumas y saldos** cuadra (debe = haber)
4. ✅ **Depreciaciones** del mes calculadas
5. ✅ **Conciliaciones bancarias** del mes (recomendado, no obligatorio)
6. ✅ **No hay asientos en borrador** en el período

### 30.4 Paso a paso: Cerrar un mes

**Paso 1:** Haga clic en **"Cerrar Junio"** (o el mes correspondiente).

**Paso 2:** El sistema ejecuta las verificaciones automáticas. Si alguna falla, muestra el error:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠ No se puede cerrar Junio 2026                                   │
│                                                                       │
│  Los siguientes requisitos no están cumplidos:                       │
│  ❌ El Libro IVA no ha sido generado                                  │
│  ❌ Hay 3 asientos en borrador                                        │
│  ❌ Las retenciones de junio no están liquidadas                     │
│                                                                       │
│  [Solucionar]  [Cancelar]                                            │
└──────────────────────────────────────────────────────────────────────┘
```

**Paso 3:** Resuelva los problemas pendientes y vuelva a intentar.

**Paso 4:** Una vez que todas las verificaciones pasan, haga clic en **"Confirmar cierre"**.

**Paso 5:** Opcionalmente, escriba una **nota de cierre** (ej: "Cierre regular de junio 2026").

**Paso 6:** El cierre se registra en el **audit log** con usuario y timestamp.

**Paso 7:** El período cambia a **CERRADO** y ya no se pueden crear asientos en esa fecha.

### 30.5 Reapertura

Solo usuarios con rol **Administrador** pueden reabrir un período. Al hacerlo:
- Queda registrado en el audit log con motivo
- Se permite crear asientos retroactivos
- Todos los asientos retroactivos se marcan con el flag `allowRetroactive`

---

## 31. Módulo Estados Financieros

Genera los estados contables obligatorios: Balance de Sumas y Saldos, Balance General, Estado de Resultados.

### 31.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📊 Estados Financieros                       Período: [Julio 2026 ▼]       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Seleccionar estado:                                                     ││
│  │                                                                          ││
│  │  [● Balance de Sumas y Saldos]  [○ Balance General]  [○ Resultados]     ││
│  │  [○ Flujo de Efectivo]          [○ Evolución Patrimonial]               ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Balance de Sumas y Saldos                                                ││
│  │  Empresa: Estudio ABC S.A.      Fecha: 31/07/2026                       ││
│  │  Moneda: PYG (Guaraníes)                                                 ││
│  │                                                                          ││
│  │  Cuenta          │ Nombre                   │ Saldo Debe│ Saldo Haber  ││
│  │ ────────────────┼──────────────────────────┼──────────┼─────────────││
│  │  1.01.001       │ Caja                     │ 2.500.000 │              ││
│  │  1.01.002       │ Bancos                   │ 32.800.000│              ││
│  │  1.01.003       │ Clientes                 │ 12.400.000│              ││
│  │  2.01.001       │ Proveedores              │           │ 8.200.000   ││
│  │  3.01.001       │ Capital                  │           │ 30.000.000  ││
│  │  4.01.001       │ Ventas                   │           │ 15.300.000  ││
│  │  5.01.001       │ Compras                  │ 6.105.000 │              ││
│  │                 │                          │           │              ││
│  │                 │ TOTAL                    │ 53.805.000│ 53.805.000   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [📤 Exportar Excel]  [📤 Exportar PDF]  [📤 Exportar CSV]  [🖨 Imprimir]   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 31.2 Tipos de estados financieros

| Estado | Descripción |
|---|---|
| **Balance de Sumas y Saldos** | Lista todas las cuentas con sus saldos deudores y acreedores. Debe = Haber |
| **Balance General** | Activo = Pasivo + Patrimonio Neto. Muestra la situación patrimonial |
| **Estado de Resultados** | Ingresos - Egresos = Resultado del período |
| **Flujo de Efectivo** | Movimiento de efectivo: operativo, inversión, financiación |
| **Evolución Patrimonial** | Cambios en el patrimonio neto del período |

### 31.3 Paso a paso: Generar estado financiero

**Paso 1:** Seleccione el **período** en el selector superior.

**Paso 2:** Seleccione el **tipo de estado** con los radios.

**Paso 3:** El sistema genera automáticamente el estado en base a los asientos contables posteados.

**Paso 4:** Revise los saldos. Cada cuenta muestra su código, nombre, y saldo.

**Paso 5:** Verifique que el **total debe = total haber** (o activo = pasivo + patrimonio).

**Paso 6:** Exporte en el formato deseado (Excel, PDF, CSV) o imprima.

---

## 32. Módulo Calendario Fiscal

El calendario fiscal muestra las fechas de vencimiento de todas las obligaciones fiscales según el cronograma DNIT.

### 32.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📅 Calendario Fiscal                                 Año: [2026 ▼]         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Julio 2026                                                               ││
│  │                                                                          ││
│  │  Lu  │ Ma  │ Mi  │ Ju  │ Vi  │ Sá  │ Do  │                              ││
│  │ ─────┼─────┼─────┼─────┼─────┼─────┼─────│                              ││
│  │      │     │  1  │  2  │  3  │  4  │  5  │                              ││
│  │   6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │                              ││
│  │  13  │ 14  │🔴15 │ 16  │ 17  │ 18  │ 19  │                              ││
│  │  20  │ 21  │ 22  │ 23  │ 24  │ 25  │ 26  │                              ││
│  │  27  │ 28  │ 29  │ 30  │ 31  │      │      │                              ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  📋 Vencimientos de Julio:                                                    │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  15 🏛 IVA (Formulario 104) — Junio 2026              🔴 Vence hoy     ││
│  │     Estado: ✅ Pagado  |  Pagado el: 14/07/2026                        ││
│  │                                                                          ││
│  │  15 🏛 Retenciones (Formulario 120) — Junio 2026        🟡 Pendiente   ││
│  │     Estado: ⏳ No presentado                           │                ││
│  │     [✅ Pagar ahora]  [🔍 Ver detalle]                                  ││
│  │                                                                          ││
│  │  31 🏛 IRE anticipo — Julio 2026                       🟢 No vence     ││
│  │     Monto estimado: Gs. 700.000  |  Días restantes: 15               ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 32.2 Funcionalidades

| Función | Descripción |
|---|---|
| **Vista mensual** | Calendario con días marcados con vencimientos |
| **Código de colores** | 🔴 Vence hoy / 🟡 Próximo a vencer (1-3 días) / 🟢 Próximo (más de 3 días) |
| **Lista de vencimientos** | Detalle de cada obligación del mes |
| **Enlace a declaración** | Todo vencimiento tiene link directo al módulo de impuestos |
| **Notificaciones** | El sistema puede enviar recordatorios por email (configurable) |

### 32.3 Paso a paso: Usar el calendario

**Paso 1:** Entre a **Calendario Fiscal** desde la Sidebar.

**Paso 2:** Vea el mes actual con los vencimientos marcados.

**Paso 3:** Navegue entre meses con los botones ◀ ▶.

**Paso 4:** En la lista de vencimientos, haga clic en **"Pagar ahora"** o **"Ver detalle"** para cada obligación.

**Paso 5:** Use los filtros para ver solo ciertos tipos de obligaciones.

---

## 33. Módulo RG90

La RG90 (Resolución General 90) es la conciliación de comprobantes electrónicos exigida por la SET/DNIT. El sistema genera automáticamente el archivo necesario para la presentación.

### 33.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  📋 RG90 — Conciliación de Comprobantes       Período: [Julio 2026 ▼]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Resumen RG90                                                            ││
│  │                                                                          ││
│  │  Comprobantes emitidos:    47                                            ││
│  │  Comprobantes recibidos:   22                                            ││
│  │  Total emitidos (Gs.):     Gs. 125.300.000                               ││
│  │  Total recibidos (Gs.):    Gs. 48.200.000                                ││
│  │  Diferencia:               Gs. 77.100.000                                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Detalle de comprobantes emitidos                                        ││
│  │                                                                          ││
│  │  CDC               │ RUC Cliente │ Tipo    │ Fecha    │ Monto     │     ││
│  │ ──────────────────┼────────────┼─────────┼─────────┼──────────│     ││
│  │ 001-001-0001234...│ 80234567-8 │ Factura │ 02/07   │ 3.000.000│     ││
│  │ 001-001-0001235...│ 80234567-8 │ Factura │ 05/07   │ 1.500.000│     ││
│  │                                                                          ││
│  │  [📥 Descargar archivo RG90 (CSV)]  [📤 Exportar reporte]               ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Detalle de comprobantes recibidos                                        ││
│  │                                                                          ││
│  │  CDC               │ RUC Proveedor │ Tipo    │ Fecha    │ Monto     │   ││
│  │ ──────────────────┼──────────────┼─────────┼─────────┼──────────│   ││
│  │ 001-001-0001234...│ 80012345-6   │ Factura │ 03/07   │ 6.102.500│   ││
│  │ 001-003-0000456...│ 80123456-7   │ Factura │ 27/07   │ 2.350.000│   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [🔄 Generar RG90]  [👁 Verificar inconsistencias]                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 33.2 Paso a paso: Generar RG90

**Paso 1:** Seleccione el **período** a reportar.

**Paso 2:** Haga clic en **"Generar RG90"**.

**Paso 3:** El sistema recopila todos los comprobantes SIFEN del período y genera dos listas: emitidos y recibidos.

**Paso 4:** Haga clic en **"Verificar inconsistencias"** para identificar comprobantes que puedan faltar o tener errores.

**Paso 5:** Una vez conforme, haga clic en **"Descargar archivo RG90"** (formato CSV estándar SET).

**Paso 6:** El archivo descargado se puede importar directamente al aplicativo **Aranduka** de la SET.

### 33.3 Validaciones automáticas

| Validación | Descripción |
|---|---|
| CDC duplicado | Detecta si hay dos comprobantes con el mismo CDC |
| RUC inválido | Verifica que todos los RUC cumplen el formato |
| Timbrado vigente | Verifica que el timbrado del emisor está activo |
| Monto consistente | Verifica que el total del comprobante coincide con la suma de items |

---

## 34. Módulo Configuración

### 34.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ⚙ Configuración                                       Empresa actual:...   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─ General ───────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  Nombre de la empresa: [Estudio ABC S.A.                               ]││
│  │  RUC: [8.014.411-5]  (no editable después de creado)                    ││
│  │  Dirección: [Av. Mariscal López 1234, Asunción                        ]││
│  │  Teléfono: [(021) 123-456                                             ]││
│  │  Email: [info@estudioabc.com.py                                       ]││
│  │  Logo: [📁 Seleccionar archivo]  (recomendado: 200×200px, PNG)          ││
│  │                                                                          ││
│  │  Régimen tributario: [● General  ○ Simple  ○ Resimple]                 ││
│  │  Actividad económica: [Servicios de contabilidad ▼]                     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─ Preferencias ──────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  Moneda por defecto: [PYG ▼]                                            ││
│  │  Formato de fecha: [DD/MM/YYYY ▼]                                       ││
│  │  Idioma: [Español (PY) ▼]                                               ││
│  │  Zona horaria: [America/Asuncion ▼]                                     ││
│  │  Decimales: [2 ▼]                                                       ││
│  │  Notificaciones por email: [✅ Vencimientos  ✅ Errores  ✅ Informes]   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─ Integraciones ─────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  🔌 API Key para integraciones: [********************************] [Copiar]│
│  │  🔗 Webhook URL: [https://api.estudioabc.com.py/hooks/intelicont      ]││
│  │                                                                          ││
│  │  Conexiones activas:                                                     ││
│  │  ✅ Sueldok (RRHH)         — último sync: 27/07/2026                     ││
│  │  ✅ InteliMarket (ERP)     — último sync: 27/07/2026                     ││
│  │  ❌ InteliAudit (Auditoría) — reconectar                                ││
│  │  [🔗 Conectar nueva integración]                                        ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  ┌─ Miembros del equipo ──────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  Email                    │ Rol          │ Estado   │ Último acceso    ││
│  │ ─────────────────────────┼─────────────┼──────────┼─────────────────││
│  │ admin@estudioabc.com.py   │ Admin        │ 🟢 Activo│ 27/07/2026 10:30 ││
│  │ contador1@estudioabc.com  │ Contador     │ 🟢 Activo│ 26/07/2026 15:45 ││
│  │ asistente@estudioabc.com  │ Asistente    │ 🟢 Activo│ 25/07/2026 08:15 ││
│  │ cliente@estudioabc.com    │ Cliente      │ 🟢 Activo│ 20/07/2026 11:00 ││
│  │                                                                          ││
│  │ [✏ Editar rol]  [🔒 Desactivar]  [✕ Eliminar]  [+ Invitar miembro]    ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  [💾 Guardar cambios]                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 34.2 Secciones de configuración

| Sección | Descripción |
|---|---|
| **General** | Datos básicos de la empresa: nombre, RUC, dirección, régimen tributario |
| **Preferencias** | Moneda, formato de fecha, idioma, zona horaria, notificaciones |
| **Integraciones** | API keys, webhooks, conexiones con otros módulos Inteli* |
| **Miembros del equipo** | Gestión de usuarios de la empresa: roles, estado, invitaciones |

### 34.3 Paso a paso: Invitar un miembro

**Paso 1:** Vaya a la sección **Miembros del equipo**.

**Paso 2:** Haga clic en **"+ Invitar miembro"**.

**Paso 3:** Complete el formulario:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Invitar miembro al equipo                                          │
│                                                                       │
│  Email: [contador2@estudioabc.com.py                               ]│
│  Rol: [Contador ▼]                                                  │
│  Mensaje opcional: [Te invitamos a unirte al equipo de Estudio ABC│
│  para gestionar la contabilidad de nuestros clientes.]               │
│                                                                       │
│  [Enviar invitación]  [Cancelar]                                     │
└──────────────────────────────────────────────────────────────────────┘
```

**Paso 4:** Seleccione el **rol** del nuevo miembro.

**Paso 5:** (Opcional) Escriba un mensaje personalizado.

**Paso 6:** Haga clic en **"Enviar invitación"**.

**Paso 7:** El invitado recibe un email con un enlace mágico para registrarse.

**Paso 8:** Cuando el invitado acepta y accede, aparece en la lista con estado **Activo**.

### 34.4 Roles y permisos

| Rol | Puede crear | Puede postear | Puede cerrar | Puede configurar | Puede ver todo |
|---|---|---|---|---|---|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Contador** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Asistente** | ✅ | ❌ | ❌ | ❌ | ✅ (lectura) |
| **Auditor** | ❌ | ❌ | ❌ | ❌ | ✅ (solo lectura) |
| **Cliente** | ❌ | ❌ | ❌ | ❌ | Solo portal |

---

## 35. Módulo Auditoría

El módulo de auditoría registra todos los cambios realizados en el sistema. Es un libro inmutable de eventos.

### 35.1 Mock de la pantalla

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔍 Auditoría de Eventos                      Período: [Julio 2026 ▼]        │
│  [📤 Exportar] [🔄]                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  🔍 [Buscar por usuario, entidad, acción...]                                 │
│  Tipo: [Todos ▼]  Usuario: [Todos ▼]                                        │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │ 📋 Registro de eventos (últimos 50)                                      ││
│  │                                                                          ││
│  │  Fecha/Hora             │ Usuario       │ Acción        │ Entidad       ││
│  │ ────────────────────────┼──────────────┼──────────────┼──────────────││
│  │  27/07/2026 14:33:22   │ admin@...     │ POSTEAR       │ JournalEntry  ││
│  │                        │               │ JE-2026-045   │               ││
│  │  27/07/2026 14:30:01   │ admin@...     │ LOGIN         │ Session       ││
│  │  27/07/2026 11:15:44   │ contador1@... │ CREAR         │ Tercero       ││
│  │  27/07/2026 10:00:00   │ sistema@...   │ SYNC_SIFEN    │ SIFENFactura  ││
│  │  26/07/2026 17:45:12   │ admin@...     │ UPDATE        │ Empresa       ││
│  │  26/07/2026 16:30:00   │ admin@...     │ CERRAR_PERI   │ CierreMes    ││
│  │  25/07/2026 09:00:05   │ asistente@... │ IMPORTAR      │ SIFENFactura  ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                               │
│  Mostrando 1-10 de 1.234 eventos                        [1] [2] [3] [▶]     │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  Detalle del evento seleccionado                                        ││
│  │                                                                          ││
│  │  ID: 12345  |  Fecha: 27/07/2026 14:33:22  |  Usuario: admin@...       ││
│  │  Acción: POSTEAR  |  Entidad: JournalEntry  |  ID Entidad: 45           ││
│  │                                                                          ││
│  │  Metadatos:                                                              ││
│  │  {                                                                       ││
│  │    "asientoId": 45,                                                      ││
│  │    "numero": "JE-2026-045",                                              ││
│  │    "fecha": "2026-07-27",                                                ││
│  │    "totalDebe": 6105000,                                                 ││
│  │    "totalHaber": 6105000,                                                ││
│  │    "estadoAnterior": "BORRADOR",                                         ││
│  │    "estadoNuevo": "POSTEADO"                                             ││
│  │  }                                                                       ││
│  │                                                                          ││
│  │  IP: 192.168.1.100  |  User-Agent: Mozilla/5.0...                       ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 35.2 Tipos de eventos registrados

| Acción | Descripción |
|---|---|
| **LOGIN** | Inicio de sesión (incluye magic link y contraseña) |
| **LOGOUT** | Cierre de sesión |
| **CREAR** | Creación de una entidad (asiento, tercero, empresa, etc.) |
| **UPDATE** | Modificación de una entidad (antes/después registrados) |
| **DELETE** | Eliminación (solo borradores, asientos posteados NUNCA se eliminan) |
| **POSTEAR** | Posteo de asiento (cambio de borrador a definitivo) |
| **REVERSAR** | Reversión de asiento |
| **CERRAR_PERI** | Cierre de período contable |
| **REABRIR_PERI** | Reapertura de período |
| **IMPORTAR** | Importación de SIFEN, CSV, etc. |
| **EXPORTAR** | Exportación de reportes |
| **SYNC_SIFEN** | Sincronización con SIFEN |
| **ERROR** | Error del sistema registrado |
| **CONFIG** | Cambio en configuración del sistema |

### 35.3 Características del módulo

| Característica | Descripción |
|---|---|
| **Inmutabilidad** | Los eventos de auditoría NO se pueden modificar ni eliminar (append-only) |
| **Filtros** | Por usuario, acción, entidad, fecha, empresa |
| **Detalle** | Cada evento muestra metadatos completos con estado anterior y nuevo |
| **Búsqueda** | Búsqueda de texto libre sobre todos los campos |
| **Exportación** | Exportable a CSV para análisis externo |
| **Retención** | Los eventos se conservan por 5 años (requisito fiscal PY) |

---

## 36. Apéndice: Glosario de términos PY

| Término | Significado |
|---|---|
| **SET** | Subsecretaría de Estado de Tributación (ahora DNIT) |
| **DNIT** | Dirección Nacional de Ingresos Tributarios (nueva entidad unificada desde 2025) |
| **RUC** | Registro Único del Contribuyente. Formato: X.XXX.XXX-X |
| **Timbrado** | Autorización fiscal de 8 dígitos para emitir comprobantes |
| **CDC** | Código de Control de 44 dígitos generado por el SIFEN |
| **SIFEN** | Sistema de Facturación Electrónica Nacional |
| **KuDE** | Kude (representación gráfica del comprobante electrónico, formato PDF) |
| **Hechauka** | Libro Electrónico mensual (en guaraní: "registro") |
| **Aranduka** | Aplicativo de la SET para presentación de libros (en guaraní: "libro") |
| **Tesaka** | Sistema de retenciones (en guaraní: "retención") |
| **IVA** | Impuesto al Valor Agregado. Tasas: 10% (general), 5% (diferenciado), exento |
| **IRE** | Impuesto a la Renta Empresarial. Regímenes: General (IRE), Simple (IRES), Resimple |
| **IRP** | Impuesto a la Renta Personal |
| **INR** | Impuesto a la Renta de No Residentes |
| **IDU** | Impuesto a los Dividendos y Utilidades |
| **Formulario 104** | Declaración de IVA |
| **Formulario 120** | Declaración de Retenciones |
| **Formulario 501** | Declaración de IRE |
| **Formulario 400** | Declaración de IRP |
| **Formulario 250** | Declaración de IDU |
| **RG90** | Resolución General 90: conciliación de comprobantes electrónicos |
| **Doble partida** | Principio contable: todo débito tiene un crédito de igual monto |
| **Libro diario** | Registro cronológico de todos los asientos contables |
| **Plan de cuentas** | Catálogo jerarquizado de cuentas contables |
| **Balance de sumas y saldos** | Listado de cuentas con saldos deudores y acreedores |
| **Balance general** | Estado financiero: Activo = Pasivo + Patrimonio Neto |
| **Estado de resultados** | Ingresos - Egresos = Resultado del ejercicio |
| **Período contable** | Mes calendario. Se cierra para evitar modificaciones retroactivas |
| **Hechauka** | Libro electrónico mensual obligatorio (IVA compras + ventas) |
| **Contra-asiento** | Asiento que invierte otro. Mecanismo de corrección en libro inmutable |
| **Estudio contable** | Empresa que brinda servicios de contabilidad a terceros |
| **PYME** | Pequeña y Mediana Empresa |
| **InteliAsistente** | Motor de IA de InteliCont que sugiere asientos automáticamente |

---

## 37. Apéndice: Solución de problemas

### 37.1 Problemas de login

| Problema | Causa probable | Solución |
|---|---|---|
| **No recibo el magic link** | El email no está registrado o está en spam | Verifique la bandeja de spam. Si pasaron 5 minutos, solicite otro. Si el problema persiste, contacte al administrador |
| **El enlace mágico no funciona** | El enlace expiró (más de 1 hora) | Solicite un nuevo enlace desde la pantalla de login |
| **"Email no registrado"** | La cuenta fue creada con otro email | Contacte al administrador para verificar el email correcto |
| **Error 500 al iniciar sesión** | Problema temporal del servidor | Espere 5 minutos y reintente. Si persiste, contacte a soporte |

### 37.2 Problemas de SIFEN

| Problema | Causa probable | Solución |
|---|---|---|
| **La factura no aparece al importar** | El CDC ya fue importado (duplicado) | Busque en el historial con el filtro de fecha. Si no aparece, espere 10 minutos y reintente |
| **Error "Timbrado inválido"** | El timbrado no está registrado o está vencido | Verifique el timbrado en el módulo Timbrados. Si está vencido, solicite uno nuevo |
| **Error de validación CDC** | El CDC tiene 44 dígitos pero no pasa validación | Verifique que el CDC sea correcto (puede tener error de tipeo) |
| **La IA no sugiere asiento** | El comprobante es de un tipo no soportado | Cree el asiento manualmente en el módulo Asientos |
| **El archivo XML no se procesa** | El XML está corrupto o no es válido | Descargue nuevamente el XML del SIFEN e intente de nuevo |

### 37.3 Problemas de asientos

| Problema | Causa probable | Solución |
|---|---|---|
| **No puedo postear el asiento** | No está balanceado (débito ≠ crédito) | Revise las líneas. La suma de débitos debe ser igual a la de créditos |
| **Error "Período cerrado"** | La fecha del asiento cae en un mes cerrado | Cambie la fecha a un período abierto o solicite al admin que reabra el período |
| **"Cuenta no existe"** | La cuenta no está en el plan de cuentas | Agregue la cuenta al plan de cuentas o seleccione una existente |
| **No veo el asiento en el listado** | El filtro de período está mal seleccionado | Verifique el período en el filtro superior |
| **Quiero eliminar un asiento posteado** | No es posible (libro inmutable) | Cree un contra-asiento de reversión |

### 37.4 Problemas de cierre

| Problema | Causa probable | Solución |
|---|---|---|
| **No puedo cerrar el mes** | Hay requisitos incumplidos | Vea la lista de requisitos en el modal de error y resuélvalos |
| **Faltan asientos en el período** | Hay asientos en borrador | Postee o elimine los borradores antes de cerrar |
| **El balance no cuadra** | La suma de debe ≠ haber en algún asiento | Revise todos los asientos del período. Genere el balance de sumas y saldos |

### 37.5 Problemas de visualización

| Problema | Causa probable | Solución |
|---|---|---|
| **La pantalla se ve mal (desordenada)** | El navegador no está actualizado o tiene caché vieja | Presione Ctrl+F5 (Cmd+Shift+R en Mac) para recargar sin caché |
| **No se ven todos los botones** | La resolución de pantalla es muy baja | Aumente la resolución a 1280×720 o más. Use la vista de escritorio |
| **El calendario no carga** | Problema de librería JavaScript | Recargue la página. Si persiste, borre la caché del navegador |

### 37.6 Contacto y soporte

| Canal | Detalle |
|---|---|
| **Email** | soporte@intelicont.com.py |
| **WhatsApp** | +595 981 123 456 |
| **Horario** | Lunes a viernes de 8:00 a 18:00 |
| **Tiempo de respuesta** | 2 horas máximo en horario laboral |
| **Documentación** | docs.intelicont.com.py |
| **Estado del sistema** | status.intelicont.com.py |

---

## 38. Apéndice: Atajos de teclado

### 38.1 Atajos globales

| Atajo | Acción |
|---|---|
| **⌘K** / **Ctrl+K** | Abrir paleta de comandos |
| **⌘⇧K** / **Ctrl+Shift+K** | Abrir paleta de comandos en modo acción |
| **⌘B** / **Ctrl+B** | Alternar barra lateral (Sidebar) |
| **⌘E** / **Ctrl+E** | Abrir selector de empresa (Entity Switcher) |
| **⌘,** / **Ctrl+,** | Ir a Configuración |
| **⌘Q** / **Ctrl+Q** | Cerrar sesión |
| **⌘/** / **Ctrl+/** | Mostrar este panel de atajos |
| **⌘1-9** / **Ctrl+1-9** | Ir al módulo N de la Sidebar (ordenados) |

### 38.2 Atajos de navegación

| Atajo | Acción |
|---|---|
| **G + D** | Ir a Dashboard |
| **G + A** | Ir a Asientos |
| **G + S** | Ir a SIFEN |
| **G + E** | Ir a Empresas |
| **G + C** | Ir a Comprobantes |
| **G + P** | Ir a Plan de Cuentas |
| **G + T** | Ir a Tesorería |
| **G + I** | Ir a Impuestos |
| **G + R** | Ir a Retenciones (Tesaka) |
| **G + L** | Ir a Libro IVA |
| **G + F** | Ir a Estados Financieros |
| **G + K** | Ir a Calendario Fiscal |
| **G + G** | Ir a Configuración |
| **G + U** | Ir a Auditoría |
| **G + O** | Ir a Activos Fijos |
| **G + B** | Ir a Bancos |
| **G + H** | Ir a Caja Chica |
| **G + M** | Ir a Terceros |
| **G + N** | Ir a Timbrados |
| **G + 9** | Ir a RG90 |

### 38.3 Atajos del módulo Asientos

| Atajo | Acción |
|---|---|
| **N** | Nuevo asiento (desde el listado) |
| **⌘Enter** / **Ctrl+Enter** | Postear asiento (desde el formulario) |
| **⌘S** / **Ctrl+S** | Guardar borrador |
| **⌘⇧Enter** / **Ctrl+Shift+Enter** | Postear asiento directamente |
| **Esc** | Cancelar / Cerrar modal |
| **⌘Z** / **Ctrl+Z** | Deshacer última línea |
| **⌘⇧Z** / **Ctrl+Shift+Z** | Rehacer línea |
| **→** (desde listado) | Abrir detalle del asiento |
| **R** (desde detalle) | Reversar asiento |

### 38.4 Atajos del formulario de asiento

| Tecla | Acción |
|---|---|
| **Tab** | Siguiente campo en la línea actual |
| **Shift+Tab** | Campo anterior |
| **Enter** (en último campo) | Nueva línea |
| **↑** | Ir a línea anterior |
| **↓** | Ir a línea siguiente |
| **Delete** (en línea vacía) | Eliminar línea |
| **⌘Backspace** / **Ctrl+Backspace** | Eliminar línea actual |

### 38.5 Atajos del módulo SIFEN

| Atajo | Acción |
|---|---|
| **U** | Ir a carga (upload) |
| **H** | Ir a historial |
| **E** | Ir a emitir |
| **⌘I** / **Ctrl+I** | Importar archivos |
| **⌘⇧I** / **Ctrl+Shift+I** | Sincronizar SIFEN |
| **A** (en pendiente) | Aprobar y contabilizar |
| **X** (en pendiente) | Rechazar/descartar |

### 38.6 Atajos de búsqueda y filtros

| Atajo | Acción |
|---|---|
| **⌘F** / **Ctrl+F** | Enfocar campo de búsqueda |
| **⌘⇧F** / **Ctrl+Shift+F** | Abrir panel de filtros |
| **Esc** (en búsqueda) | Limpiar búsqueda y salir |

---

> **Fin del Manual de Usuario — InteliCont v1.0.0**  
> *Este manual cubre todas las funcionalidades del sistema. Para consultas adicionales, contacte a soporte@intelicont.com.py*
