#!/usr/bin/env bash
set -euo pipefail

# Nightly Database Backup & Remote S3 Sync Script
# Runs inside the Docker backup container or host cron.

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="ketab_yar_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Starting PostgreSQL database backup..."
pg_dump "${DATABASE_URL}" | gzip > "${FILEPATH}"
echo "[$(date)] Local backup created at ${FILEPATH}"

# Remote replication to S3 if bucket destination is configured
if [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  echo "[$(date)] Syncing backup to remote S3 bucket ${S3_BACKUP_BUCKET}..."
  aws s3 cp "${FILEPATH}" "s3://${S3_BACKUP_BUCKET}/db-backups/${FILENAME}"
  echo "[$(date)] Remote S3 upload complete."
else
  echo "[$(date)] S3_BACKUP_BUCKET environment variable not set. Skipping remote S3 upload."
fi

# Rotate backups older than 14 days locally
find "${BACKUP_DIR}" -type f -name "ketab_yar_*.sql.gz" -mtime +14 -delete
echo "[$(date)] Backup rotation complete."
