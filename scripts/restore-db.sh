#!/usr/bin/env bash
# scripts/restore-db.sh
# ---------------------------------------------------------------
# Restores the database from a backup file.
#
# Usage:
#   ./scripts/restore-db.sh backups/ketabyar-20260717T020000Z.db
#   ./scripts/restore-db.sh backups/ketabyar-20260717T020000Z.sql.gz
# ---------------------------------------------------------------
set -euo pipefail

BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup-file>"
  echo ""
  echo "Available backups:"
  ls -1t backups/ 2>/dev/null | head -10 || echo "  (no backups directory)"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
  echo "📥 Restoring Postgres from: $BACKUP_FILE"
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
  echo "✅ Restore complete."
elif [[ "$BACKUP_FILE" == *.db ]]; then
  echo "📥 Restoring SQLite from: $BACKUP_FILE"
  DB_FILE="${DATABASE_URL:-file:./db/custom.db}"
  DB_FILE="${DB_FILE#file:}"
  cp "$BACKUP_FILE" "$DB_FILE"
  echo "✅ Restore complete: $DB_FILE"
else
  echo "❌ Unknown backup format: $BACKUP_FILE"
  exit 1
fi
