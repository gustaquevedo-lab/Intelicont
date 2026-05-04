Contributing to Intelicont
=========================

- Este proyecto sigue un enfoque de desarrollo incremental y centrado en la entrega de valor por sprint.
- Usa un monorepo con estructura por módulos y epics definidos en el backlog.
- Requiere: pruebas unitarias y de integración para cada feature, revisión de código y cumplimiento de normas de seguridad (RBAC/RLS, auditoría).
- Proceso de commits: Conventional Commits (feat:, fix:, chore:, docs:).
- Para abrir issues/propuestas: crea un nuevo issue con título claro y asigna las etiquetas correspondientes (epic/feature/bug).
- Si trabajas en una tarea grande, crea un epic y divide en tickets más pequeños.
- Antes de mergear a main, asegúrate de que CI pasa (lint, tests, typecheck y build).

Guía rápida de formato de commits
- feat: Añade nueva funcionalidad
- fix: Corrige fallos
- chore: Tareas de mantenimiento
- docs: Actualización de documentación

Ambiente de desarrollo
- Requisitos: Node.js, PNPM, acceso a GitHub, acceso a Supabase para desarrollo (free tier).
- Pasos iniciales: clonar, instalar dependencias, configurar envs locales, correr dev.
