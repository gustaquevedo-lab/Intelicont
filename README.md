Intelicont
\nSaaS contable para Paraguay, IA-first, API-first, con multi-tenant desde el inicio. Construido como monorepo para acelerar el desarrollo y facilitar la escalabilidad a futuro.
\nEste repositorio contiene el backlog de planificaciones, la estructura de módulos y los primeros esqueletos para arrancar el MVP contable núcleo, con integración de IA y cumplimiento fiscal.\n
Objetivos
- Desarrollar un MVP funcional para manejo contable en Paraguay, con integración de XML SIFEN, generación de libros y formularios fiscales, y revisión humana de IA.
- Soportar multi-tenant desde el inicio (RBAC + RLS) y desplegar en Vercel desde un monorepo en GitHub.
- Usar Supabase Postgres (free tier cuando aplique) y IA gratuita/open-source para el MVP.
- Mantener estándares de seguridad, auditoría y fiabilidad acordes al dominio.

Estructura del repositorio
- apps/web: frontend Next.js 15 + tRPC
- apps/jobs: workers para tareas en background
- packages/core: núcleo compartido (money, period, tenant, etc.)
- packages/ledger: dominio contable y reglas de negocio del libro mayor
- packages/fiscal-py: lógica fiscal/impuestos y validaciones
- packages/ar-ap, banking, assets, reporting, ai, ops, integrations, ui, config: módulos y utilidades
- docs: documentación de arquitectura, backlog, guías
- backlog: epics y tareas detalladas en MD

Configuración rápida
- Este repositorio está planificado para ser usado con GitHub y desplegar desde allí a Vercel.
- La base de datos será Supabase Postgres (free cuando aplique) y el hosting del frontend en Vercel.
- IA: se priorizará proveedores gratuitos/open-source para el MVP; el diseño permitirá swap sin rework mayor.

Cómo empezar
- Clona el repo y corre las tareas del backlog para empezar a llenar el skeleton.
- Revisa la carpeta backlog para ver las historias y criterios de aceptación.
- Añade/akw agregua tasks en el backlog a medida que se define el alcance en cada sprint.

Notas
- Este repo está en construcción y se actualizará con cada iteración de plan de trabajo y commits de código.
