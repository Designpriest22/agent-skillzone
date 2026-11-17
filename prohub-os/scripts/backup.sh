#!/usr/bin/env bash
# Logical backup of the Prohub OS database. Usage: DATABASE_URL=... ./scripts/backup.sh [dir]
set -euo pipefail
DIR="${1:-backups}"
mkdir -p "$DIR"
FILE="$DIR/prohub-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" -f "$FILE"
echo "Backup written to $FILE"
# Keep the 30 most recent backups.
ls -1t "$DIR"/prohub-*.dump | tail -n +31 | xargs -r rm --
