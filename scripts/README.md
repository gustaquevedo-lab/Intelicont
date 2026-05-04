# Script: create_gh_issues.py
Este script genera GitHub Issues a partir de backlog/gh-issues.md para el repositorio gustaquevedo-lab/Intelicont.

Requisitos
- Python 3.8+
- Entorno con variable de entorno GITHUB_TOKEN válida para autenticación.
- El script asume que el repo es gustaquevedo-lab/Intelicont y que el usuario tiene permisos de escritura.

Uso
- Exporta tu token: export GITHUB_TOKEN=your_token (o en Windows: set GITHUB_TOKEN=...)
- Ejecuta: python3 scripts/create_gh_issues.py

Notas
- El script evita duplicados verificando títulos existentes en issues abiertos.
- Labels se asignan de forma heurística según el prefix del código (FND-, MVP-, IA-, SEC-, OBS-, REL-).
