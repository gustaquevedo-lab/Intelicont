# Seguridad — InteliCont

Directrices y mecanismos de seguridad implementados en la plataforma InteliCont.

---

## 🔐 Autenticación y Control de Acceso

1. **Gestión de Identidad**:
   * Implementado con **Better Auth** con almacenamiento de sesiones en Postgres (`sessions`).
   * Esquema de autenticación local con email y contraseña (hasheada de forma segura). El registro público libre está cerrado.
   * **2FA / TOTP Obligatorio**: Los usuarios con rol de administrador en cualquier empresa deben tener enrolado y activo un segundo factor TOTP. Esta regla se valida tanto a nivel de middleware visual como en el middleware de tRPC (`protectedProcedure`/`authedProcedure`), rechazando con `403 FORBIDDEN` a quien intente mutar datos sin 2FA.

2. **Multi-Tenancy y Aislamiento por RLS**:
   * Cada petición transaccional corre envuelta en `withTenant(userId, fn)`.
   * En la base de datos se configuran variables de sesión `app.user_id` y `app.entity_ids` (lista de entidades a las que el usuario tiene acceso vía `memberships`).
   * Las tablas operativas cuentan con políticas de Row-Level Security (RLS) que filtran estrictamente por estas variables (`security_invoker = true` en vistas).
   * **Menor Privilegio**: El rol de runtime de la aplicación (`intelicont_app`) no es dueño (`owner`) de las tablas ni tiene permisos para alterar esquemas o saltear RLS; las migraciones se ejecutan exclusivamente con el rol `intelicont_migrator`.

---

## 🛡️ Integridad de Datos e Inmutabilidad

1. **Inmutabilidad del Libro Diario**:
   * Triggers en Postgres impiden cualquier operación `UPDATE` o `DELETE` sobre registros en `journal_entries` cuyo estado sea `posted`.
   * Las correcciones contables se realizan exclusivamente mediante contra-asientos (`reverseEntry`), generando una nueva entrada vinculada con `reversal_of`.
2. **Idempotencia en Mutaciones**:
   * Los endpoints de mutación implementan `idempotentProcedure` exigiendo un encabezado `Idempotency-Key: <UUID>`.
   * Si una solicitud se reintenta tras un corte de red, se devuelve la respuesta previa almacenada en `idempotency_keys` sin duplicar transacciones.
3. **Auditoría Append-Only**:
   * Toda operación crítica (creación de asientos, reversiones, ingesta, aprobaciones de IA) genera un registro inmutable en `audit_events` con `actor_id`, `action`, payload `before`/`after` y motivo (`reason`).

---

## 🔍 Observabilidad y Protección de Datos Sensibles

1. **Logs Sanitizados**:
   * Logging estructurado con **Pino**.
   * Sanitización activa de información sensible mediante `safeErrorInfo`: nunca se registran passwords, tokens, XMLs crudos ni parámetros SQL con datos de contribuyentes.
2. **Enmascaramiento de Errores Internos**:
   * El formateador de tRPC intercepta errores `INTERNAL_SERVER_ERROR` suprimiendo stack traces y mensajes del driver de base de datos en la respuesta al cliente, devolviendo un mensaje genérico acompañado de un identificador `requestId` para correlación en logs de servidor.

---

## 🚧 Pendiente / Mejoras de Seguridad Planificadas
- **Rate Limiting Persistente**: Migrar el rate limiter en memoria a almacenamiento distribuido/Redis para despliegues con múltiples réplicas.
- **Limpieza de Idempotencia**: Job programado para depuración de claves con TTL > 24 horas.
- **Backups Cifrados Fuera del Servidor**: Configuración de `pg_dump` con cifrado y copia automática fuera de dev-server.
- **Integración SIFEN Producción**: Certificados digitales `.p12` para firma criptográfica XML de comprobantes ante la DNIT.
