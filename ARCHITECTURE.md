# Arquitectura — InteliCont

Diseño técnico y decisiones estructurales del sistema contable InteliCont.

---

## 🏛️ Estilo Arquitectónico

- **Monorepo**: Turborepo con gestor de paquetes `pnpm` (versión 12.14).
- **Enfoque**: Monolito modular con separación limpia entre frontend, lógica de dominio contable y núcleo de tipos.
- **Transaccionalidad Fail-Closed**: Toda mutación contable corre bajo contexto transaccional en PostgreSQL con políticas RLS activas por sesión.

---

## 📦 Estructura de Paquetes

```
intelicont/
├── apps/
│   └── web/                   # Next.js 15 (App Router, UI shadcn/ui, tRPC server)
│       ├── src/
│       │   ├── app/           # Rutas públicas, protegidas y endpoints REST
│       │   ├── components/    # Componentes React interactivos
│       │   ├── lib/           # Better Auth, logger pino, navigation config
│       │   └── trpc/          # Middlewares (logging, auth, idempotencia) y routers
├── packages/
│   ├── core/                  # Dinero entero (Money/assertMoney), Result<T, E>
│   └── ledger/                # Dominio contable central
│       ├── db/                # Drizzle schema, repositorio, transacciones withTenant
│       └── src/               # Usecases, reglas fiscales PY, parser SIFEN, Registro 955
├── infra/                     # Despliegue Docker / Coolify y scripts de backup
└── docs/                      # Especificaciones y guías del sistema
```

---

## 🧩 Capas y Patrones

### 1. Transacciones y Tenancy (`withTenant` & `tenantDb`)
* **`withTenant(userId, fn)`**: Punto de entrada obligatorio en routers tRPC y acciones de servidor. Abre una conexión transaccional con Postgres y configura en variables de sesión locales `app.user_id` y `app.entity_ids`.
* **`tenantDb(fn)`**: Acceso interno fail-closed utilizado en repositorios; falla inmediatamente si no se encuentra dentro de un contexto `withTenant` activo.
* **Patrón de Dos Fases para IA**: Nunca se realizan llamadas de E/S lenta (red, archivos, invocación a Ollama) dentro de una transacción `withTenant`. Los routers leen en una transacción corta, invocan el modelo local de forma aislada, y finalmente aplican la mutación en otra transacción corta con idempotencia garantizada.

### 2. Idempotencia (`idempotentProcedure`)
* Toda mutación en tRPC valida el encabezado `Idempotency-Key` (UUID). Si la clave ya fue ejecutada por el usuario en ese endpoint, devuelve el resultado anterior directamente desde la tabla `idempotency_keys` sin tocar el ledger.

### 3. Modelo de Dinero Entero
* Todos los montos contables se almacenan como `bigint` en guaraníes sin decimales.
* El desglose de IVA sobre importes brutos con IVA incluido se calcula con fórmulas determinísticas de enteros (`ivaFromGross`).

### 4. Vistas SQL y Libros Contables
* Los reportes oficiales (Libro Diario, Mayor, Libro IVA) no calculan agregaciones complejas en Node.js; se alimentan de vistas SQL nativas (`v_diario`, `v_mayor`, `v_libro_iva`) configuradas con `WITH (security_invoker = true)` para respetar el RLS del usuario conectado.

---

## 🤖 Integración de Inteligencia Artificial

- **IA Local Primero**: Motor de sugerencias contables basado en modelos locales ejecutados en Ollama (`qwen2.5:7b`), manteniendo los datos contables y fiscales estrictamente dentro de la infraestructura del estudio contable.
- **Humano en el Loop**: Las sugerencias no postean asientos de forma autónoma. Se presentan en la bandeja de revisión con un puntaje de confianza (`confidence`), justificación contable y requieren la aprobación manual del contador.

---

## 📊 Observabilidad y Registro

- Logs estructurados con **Pino** correlacionados mediante `requestId`, `userId`, `entityId` y duración en milisegundos (`durationMs`).
- Filtro `safeErrorInfo` para evitar filtraciones de PII, XMLs o fragmentos de sentencias SQL en los registros.
