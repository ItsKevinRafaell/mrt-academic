#!/bin/bash
# MRT Database Backup Script
# Run via cron: 0 2 * * * /home/kevin/MRT/scripts/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/home/kevin/MRT/backups}"
DB_CONTAINER="mrt-postgres"
DB_NAME="${POSTGRES_DB:-mrt_db}"
DB_USER="${POSTGRES_USER:-mrt}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mrt_db_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

# Create backup
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "mrt_db_*.sql.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_FILE"
