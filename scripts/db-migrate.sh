#!/bin/bash
set -e

MIGRATIONS_DIR="${MIGRATIONS_DIR:-./backend/migrations}"
CONTAINER_NAME="${CONTAINER_NAME:-mrt-postgres}"
DB_USER="${DB_USER:-mrt}"
DB_NAME="${DB_NAME:-mrt_db}"

echo "Running migrations from $MIGRATIONS_DIR..."

for file in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$file" ]; then
    echo "Applying: $(basename "$file")"
    docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$file"
  fi
done

echo "All migrations applied successfully!"
