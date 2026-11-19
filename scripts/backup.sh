#!/bin/bash
# ==============================================================================
# Dump diario de fluxtable-db (PostgreSQL 16) en formato custom (-Fc).
# ==============================================================================
# Compatible con ZBook, réplica a NAS, rotación de 14 días y Kuma Push.
# Issue: snadales/fluxtable#49
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${HOME}/docker/fluxtable/backups"
KUMA_URL="http://kuma.lan:3001"
TS=$(date +"%Y%m%d_%H%M%S")
mkdir -p "${BACKUP_DIR}" && chmod 700 "${BACKUP_DIR}"

POSTGRES_USER="${POSTGRES_USER:-fluxtable_user}"
POSTGRES_DB="${POSTGRES_DB:-fluxtable}"
CONTAINER_NAME="fluxtable-db"

# Obtener push token de 1Password Connect en memoria (si existe)
get_push_token() {
  python3 - << 'EOF' 2>/dev/null || true
import json, os, urllib.request, urllib.parse
connect = os.environ.get("OP_CONNECT_HOST", "http://localhost:8080")
vault = "p4hzearyjkqiamoh6fhz3wsufy"
tok_path = os.path.expanduser("~/.config/op-connect/token")
if not os.path.exists(tok_path):
    tok_path = "/home/snadales/docker/1password/env/op-connect.env"
    tok = ""
    for line in open(tok_path):
        if line.startswith("OP_CONNECT_TOKEN="):
            tok = line.strip().split("=", 1)[1].strip("\"'")
            break
else:
    tok = open(tok_path).read().strip()

for title in ["zbook_kuma_push_fluxtable_backup", "zbook_kuma_push_baserow_backup"]:
    q = urllib.parse.quote(f'title eq "{title}"')
    try:
        req = urllib.request.Request(f"{connect}/v1/vaults/{vault}/items?filter={q}", headers={"Authorization": f"Bearer {tok}"})
        items = json.load(urllib.request.urlopen(req, timeout=5))
        if items:
            item_id = items[0]["id"]
            req = urllib.request.Request(f"{connect}/v1/vaults/{vault}/items/{item_id}", headers={"Authorization": f"Bearer {tok}"})
            details = json.load(urllib.request.urlopen(req, timeout=5))
            for f in details.get("fields", []):
                if f.get("label") in ["credential", "password"] or f.get("id") in ["credential", "password"]:
                    print(f.get("value", ""))
                    exit(0)
    except Exception:
        continue
EOF
}

PUSH_TOKEN="$(get_push_token)"

notify_failure() {
  local msg="${1:-error-en-backup}"
  echo "[$(date +'%F %T')] ERROR: ${msg}" >&2
  if [ -n "${PUSH_TOKEN}" ]; then
    curl -fsS --max-time 10 "${KUMA_URL}/api/push/${PUSH_TOKEN}?status=down&msg=${msg}" >/dev/null 2>&1 || true
  fi
}

trap 'notify_failure script-abortado' ERR

f="${BACKUP_DIR}/fluxtable_pg_${TS}.dump"
echo "[$(date +'%F %T')] Iniciando pg_dump (-Fc) de ${POSTGRES_DB} en ${CONTAINER_NAME}..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${POSTGRES_USER}" -Fc "${POSTGRES_DB}" > "${f}.tmp"

# Validación 1: tamaño > 0 bytes
if [ ! -s "${f}.tmp" ]; then
  rm -f "${f}.tmp"
  notify_failure "dump-vacio-${POSTGRES_DB}"
  exit 1
fi

# Validación 2: legible y consistente para pg_restore
if ! docker exec -i "${CONTAINER_NAME}" pg_restore -l < "${f}.tmp" > /dev/null 2>&1; then
  rm -f "${f}.tmp"
  notify_failure "dump-corrupto-${POSTGRES_DB}"
  exit 1
fi

mv "${f}.tmp" "${f}" && chmod 600 "${f}"
SIZE=$(du -h "${f}" | cut -f1)
echo "[$(date +'%F %T')] Respaldo completado y verificado: ${f} (${SIZE})"

# Rotación local: 14 días
find "${BACKUP_DIR}" -name 'fluxtable_pg_*.dump' -mtime +14 -delete || true

# Copia opcional al NAS si el punto de montaje existe
NAS_DIR="/mnt/backups/zbook-dumps/fluxtable"
if [ -d "/mnt/backups" ]; then
  mkdir -p "${NAS_DIR}"
  cp "${f}" "${NAS_DIR}/"
  find "${NAS_DIR}" -name 'fluxtable_pg_*.dump' -mtime +14 -delete || true
  echo "[$(date +'%F %T')] Respaldo sincronizado al NAS con rotación (14d)."
fi

# Notificación exitosa a Kuma
if [ -n "${PUSH_TOKEN}" ]; then
  curl -fsS --max-time 10 "${KUMA_URL}/api/push/${PUSH_TOKEN}?status=up&msg=OK_${SIZE}&ping=" >/dev/null 2>&1 || true
fi
echo "[$(date +'%F %T')] fluxtable: Backup diario exitoso y certificado."
