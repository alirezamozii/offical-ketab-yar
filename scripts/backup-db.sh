#!/usr/bin/env bash
# scripts/backup-db.sh
# ---------------------------------------------------------------
# Backs up the database. For SQLite (dev), copies the .db file.
# For Postgres (prod), runs pg_dump + gzip and uploads to S3/R2.
#
# Usage:
#   ./scripts/backup-db.sh              # SQLite dev backup
#   DATABASE_URL=postgresql://... ./scripts/backup-db.sh  # Postgres backup
#
# Cron: run daily at 02:00 UTC
#   0 2 * * * /path/to/ketab-yar/scripts/backup-db.sh
# ---------------------------------------------------------------
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
mkdir -p "$BACKUP_DIR"

if [[ "${DATABASE_URL:-}" == postgresql://* ]]; then
  echo "📦 Backing up Postgres database..."
  BACKUP_FILE="$BACKUP_DIR/ketabyar-$TIMESTAMP.sql.gz"
  pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
  echo "✅ Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

  # Upload to S3/R2 if configured
  if [[ -n "${S3_BUCKET:-}" ]]; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/$(basename "$BACKUP_FILE")"
    echo "✅ Uploaded to s3://$S3_BUCKET/backups/$(basename "$BACKUP_FILE")"
  fi
else
  echo "📦 Backing up SQLite database..."
  DB_FILE="${DATABASE_URL:-file:./db/custom.db}"
  DB_FILE="${DB_FILE#file:}"
  if [[ -f "$DB_FILE" ]]; then
    BACKUP_FILE="$BACKUP_DIR/ketabyar-$TIMESTAMP.db"
    cp "$DB_FILE" "$BACKUP_FILE"
    echo "✅ Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
  else
    echo "❌ Database file not found: $DB_FILE"
    exit 1
  fi
fi

# Rotate: keep only the last 14 days of backups
echo "🧹 Rotating backups older than 14 days..."
find "$BACKUP_DIR" -name "ketabyar-*" -mtime +14 -delete 2>/dev/null || true
echo "✅ Done."
