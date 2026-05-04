#!/usr/bin/env bash
set -euo pipefail

echo "Generating issues preview (dry-run) from backlog..."
python3 scripts/create_gh_issues.py --dry-run > backlog/issues-preview.md
echo "Wrote backlog/issues-preview.md"
