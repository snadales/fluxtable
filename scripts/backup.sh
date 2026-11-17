#!/bin/bash
set -euo pipefail

# ==============================================================================
# Script de Respaldo Automatizado Nivel 1 para BaserowLite
# ==============================================================================
# Compatible con ZBook, réplica a la NAS y alertas de Uptime Kuma

BACKUP_DIR="${HOME}/docker/baserow-lite/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/baserow_lite_pg_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Iniciando pg_dump de BaserowLite..."
docker exec baserow_lite_db pg_dump -U baserow_user -d baserow_lite | gzip > "${BACKUP_FILE}"

SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
BYTES=$(stat -c %s "${BACKUP_FILE}" 2>/dev/null || stat -f %z "${BACKUP_FILE}")
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Respaldo completado: ${BACKUP_FILE} (${SIZE})"

# Validación: gzip íntegro y tamaño mínimo (>10 KB)
FALLO=""
gzip -t "${BACKUP_FILE}" 2>/dev/null || FALLO="gzip corrupto"
if [ -z "${FALLO}" ] && [ "${BYTES}" -lt 10240 ]; then
  FALLO="dump demasiado pequeño (${BYTES} B)"
fi

# Push a Uptime Kuma si existe el token en 1Password
kuma_push() {
  local tok
  tok=$(sudo -n /root/bin/op-connect-read "op://IA/zbook_kuma_push_baserow_backup/credential" 2>/dev/null || echo "")
  if [ -n "${tok}" ]; then
    curl -fsS -4 --max-time 15 --get --data-urlencode "status=$1" --data-urlencode "msg=$2" \
      "http://nuc:3001/api/push/${tok}" >/dev/null 2>&1 || true
  fi
}

if [ -n "${FALLO}" ]; then
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: ${FALLO}" >&2
  kuma_push down "${FALLO}"
  exit 1
fi
kuma_push up "OK ${SIZE}"

# Copia opcional al NAS si el punto de montaje existe
NAS_DIR="/mnt/backups/zbook-dumps/baserow-lite"
if [ -d "/mnt/backups" ]; then
  mkdir -p "${NAS_DIR}"
  cp "${BACKUP_FILE}" "${NAS_DIR}/"
  # Rotación: local 2 días, NAS 14 días
  find "${BACKUP_DIR}" -name "baserow_lite_pg_*.sql.gz" -mtime +2 -delete || true
  find "${NAS_DIR}" -name "baserow_lite_pg_*.sql.gz" -mtime +14 -delete || true
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] Respaldo sincronizado al NAS con rotación."
fi
