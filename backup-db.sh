#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/hermitage_${TIMESTAMP}.sql.gz"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

# Load .env for credentials
set -a
source "${SCRIPT_DIR}/.env"
set +a

# Validate required variables
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
  echo "[$(date)] ERROR: POSTGRES_USER or POSTGRES_DB not set in .env"
  exit 1
fi

echo "[$(date)] Starting database backup..."

docker compose -f "${SCRIPT_DIR}/docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: ${BACKUP_FILE} (${FILESIZE})"

# Remove backups older than KEEP_DAYS
DELETED=$(find "$BACKUP_DIR" -name "hermitage_*.sql.gz" -mtime +${KEEP_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Cleaned up ${DELETED} old backup(s) (older than ${KEEP_DAYS} days)"
fi

echo "[$(date)] Backup complete."
