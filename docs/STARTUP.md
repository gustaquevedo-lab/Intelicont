# Guía de Inicio y Puesta en Marcha — InteliCont

Esta guía describe el procedimiento para configurar y ejecutar InteliCont en el entorno local de desarrollo y conectarlo a la infraestructura del servidor de desarrollo (`dev-server`).

---

## 🏗️ Infraestructura y Base de Datos

InteliCont utiliza **PostgreSQL 16** alojado en un contenedor Docker (`intelicont-pg`) en la red `intelicont-net` del dev-server.

### Conexión Local vía Túnel SSH
Para acceder a la base de datos de desarrollo desde la máquina local:
```bash
# Abrir túnel SSH mapeando el puerto remoto 5432 al puerto local 5440
ssh -L 5440:localhost:5432 <usuario>@<ip_dev_server> -N
```

### Roles de Base de Datos y Principio de Menor Privilegio
1. **`intelicont_migrator`**: Rol con permisos DDL utilizado exclusivamente para generar y ejecutar migraciones (`pnpm db:migrate`). Es el propietario de las tablas.
2. **`intelicont_app`**: Rol de runtime utilizado por la aplicación web Next.js (`DATABASE_URL`). Solo posee permisos `SELECT`, `INSERT`, `UPDATE` y `DELETE` limitados sobre las tablas de datos, sin privilegios para alterar esquemas ni eludir RLS.
3. **`intelicont_testadmin`**: Rol con privilegios `CREATEDB` y `CREATEROLE` utilizado por el arnés de pruebas automatizadas (`TEST_ADMIN_URL` en `.env.test.local`). Permite crear y destruir bases de datos efímeras aisladas para cada ejecución de test sin afectar los datos de desarrollo.

*(Nota: Ninguna credencial real ni contraseña debe ser incluida en archivos versionados).*

---

## 🤖 Configuración de IA Local (Ollama)

InteliCont soporta asistencia contable con modelos de lenguaje ejecutados localmente mediante **Ollama**:
* Modelo predeterminado: `qwen2.5:7b` (ofrece respuestas JSON balanceadas y precisas para la estructura de comprobantes SIFEN).
* Comprobación del servicio:
  ```bash
  curl http://localhost:11434/api/tags
  ```
* Si Ollama no está disponible o la variable `AI_PROVIDER=rules`, el sistema realiza automáticamente fallback al motor de reglas fiscales determinísticas sin interrumpir el flujo del usuario.

---

## ⚙️ Variables de Entorno

Crear el archivo `apps/web/.env.local` tomando como base `apps/web/.env.example`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Parámetros principales:
* `DATABASE_URL`: Conexión de runtime con rol `intelicont_app` al puerto del túnel (e.g. `postgresql://intelicont_app:***@localhost:5440/intelicont`).
* `BETTER_AUTH_SECRET`: Clave de cifrado de sesiones (generar con `openssl rand -base64 32`).
* `BETTER_AUTH_URL`: URL base local (`http://localhost:3000`).
* `OLLAMA_URL`: URL del servidor Ollama (`http://127.0.0.1:11434`).
* `OLLAMA_MODEL`: `qwen2.5:7b`.

### Para pruebas con base de datos efímera:
Crear `apps/web/.env.test.local` (ignorado en git):
```ini
TEST_ADMIN_URL=postgresql://intelicont_testadmin:***@localhost:5440/template1
```

---

## 🚀 Pasos para Iniciar el Entorno

```bash
# 1. Instalar dependencias
pnpm install

# 2. Aplicar migraciones pendientes
pnpm db:migrate

# 3. Cargar datos base de prueba (entidad seed e inicio de plan de cuentas)
pnpm db:seed

# 4. Crear el usuario administrador inicial
pnpm auth:create-user
# Este comando interactivo solicita nombre, email y contraseña,
# y genera el secreto TOTP para configurar en la app de autenticación (2FA).

# 5. Iniciar servidor de desarrollo
pnpm dev
```

---

## 🧪 Ejecución de Pruebas

| Suite | Comando | Requerimiento |
|---|---|---|
| **Unitarias Puras** | `pnpm test` | Ninguno (corre en memoria con Vitest) |
| **Integración con DB** | `pnpm test:db` | Túnel activo + `TEST_ADMIN_URL` en `.env.test.local` |
| **Cobertura** | `pnpm test:cov` | Túnel activo + `TEST_ADMIN_URL` |
| **E2E (Playwright)** | `pnpm test:e2e` | Túnel activo + `TEST_ADMIN_URL` |
| **Linter** | `pnpm lint` | Monorepo completo con ESLint 9 |

---

## ⚠️ Limitaciones Conocidas Actuales
1. **Ollama en CPU**: En entornos sin GPU dedicada, la inferencia de `qwen2.5:7b` toma entre 15 y 75 segundos. Por ello, solo se invoca cuando la confianza del motor de reglas es menor a 0.8.
2. **Registro de Comprobantes**: El delimitador `;` y el salto de línea Unix están implementados según la ficha técnica pero requieren verificación final contra una importación real en el validador de Marangatu.
3. **Moneda Extranjera**: El flujo del slice vertical opera exclusivamente en guaraníes enteros (PYG).
