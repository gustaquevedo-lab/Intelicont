# Rebanada vertical real: del XML SIFEN al Registro de Comprobantes (955/956)

Fecha: 2026-10-21 · Estado: **rev. 2**, borrador para revisión · Autor: Claude (con Gustavo)

Cambios de la rev. 2 (pedidos por Gustavo): dinero entero sin decimales; sin magic links en esta etapa;
IA con modelos locales; despliegue en Vercel; Hechauka reemplazado por el formato oficial de
*Registro de Comprobantes* de Marangatu (PDF "Especificación Técnica", junio 2021); trabajo en modo
ponytail (§3).

## 1. Por qué existe este spec

La auditoría del 2026-10-21 contra PRD/ROADMAP/BACKLOG mostró que InteliCont es hoy un prototipo de UI
(31 pantallas, la mayoría con datos `MOCK_*` o stores locales que se pierden al recargar) sobre una base
real: Postgres propio en `dev-server` con RLS e inmutabilidad del libro (migración `0001`). No existen:
auth real, usuarios↔empresas, persistencia de empresas/terceros/plan de cuentas, IA real, auditoría
automática, libros sobre datos reales ni exportador fiscal verificado.

Táctica: **una rebanada vertical real antes de ampliar a lo ancho**, porque es lo que un estudio contable
evalúa primero y donde Expert360 es más débil (carga manual, sin IA).

## 2. Resultado esperado

Un contador, sin datos de ejemplo, puede:

1. Iniciar sesión (email + contraseña; 2FA TOTP obligatorio para admins) y ver **solo sus empresas**.
2. Crear una empresa (RUC validado, régimen IVA General, plan de cuentas seed PY, período abierto).
3. Subir un XML SIFEN recibido → ver el comprobante validado (RUC, timbrado, CDC, IVA) y una
   **propuesta de asiento con confianza, razón y fuentes** → editar/aprobar → queda **posteado**.
4. Cargar un comprobante manual con retenciones calculadas por el motor y su asiento.
5. Ver Diario, Mayor, Sumas y Saldos y Libro IVA **calculados desde la base**, con drill-down hasta el
   asiento y el comprobante.
6. Obtener el **Form 104** del mes con montos iguales al Libro IVA.
7. Descargar el **archivo de Registro de Comprobantes** (obligación 955) del mes, `.zip` con el nombre y
   formato exactos de la especificación oficial.
8. Revertir un asiento (contra-asiento) y ver el rastro en auditoría.

Reproducible como test e2e Playwright (`slice.spec.ts`) sobre una base descartable.

Métricas: 0 diferencias entre Libro IVA y Form 104; 100 % de mutaciones con fila en `audit_events`;
cobertura ≥ 90 % en `ledger`, `fiscal-py` y `retentions`; XML → propuesta de asiento ≤ 5 s con el camino
por reglas (el modelo local se usa solo cuando las reglas no alcanzan, ver D5).

## 3. Modo de trabajo: ponytail

Todo el desarrollo de esta rebanada sigue ponytail (nivel *full*): el cambio más chico que resuelve el
problema completo; reutilizar lo que ya existe (`withTenant`, `repository.ts`, `fiscal-py.ts`,
`retentions-engine.ts`, `sifen-parser.ts`, `bank-*`) antes de escribir código nuevo; sin dependencias para
pocas líneas; un test o autochequeo para toda lógica no trivial; atajos con límite conocido llevan el
comentario `shortcut: <límite>, <cuándo mejorar>`. Consecuencias ya aplicadas en este spec: sin
`decimal.js`, sin Sentry/PostHog en esta etapa, sin vistas materializadas, sin proveedor de IA remoto,
sin SMTP. Cada línea de trabajo es un PR chico.

## 4. Alcance

**Dentro:** auth + membresías, empresas, plan de cuentas, terceros, períodos, ingesta XML SIFEN con IA
local, carga manual con retenciones, posteo y reversión, Diario/Mayor/Sumas y Saldos, Libro IVA, Form 104,
Registro de Comprobantes **tipos 1 (ventas) y 2 (compras)**, auditoría automática, Idempotency-Key,
logs estructurados, CI con gates reales.

**Fuera (fases posteriores):** Registro tipos 3 (ingresos) y 4 (egresos); obligación 956 (anual);
bancos, cierre, activos, AR/AP completo, 500v3/120v4, EEFF, integraciones Inteli*, NIIF, consolidación,
portal, REST `/v1`/OpenAPI, emisión SIFEN, magic links, Sentry/PostHog. Sus pantallas actuales con datos
de ejemplo se marcan "vista previa" y se ocultan del menú.

## 5. Decisiones de diseño

### D1. Autenticación propia sobre el mismo Postgres, sin magic links
**Better Auth** con adapter Drizzle: email + **contraseña** + TOTP 2FA (obligatorio para admins), sesiones
de 8 h. Sin SMTP en esta etapa: la verificación de email y el "olvidé mi contraseña" quedan para cuando
haya correo; mientras tanto el restablecimiento lo hace un admin (script). Se eliminan `@supabase/*` y
`lib/supabase/*`.

*Descartado:* magic link (necesita SMTP y no aporta a la rebanada), Supabase self-hosted, Auth.js.

### D2. Membresías y alcance de tenant
Tabla `memberships(user_id, entity_id, role, permissions jsonb)` (roles `admin/accountant/assistant/
auditor/client`). El resolver de `withTenant` (hoy `DEV_ENTITY_IDS`) lee las empresas de la sesión, y cada
request fija `app.user_id`. `DEV_ENTITY_IDS` se elimina. Alta de empresa con función `SECURITY DEFINER
create_entity()` que crea la empresa **y** la membresía `admin` en una transacción. RLS en `memberships`.

### D3. Auditoría automática
`audit_events` se escribe **en la misma transacción** de cada mutación de dominio, vía un helper
`audited(db, event, fn)`; un test falla si un caso de uso mutador no emite evento. Los triggers ya
protegen la tabla como append-only.

### D4. Idempotencia
Tabla `idempotency_keys(user_id, endpoint, key, request_hash, response)` única por
`(user_id, endpoint, key)`. Los procedures mutadores exigen `Idempotency-Key`; misma clave y mismo hash
devuelve la respuesta guardada, distinto hash responde 422.

### D5. IA con modelos locales y humano en el loop
Regla del proyecto: **modelos locales**. `dev-server` ya corre **Ollama** (puerto 11434) con
`qwen2.5:3b` y `qwen2.5:7b`, solo CPU (16 vCPU, sin GPU). Interfaz `AIProvider` con dos implementaciones:
`RuleBasedProvider` (el actual `suggestJournalEntry`, instantáneo) y `OllamaProvider`
(`/api/chat` con `format: json`, salida validada con zod). Flujo: reglas primero; el modelo local solo
clasifica cuando las reglas no tienen cuenta con confianza suficiente. Cada propuesta devuelve
`{ value, confidence, rationale, sources[] }` y se guarda en `ai_decisions`. Nunca se postea sin
aprobación humana (regla 7). Sin Ollama o ante timeout, vale el resultado por reglas y la UI lo indica.
Ventaja: los datos no salen del servidor (Ley 6534/20). El modelo se elige por medición con comprobantes
reales, no por supuesto.

### D6. Dinero entero, sin decimales
El dinero es un **entero en la unidad mínima de su moneda** (guaraníes para PYG, exponente 0). En la BD,
`bigint` en lugar de `numeric(20,4)`; en TypeScript, `number` entero validado con `Number.isSafeInteger`
en los bordes (`shortcut: límite 2^53 ≈ 9×10^15 Gs, pasar a bigint si se supera`). Sin `decimal.js`.
`fx_rate` y cantidades siguen siendo `numeric` porque no son dinero. El IVA se calcula sobre importes con
IVA incluido y se redondea al entero: `iva10 = round(gravado10 / 11)`, `iva5 = round(gravado5 / 21)`.
Moneda extranjera (USD, etc.): mismo tipo en su unidad mínima (centavos); `amount_base` en guaraníes.
Esto reemplaza la regla 9 del CLAUDE.md (`numeric(20,4)` + Decimal) y `DATA_MODEL.md` (ver W13).

### D7. Estructura de código
Convención `src/modules/<feature>/{api,domain,infra,ui}` **solo para lo que la rebanada toca**; el resto
queda donde está. Módulos nuevos: `identity`, `entities`, `ledger` (`postJournalEntry`,
`reverseJournalEntry`), `fiscal-documents`, `books`, `tax-forms`. Lógica fiscal pura en `packages/fiscal-py`
(ya existe como `packages/ledger/src/fiscal-py.ts`; se mueve cuando haga falta, no antes).

### D8. Registro de Comprobantes (reemplaza a Hechauka)
Según la especificación oficial (junio 2021), el Registro de Comprobantes unifica Hechauka, Aranduka y el
registro de IRPC. Obligación **955** mensual / **956** anual. Reglas que el exportador debe cumplir:

- **Archivo:** `.csv` (comas) o `.txt` (tabulaciones), UTF-8, **sin fila de títulos**, comprimido en `.zip`
  con el mismo nombre. Nombre: `<RUC sin DV>_REG_MMAAAA_XXXXX` (955) o `<RUC>_REG_AAAA_XXXXX` (956),
  `XXXXX` alfanumérico de hasta 5 posiciones, distinto por archivo. Máximo **5.000 filas** por archivo.
- **No incluir** comprobantes electrónicos e-Kuatia/SIFEN ni comprobantes virtuales: Marangatu los obtiene
  directamente. El exportador solo emite comprobantes **no electrónicos**.
- **Ventas (tipo 1), 19 campos:** tipo de registro; tipo y número de identificación del comprador (RUC sin
  DV); nombre (omitible si es RUC, cédula o "sin nombre"); tipo de comprobante (Tabla 4); fecha
  `dd/mm/aaaa`; timbrado (8 dígitos); número `###-###-#######`; gravado 10 %; gravado 5 %; exento; total
  (= suma de los tres); condición (1 contado, 2 crédito); moneda extranjera S/N; imputa IVA / IRE /
  IRP-RSP (S/N); comprobante y timbrado asociados (obligatorios para notas de crédito 110 y débito 111).
- **Compras (tipo 2), 20 campos:** igual, más "NO IMPUTA" (S/N). Excepciones por tipo: 101 autofactura,
  112 ticket, 104 boleta ReSimple y 105 loterías solo informan el total; 107 despacho de importación lleva
  timbrado 0 y sin número; 106 y 112 sin número.
- **Montos:** enteros positivos sin decimales, punto como separador de miles opcional (coherente con D6).
- **Fechas:** no anteriores al 01/01/2021 salvo comprobantes a crédito.
- Cada comprobante se imputa al menos a una obligación (IVA, IRE o IRP-RSP) activa a la fecha de emisión.
- **Tablas de códigos** (tipos de registro, condición, identificación, comprobante, S/N) tomadas del PDF y
  versionadas con `effective_from`.

**Discrepancia a verificar:** el texto del PDF dice "delimitado por comas", pero sus filas de ejemplo
usan **punto y coma**. Se resuelve probando una importación real en Marangatu antes de dar por válido el
exportador. Las filas de ejemplo del PDF son los primeros fixtures de prueba.

El `hechauka.ts` actual (columnas separadas de IVA, datos de ejemplo) **no cumple** este formato: se
reemplaza por `registro-comprobantes.ts` y la ruta `/fiscal/hechauka` pasa a `/fiscal/registro-comprobantes`.

Además: el algoritmo de RUC pasa al módulo 11 estándar de la DNIT (pesos 2 a 11 de derecha a izquierda;
resto 0 o 1 da DV 0, si no 11 − resto) y valida también personas físicas. **Verificado el 2026-10-22 con
RUC reales:** 80144114-5, 80005427-0, 80120610-3 y, del XML SIFEN real, 80014066-4 y 4631314-1 coinciden
con ese algoritmo; el código actual rechaza los tres primeros. Pendiente de confirmar con Gustavo:
**80150477-9** (el algoritmo da DV 5; posible error de tipeo). El XML real también mostró que el CDC
`01800140664024004004999422026080911264669314` tiene DV 4 correcto con el mismo algoritmo, que
`cdc-generator.validateCDCStructure` lo rechaza (esperaba 1) y que `parseSifenXML` **devuelve `null`**
con un XML SIFEN v150 real: usa nombres de etiqueta inventados (`dTimbrado`, `dNroEstab`, `dRucEmis`…)
en lugar de los reales (`dNumTim`, `dEst`, `dRucEm`…) y depende de `DOMParser`, que no existe en el
servidor. W6 reescribe el parser.

### D9. Timbrados como maestro
Tabla `timbrados(entity_id|partner_id, number, valid_from, valid_to, establishment, point, doc_type)`.
El timbrado se valida contra vigencia **a la fecha de la operación**.

### D10. Reversión por contra-asiento
`reverseJournalEntry(entryId, reason)` crea el asiento inverso con `reversal_of` y lo postea; el original
no se toca (la BD prohíbe marcarlo `reversed`; el estado "reversado" de UI se **deriva**).

### D11. Reportes desde la base
Diario, Mayor, Sumas y Saldos y Libro IVA son consultas SQL (vistas simples) con `entry_id`/`document_id`
para el drill-down. Sin materialización hasta que una medición la exija.

### D12. Despliegue: **decidido — opción A** (front en `dev-server` con Coolify; Vercel solo para previews)
El proyecto `intelicont` ya existe en Vercel. Pero el Postgres escucha solo en `127.0.0.1:5440` de
`dev-server` (accesible por túnel SSH/Tailscale) y Ollama está en el mismo servidor: **Vercel (funciones
serverless) no puede alcanzarlos** porque no entra a la tailnet. Opciones:

| Opción | Costo/riesgo |
|---|---|
| **A. Correr el front en `dev-server` (Coolify, Traefik ya en 80/443)** y dejar Vercel para previews | Una sola máquina para app, BD e IA; sin exponer Postgres. **Recomendada.** |
| B. Mantener Vercel y exponer Postgres con TLS + lista de IPs (IPs estáticas de Vercel de pago) | Superficie de ataque nueva y costo mensual; Ollama también quedaría inaccesible |
| C. Vercel + capa API pública fina en `dev-server` | Más código y otra pieza que mantener |

Gustavo eligió A el 2026-10-22. El contenedor de la app se une a la red Docker `intelicont-net`, donde
también vive `intelicont-pg`, y alcanza Ollama en el host; Postgres sigue sin publicarse a la red. En
desarrollo se sigue usando el túnel SSH.

## 6. Cambios de datos (migraciones)

| Migración | Contenido |
|---|---|
| `0002_money_integer` | columnas de dinero `numeric(20,4)` → `bigint` (journal_lines, tax_documents, tax_document_lines, retentions, bank_movements); se recalcula el seed |
| `0003_identity` | tablas de Better Auth, `memberships` (+RLS), `create_entity()` |
| `0004_audit_idempotency` | `idempotency_keys`; `app.user_id` en helpers |
| `0005_registro_comprobantes` | en `tax_documents`: código de tipo de comprobante (Tabla 4), tipo de identificación de la contraparte, imputa IVA/IRE/IRP/no imputa, moneda extranjera, comprobante y timbrado asociados; tabla `timbrados` |
| `0006_calendar_views` | `tax_calendar` por terminación de RUC y vistas de libros |

Cada migración incluye RLS y se cubre en la suite de aislamiento. `schema.ts` se sincroniza con lo que hoy
solo existe en SQL.

## 7. Líneas de trabajo y aceptación

| ID | Trabajo | Aceptación |
|---|---|---|
| W0 | Dinero entero (D6, `0002`) | Sin `parseFloat` en el flujo contable; seed y tests en enteros; IVA con redondeo definido |
| W1 | Auth con contraseña + 2FA (D1) y middleware real | Sin sesión → `/login`; usuario A no ve empresas de B |
| W2 | Membresías, `create_entity`, resolver (D2) | `DEV_ENTITY_IDS` eliminado |
| W3 | Persistencia de empresas, plan de cuentas, terceros, períodos | Recargar conserva los datos |
| W4 | `postJournalEntry`/`reverseJournalEntry` + auditoría (D3, D10) | Cada caso de uso emite `audit_events`; cobertura ≥ 90 % |
| W5 | Idempotencia (D4) | Un reintento no duplica asientos |
| W6 | Ingesta XML + validaciones + IA local (D5, D8, D9) | XML real → comprobante + propuesta; `ai_decisions` poblada |
| W7 | Carga manual + motor de retenciones cableado | Retención calculada y asentada |
| W8 | Libros y Libro IVA (D11) | Números = SQL de control; drill-down |
| W9 | Form 104 y Registro de Comprobantes 955 (D8) | Archivo idéntico a los ejemplos del PDF; importación real aceptada por Marangatu; 104 = Libro IVA |
| W10 | `tax_calendar` y avisos 7/3/1 días | Vencimientos por terminación de RUC en BD |
| W11 | Logs estructurados (pino) con requestId/entityId/userId | Visibles en la consola del servidor |
| W12 | CI con gates reales | Lint que falla el build (hoy se ignora), cobertura mínima, e2e de la rebanada, migraciones a BD efímera |
| W13 | Honestidad y documentación | Pantallas fuera de alcance como "vista previa"; corregir README y `docs/API.md` (formularios 104/106/500v3/120, no 703/1301/115), regla 9 del CLAUDE.md y `DATA_MODEL.md` (dinero entero), `FISCAL_PY_RULES.md` (Registro de Comprobantes) |

Orden: **W0** primero (barato ahora, caro después) → W1→W2→W3→W4→W5 → W6→W7 → W8→W9→W10; W11–W13 en
paralelo.

## 8. Pruebas

- **Unitarias** (Vitest): dominio puro y `fiscal-py` con vectores de RUC/CDC/IVA/retenciones.
- **BD**: los 31 casos de aislamiento/inmutabilidad de hoy pasan a ser tests permanentes contra un
  Postgres efímero (contenedor en CI; base descartable en `dev-server` en local).
- **Integración**: casos de uso con roles `migrator`/`app` como en producción.
- **Exportador**: fixtures con las filas de ejemplo del PDF de Marangatu; prueba de nombre de archivo,
  límite de 5.000 filas, total = suma de gravados, notas de crédito con comprobante asociado.
- **E2E** (Playwright): `slice.spec.ts` recorre los 8 pasos del §2.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Delimitador del archivo (coma vs punto y coma) | Importación real de prueba en Marangatu antes de W9 |
| Algoritmo de RUC erróneo hoy | Corregir primero con vectores reales |
| IA local lenta (CPU) o imprecisa | Reglas primero, modelo solo para ambigüedad, medir con comprobantes reales |
| Vercel no alcanza Postgres/Ollama | Decidir D12 antes de W1 |
| Un solo servidor sin backups | Backups (`pg_dump` diario + copia externa) antes de datos reales |
| Un solo desarrollador | Rebanada estrecha, PRs chicos, ponytail |

## 10. Entradas pendientes de Gustavo

1. ~~Decisión D12~~ (resuelta: opción A). Falta un **dominio** para el front en `dev-server` (o se usa la IP de Tailscale mientras tanto).
2. ~~XML SIFEN real y RUC~~ (recibidos el 2026-10-22). Falta confirmar el DV de **80150477-9** y, si es posible, un XML de **nota de crédito** y otro en **moneda extranjera** o a **crédito**.
3. Un archivo del Registro de Comprobantes **aceptado por Marangatu** (o permiso para probar una
   importación de prueba) para cerrar la duda del delimitador, y un **Form 104** presentado.
4. Confirmar que esta etapa cubre solo **IVA General** y registros 1 y 2.
5. Confirmar que el dinero en moneda extranjera puede ir en su unidad mínima (centavos).

## 11. Supuestos

- Un desarrollador con revisión de Gustavo; el spec ordena, no calendariza.
- `intelicont-pg` en `dev-server` (puerto 5440, solo local) es el entorno de desarrollo.
- Better Auth con contraseña y TOTP es aceptable como reemplazo de Supabase Auth.
- El seed (`Importadora del Este S.A.`) se conserva solo para desarrollo y pruebas.
