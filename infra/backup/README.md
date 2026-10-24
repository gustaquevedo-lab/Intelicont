# Respaldo y Restauración de Base de Datos — InteliCont

Procedimientos de backup diario automatizado y plan de contingencia / restauración para PostgreSQL 16 en el servidor de desarrollo (`dev-server`).

---

## 📅 Backup Diario Automatizado

Los respaldos se generan en formato personalizado de PostgreSQL (`pg_dump -Fc` con compresión nivel 6) y se almacenan en:
```
/var/backups/intelicont/intelicont_backup_YYYYMMDD_HHMMSS.dump
```

### Configuración con Systemd Timer
1. Copiar el script a `/usr/local/bin`:
   ```bash
   cp infra/backup/pg-backup.sh /usr/local/bin/pg-backup.sh
   chmod +x /usr/local/bin/pg-backup.sh
   ```
2. Instalar el servicio y el timer:
   ```bash
   cp infra/backup/intelicont-backup.service /etc/systemd/system/
   cp infra/backup/intelicont-backup.timer /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable --now intelicont-backup.timer
   ```
3. Verificar el estado del timer:
   ```bash
   systemctl list-timers | grep intelicont
   ```
4. Ver logs de ejecución:
   ```bash
   journalctl -u intelicont-backup.service -n 50
   ```

### Política de Retención
- **Local**: Se mantienen backups automáticos de los últimos **14 días** (limpieza mediante `find ... -mtime +14`).
- **Remoto / Offsite**: Puede configurarse sincronización periódica hacia un destino externo (R2, S3 o OneDrive) mediante `rclone` o `rsync`.

---

## 🔄 Prueba de Restauración en Base Descartable

Para verificar la integridad de un archivo de respaldo sin afectar los datos de producción:

```bash
# 1. Definir el archivo de respaldo a verificar
BACKUP_FILE="/var/backups/intelicont/intelicont_backup_YYYYMMDD_HHMMSS.dump"
TEST_DB="intelicont_restore_test"

# 2. Crear una base de datos efímera para la prueba
docker exec -i intelicont-pg psql -U postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};"
docker exec -i intelicont-pg psql -U postgres -c "CREATE DATABASE ${TEST_DB};"

# 3. Restaurar el volcado con pg_restore
docker exec -i intelicont-pg pg_restore -U postgres -d "${TEST_DB}" --no-owner --role=intelicont_app < "${BACKUP_FILE}"

# 4. Verificar integridad y conteo de filas
docker exec -i intelicont-pg psql -U postgres -d "${TEST_DB}" -c "
  SELECT 
    (SELECT COUNT(*) FROM entities) AS entities_count,
    (SELECT COUNT(*) FROM users) AS users_count,
    (SELECT COUNT(*) FROM journal_entries) AS entries_count,
    (SELECT COUNT(*) FROM tax_documents) AS documents_count;
"

# 5. Destruir la base de prueba tras comprobar el resultado
docker exec -i intelicont-pg psql -U postgres -c "DROP DATABASE ${TEST_DB};"
echo "Prueba de restauración finalizada con éxito."
```
