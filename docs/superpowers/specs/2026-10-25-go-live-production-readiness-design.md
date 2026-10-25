# Especificación de Diseño: Salida a Producción y Cumplimiento Comercial (Go-Live InteliCont)

**Fecha:** 2026-10-25  
**Estado:** Propuesta consensuada con el usuario  
**Subsistema:** Onboarding Público, Emails Transaccionales, Facturación B2B y Despliegue  

---

## 1. Resumen Ejecutivo y Objetivos

Para cerrar el ciclo comercial de la landing y disponibilizar InteliCont para clientes reales en Paraguay, implementaremos las 4 piezas operativas faltantes acordadas:
1. **Auto-registro instantáneo (`/registro`):** Alta atómica sin fricción en 1 minuto con 14 días de prueba en plan `starter`, redirigiendo automáticamente al Dashboard.
2. **Actualización del Embudo Landing/Login:** Enlazar los CTAs *"Empezar gratis — 14 días"* de la landing a `/registro` y agregar en `/login` el acceso directo al registro.
3. **Servicio de Emails Transaccionales:** Módulo unificado Resend con fallback a consola/logs para confirmaciones de cuenta y recuperación de contraseñas (`/olvide-password`).
4. **Módulo de Suscripción y Pago B2B (SIPAP / QR):** Sección en la app para visualizar datos bancarios, cargar comprobante de pago de planes (Starter, Pro, Inhouse) y permitir al SuperAdmin aprobar renovaciones en 1-click.

---

## 2. Flujo de Auto-Registro Instantáneo (`/registro`)

### 2.1. Arquitectura y Experiencia
- **Ruta pública:** `/registro` (añadida a `PUBLIC_PAGES` en `middleware.ts`).
- **Campos del Formulario:**
  - `ruc`: RUC del contribuyente o estudio contable (con validación de DV).
  - `legalName`: Razón social o Nombre del profesional.
  - `adminEmail`: Correo electrónico del administrador.
  - `password`: Contraseña elegida.
- **Backend (`api/auth/register-tenant` o procedimiento público tRPC `entities.registerSelfService`):**
  1. Verifica que el RUC y el Email no estén registrados previamente.
  2. Crea atómicamente la entidad con `plan: "starter"` y fecha de prueba (14 días).
  3. Crea el usuario administrador con `debeCambiarPassword: false` (el usuario ya eligió su password).
  4. Asigna la membresía con rol `admin`.
  5. Inicia sesión de Better-Auth o emite cookie de sesión y devuelve `{ success: true, redirect: "/" }`.

---

## 3. Servicio de Email Transaccional (Resend + Fallback Consola)

### 3.1. Módulo `apps/web/src/lib/email-service.ts`
- Soporta envío de:
  - **Bienvenida / Onboarding:** Confirmación de alta y días de trial.
  - **Recuperación de Contraseña (`/olvide-password`):** Genera token de reseteo seguro y envía link `/restablecer-password?token=...`.
  - **Alerta de Vencimiento Fiscal:** Notificación de vencimiento de IVA / RG 90 a 48 horas del plazo.
- **Manejo de entorno:**
  - Si `RESEND_API_KEY` está presente: envía vía API REST de Resend (`https://api.resend.com/emails`).
  - Si no está presente (desarrollo, tests o sin configurar): imprime el email y el enlace completo en los logs de la consola y en el sistema de telemetría sin fallar.

---

## 4. Gestión de Suscripciones y Pagos B2B (SIPAP / QR)

### 4.1. Interfaz del Tenant (`/suscripcion` o pestaña en `/configuracion`)
- Muestra el estado de la suscripción:
  - Plan actual (`starter`, `pro`, `inhouse`).
  - Estado (`Prueba activa`, `Vigente`, `Por vencer`).
  - Días restantes de prueba o vigencia.
- Tabla comparativa de planes con botón *"Renovar o Mejorar Plan"*.
- Modal de Pago SIPAP:
  - Datos bancarios oficiales de InteliCont (Banco Itaú / GNB, RUC, Cuenta Corriente, Titular).
  - Código QR para escaneo desde apps bancarias.
  - Campo para ingresar número de comprobante o subir archivo de transferencia.
  - Envía la solicitud de renovación a la tabla de órdenes/solicitudes.

### 4.2. Aprobación en Consola SuperAdmin (`/superadmin`)
- En la pestaña de Tenants, se añade un badge o sección de *"Solicitudes de Pago Pendientes"*.
- El SuperAdmin puede verificar el comprobante bancario y con 1-click presionar *"Aprobar y Renovar 30 días"*.

---

## 5. Estrategia de Pruebas Automatizadas (TDD)

1. `apps/web/src/__tests__/self-service-registration.test.ts`:
   - Alta de tenant por auto-registro.
   - Rechazo de duplicados por RUC o Email.
   - Asignación correcta de plan `starter` y rol `admin`.
2. `apps/web/src/__tests__/email-service.test.ts`:
   - Generación de plantillas de email.
   - Fallback a log cuando falta la API key de Resend.
   - Envío exitoso simulado.
3. `apps/web/src/__tests__/subscription-orders.test.ts`:
   - Creación de solicitud de pago SIPAP.
   - Aprobación por SuperAdmin y extensión de vigencia del tenant.

---

## 6. Checklist de Validación y Despliegue

- [ ] Suite de pruebas completa en verde (`pnpm test`).
- [ ] Compilación Next.js de producción sin errores (`next build`).
- [ ] Commit con mensajes convencionales y push a `origin/main`.
