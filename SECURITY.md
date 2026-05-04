# Seguridad — InteliCont

## Autenticación
Supabase Auth (email + magic link + 2FA obligatorio para admins). Sesiones default 8h, configurable.

## Autorización
RBAC por entidad: admin, accountant, assistant, auditor, client. Permisos granulares en memberships.permissions. Segregation of Duties: quien postea no aprueba pagos del mismo asiento.

## Multi-tenant
RLS en TODAS las tablas con entity_id. Middleware setea app.entity_id y app.user_id. Tests de aislamiento (usuario A no ve datos de entidad B).

## Inmutabilidad
journal_entries posteado: triggers DB rechazan UPDATE/DELETE. Correcciones solo vía contra-asiento o ajuste.

## Auditoría
audit_events con before/after/reason/actor para toda mutación. Retención 10 años (requisito fiscal PY).

## Datos sensibles
Cifrado en reposo (Supabase) + cifrado de columnas para campos críticos. Backups por empresa exportables. TLS 1.3.

## Rate limiting
Por usuario y por IP. Idempotency-Key obligatoria en endpoints externos. Webhooks salientes firmados HMAC con timestamp + nonce.

## Cumplimiento
Ley 1682/01 y 6534/20 (datos personales PY). Logs de acceso >= 1 año. DPA disponible.
