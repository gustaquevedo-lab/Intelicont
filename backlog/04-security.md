# Seguridad y Compliance

Objetivo
- Garantizar RBAC/RLS, auditoría y cumplimiento regulatorio desde MVP, con trazabilidad y controles adecuados.

Entregables
- Definición de roles y permisos (admin/accountant/assistant/auditor/client).
- Pruebas de RBAC y acceso entre entidades (asegurar aislamiento).
- Auditoría básica (audit_events) y reversión/versioning para asientos.
- Validaciones clave de timbrado, DNIT y SIFEN (must-have MVP).
- Integración de seguridad en CI/CD (linting, tests, etc.).

Historias
- SEC-01: RBAC y pruebas de acceso
- SEC-02: Validaciones regulatorias must-have (timbrado, SIFEN, DNIT)
- SEC-03: Auditoría y reversión

Criterios de aceptación
- RBAC/RLS aplicados y cubiertos por tests.
- Pruebas de validación de RUC, timbrado, CDC SIFEN y calendario.
- Estrategia de reversión de asientos y registro de cambios.
