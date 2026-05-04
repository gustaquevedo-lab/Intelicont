# Startup Guide — Intelicont MVP

Objetivo: poner en marcha el MVP de Intelicont con un monorepo en GitHub, DB en Supabase Postgres (free tier cuando aplique) y frontend en Vercel.

1) Preparación local
- Clona el repositorio (ya hecho): git clone https://github.com/gustaquevedo-lab/Intelicont.git
- Instala dependencias (en raíz):
  - pnpm install
- Ejecuta pruebas/coberturas mínimas (cuando se añadan):
  - pnpm test
- Arranca el proyecto frontend (placeholder) o solo desarrolla skeletons:
  - Revisa la carpeta apps/web para empezar con el skeleton de UI.

2) Configurar DB (Supabase) para MVP
- Crea un proyecto en Supabase (opción gratuita).
- Copia los credenciales de la DB en un .env.local o usa las variables de entorno adecuadas para nuestras herramientas (ej.: POSTGRES_URL, SUPABASE_URL, SUPABASE_ANON_KEY).
- Ejecuta migraciones básicas: coloca infra/db/migrations/0001_init.sql en tu DB o usa tu ORM para aplicar migraciones.
- Verifica RLS y permisos por entidad para el multi-tenant.

3) IA (opciones gratuitas)
- Con la estrategia actual, usa módulos IA gratuitos/open-source cuando corresponda; la arquitectura está preparada para swap a Claude en el futuro sin tocar dominio.
- Alimenta AI skeleton con un backend simple de pruebas (mock) para las primeras iteraciones.

4) Issues y sprints
- Ejecuta el script para generar issues (requiere GITHUB_TOKEN con permisos de escritura):
  - export GITHUB_TOKEN=tu_token
  - python3 scripts/create_gh_issues.py
- O usa la dry-run para revisar antes de crear: 
  - python3 scripts/create_gh_issues.py --dry-run

5) CI/CD y despliegue
- Configura un workflow básico en GitHub Actions (ya incluido en .github/workflows/ci.yml).
- En Vercel, configura el proyecto para desplegar desde main; añade las variables de entorno necesarias (DB URLs, claves, etc.).

6) Siguientes pasos
- Avanza con los primeros PRs en Foundations (FND-01 a FND-04) y MVP Core (MVP-CORE-01 a MVP-CORE-03).
- Mantén el backlog actualizado y revisa las dependencias entre tickets para evitar bloqueos.

Este documento puede actualizarse a medida que avanzamos; si quieres, te puedo adaptar el plan a un sprint concreto con fechas y deliverables.
