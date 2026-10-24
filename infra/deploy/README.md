# Despliegue en Dev-Server (Docker / Coolify) — InteliCont

Guía de despliegue continuo y configuración de contenedores para InteliCont en la infraestructura del servidor `dev-server`.

---

## 🌐 Arquitectura de Despliegue

```
                                  [ Cloudflare Zero Trust ]
                                             │
                                    (intellihouse-tunnel)
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
            [ intelicont.intellihouse.lat ]             [ dev-server host ]
                        │                                         │
                        ▼ (Puerto 3002)                           ▼
             [ Contenedor intelicont-web ]               [ Ollama (CPU) ]
                        │ (intelicont-net)                        │ (Puerto 11434)
                        ├─────────────────────────────────────────┘
                        ▼ (Puerto 5432)
              [ intelicont-pg ]
```

* **Dominio Público**: `https://intelicont.intellihouse.lat` (mapeado en Cloudflare Tunnel hacia el puerto 3002 del dev-server).
* **Red Docker**: `intelicont-net` (subred `10.0.3.0/24`), compartida por `intelicont-pg` y el contenedor de la aplicación.
* **Base de Datos**: Contenedor `intelicont-pg` accesible internamente en `intelicont-pg:5432` con el rol de runtime `intelicont_app`.
* **IA Local**: Ollama accesible en el gateway de la red Docker (`http://10.0.3.1:11434` o `http://host.docker.internal:11434`) con el modelo `qwen2.5:7b`.

---

## 📦 Configuración en Coolify

1. **Crear Aplicación**:
   * En el panel de Coolify (`http://100.72.38.119:8000`), seleccionar el proyecto InteliCont.
   * Añadir nueva aplicación desde repositorio Git: `gustaquevedo-lab/Intelicont`.
   * Rama: `feat/vertical-slice` (o `main` al completar el merge).
2. **Configuración de Build**:
   * Tipo de build: **Dockerfile**.
   * Ubicación del Dockerfile: `apps/web/Dockerfile` (o el Dockerfile en la raíz del repositorio).
   * Directorio base / contexto: `/` (raíz del monorepo).
3. **Redes y Puertos**:
   * Red Docker: Conectar a `intelicont-net`.
   * Puertos: Mapear el puerto expuesto del contenedor (`3000`) al puerto host `3002` (para que el túnel de Cloudflare lo enrute a `intelicont.intellihouse.lat`).
4. **Variables de Entorno**:
   ```ini
   NODE_ENV=production
   PORT=3000
   NEXT_TELEMETRY_DISABLED=1
   NEXT_PUBLIC_APP_URL=https://intelicont.intellihouse.lat
   BETTER_AUTH_URL=https://intelicont.intellihouse.lat
   BETTER_AUTH_SECRET=<generado con openssl rand -base64 32>
   DATABASE_URL=postgresql://intelicont_app:348ee0e10e09f1cc0db5602f62e4f09f803a75df926f219f@intelicont-pg:5432/intelicont
   OLLAMA_URL=http://10.0.3.1:11434
   OLLAMA_MODEL=qwen2.5:7b
   ```
5. **Healthcheck**:
   * Path: `/api/health`
   * Respuesta esperada: `status: "ok"` (código HTTP 200).

---

## 🛠️ Comprobaciones Posteriores al Despliegue

```bash
# 1. Verificar probe de salud
curl -f https://intelicont.intellihouse.lat/api/health

# 2. Verificar conectividad desde el contenedor hacia Ollama
docker exec -it <container_id> curl -s http://10.0.3.1:11434/api/tags

# 3. Comprobar inicio de sesión desde el navegador
open https://intelicont.intellihouse.lat/login
```
