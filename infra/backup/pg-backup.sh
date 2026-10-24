#!/usr/bin/env bash
set -euo pipefail

# InteliCont PostgreSQL automated backup script
# Keeps daily pg_dump custom-format (-Fc) archives with a 14-day retention window.

BACKUP_DIR="${BACKUP_DIR:-/var/backups/intelicont}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/intelicont_backup_${TIMESTAMP}.dump"
LOG_PREFIX="[intelicont-backup]"

mkdir -p "${BACKUP_DIR}"

echo "${LOG_PREFIX} Starting database backup to ${BACKUP_FILE} at $(date -Iseconds)..."

# Run pg_dump inside the running container (or directly via network if pg_dump is available on the host)
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^intelicont-pg$"; then
    docker exec intelicont-pg pg_dump -U postgres -d intelicont -Fc -Z 6 > "${BACKUP_FILE}"
else
    # Fallback using host pg_dump
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h 127.0.0.1 -p 5440 -U postgres -d intelicont -Fc -Z 6 -f "${BACKUP_FILE}"
fi

FILESIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "${LOG_PREFIX} Backup completed successfully: ${BACKUP_FILE} (${FILESIZE})"

# Cleanup archives older than RETENTION_DAYS
echo "${LOG_PREFIX} Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "intelicont_backup_*.dump" -mtime +"${RETENTION_DAYS}" -exec rm -vf {} +

echo "${LOG_PREFIX} Backup run finished cleanly at $(date -Iseconds)."
