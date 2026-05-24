#!/bin/bash
# Sync script called by cron jobs.
# Usage: ./scripts/sync.sh releases|health
#
# Cron setup (crontab -e):
#   0 */6 * * * /Users/yuvalarviv/projects/app-catalog/scripts/sync.sh releases
#   0 */4 * * * /Users/yuvalarviv/projects/app-catalog/scripts/sync.sh health
#
# Note: bp and app-mapping are handled by n8n workflows (hourly and daily).

set -euo pipefail

TYPE="${1:-}"
APP_URL="http://localhost:3000"
LOG_DIR="/Users/yuvalarviv/projects/app-catalog/logs"
mkdir -p "$LOG_DIR"

if [[ "$TYPE" != "releases" && "$TYPE" != "health" ]]; then
  echo "Usage: $0 releases|health" >&2
  exit 1
fi

# Load SYNC_SECRET from .env
ENV_FILE="$(dirname "$0")/../.env"
if [[ -f "$ENV_FILE" ]]; then
  SYNC_SECRET=$(grep '^SYNC_SECRET=' "$ENV_FILE" | cut -d'"' -f2)
fi

if [[ -z "${SYNC_SECRET:-}" ]]; then
  echo "ERROR: SYNC_SECRET not set" >&2
  exit 1
fi

if [[ "$TYPE" == "releases" ]]; then
  ENDPOINT="$APP_URL/api/v1/sync/google-play"
else
  ENDPOINT="$APP_URL/api/v1/sync/health"
fi

LOG_FILE="$LOG_DIR/sync-$TYPE.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Running $TYPE sync..." >> "$LOG_FILE"

BODY=$(curl -s -o /tmp/sync-response.json -w "%{http_code}" -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $SYNC_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 300)

HTTP_CODE="$BODY"
BODY=$(cat /tmp/sync-response.json 2>/dev/null || echo "")

echo "[$TIMESTAMP] HTTP $HTTP_CODE — $BODY" >> "$LOG_FILE"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "[$TIMESTAMP] ERROR: sync failed with HTTP $HTTP_CODE" >&2
  exit 1
fi

echo "[$TIMESTAMP] Done." >> "$LOG_FILE"
