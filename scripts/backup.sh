#!/bin/bash
# ==============================================================
# AvPocket - Automated Backup Script
# Backs up PostgreSQL database + uploaded files
# ==============================================================

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting AvPocket backup..."

# ── 1. PostgreSQL Database Dump ──
echo "[Backup] Dumping PostgreSQL database..."
docker compose -f "$APP_DIR/docker-compose.yml" exec -T postgres \
    pg_dump -U avpocket -d avpocket --clean --if-exists \
    | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

DB_SIZE=$(du -h "$BACKUP_DIR/db_${DATE}.sql.gz" | cut -f1)
echo "[Backup] Database dump: $DB_SIZE → db_${DATE}.sql.gz"

# ── 2. Upload Files Backup ──
echo "[Backup] Backing up uploaded files..."
docker compose -f "$APP_DIR/docker-compose.yml" exec -T app \
    tar czf - -C /app/storage uploads 2>/dev/null \
    > "$BACKUP_DIR/uploads_${DATE}.tar.gz"

UPLOADS_SIZE=$(du -h "$BACKUP_DIR/uploads_${DATE}.tar.gz" | cut -f1)
echo "[Backup] Uploads archive: $UPLOADS_SIZE → uploads_${DATE}.tar.gz"

# ── 3. Cleanup Old Backups ──
echo "[Backup] Cleaning backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "$BACKUP_DIR" -name "*.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "[Backup] Deleted $DELETED old backup(s)."

# ── Summary ──
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "[$(date)] ✅ Backup complete! Total backup storage: $TOTAL_SIZE"
echo "  → Database: db_${DATE}.sql.gz ($DB_SIZE)"
echo "  → Uploads:  uploads_${DATE}.tar.gz ($UPLOADS_SIZE)"
