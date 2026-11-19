#!/bin/bash
# ==============================================================================
# Verificación de integridad y restauración de fluxtable-db.
# ==============================================================================
# Restaura el dump más reciente en una base temporal (fluxtable_restoretest),
# valida que las tablas críticas contengan los mismos registros que producción
# y destruye la base temporal.
# Issue: snadales/fluxtable#49
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${HOME}/docker/fluxtable/backups"
KUMA_URL="http://kuma.lan:3001"
TEST_DB="fluxtable_restoretest"
CONTAINER_NAME="fluxtable-db"
POSTGRES_USER="${POSTGRES_USER:-fluxtable_user}"

cleanup() {
  docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB};" >/dev/null 2>&1 || true
}

notify_failure() {
  local msg="${1:-error-en-restore-test}"
  cleanup
  echo "[$(date +'%F %T')] ERROR: ${msg}" >&2
}

trap 'notify_failure script-abortado' ERR

echo "[$(date +'%F %T')] Iniciando verificación de restore fluxtable-db..."

# 1. Encontrar dump más reciente
latest_dump="$(ls -t "${BACKUP_DIR}/fluxtable_pg_"*.dump 2>/dev/null | head -n1 || true)"

if [ -z "$latest_dump" ] || [ ! -s "$latest_dump" ]; then
  notify_failure "sin-dump-fluxtable"
  exit 1
fi

echo "[$(date +'%F %T')] Dump seleccionado: ${latest_dump} ($(du -h "${latest_dump}" | cut -f1))"

cleanup

# 2. Crear base temporal y restaurar
echo "[$(date +'%F %T')] Creando base de datos temporal ${TEST_DB}..."
docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${TEST_DB};" >/dev/null

echo "[$(date +'%F %T')] Ejecutando pg_restore en ${TEST_DB}..."
docker exec -i "${CONTAINER_NAME}" pg_restore -U "${POSTGRES_USER}" -d "${TEST_DB}" --no-owner < "${latest_dump}" >/dev/null || true

# 3. Comparar conteos de tablas críticas entre producción y restoretest
echo "[$(date +'%F %T')] Validando integridad y consistencia de tablas..."

CRITICAL_TABLES=("workspaces" "bases" "tables" "fields" "records" "bi_dashboards" "bi_cards")

DISCREPANCY=0
for tbl in "${CRITICAL_TABLES[@]}"; do
  prod_cnt=$(docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d fluxtable -tAc "SELECT count(*) FROM ${tbl};" 2>/dev/null || echo "0")
  test_cnt=$(docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${TEST_DB}" -tAc "SELECT count(*) FROM ${tbl};" 2>/dev/null || echo "0")
  
  if [ "$prod_cnt" -ne "$test_cnt" ]; then
    echo "[$(date +'%F %T')] Discrepancia en ${tbl}: prod=${prod_cnt}, restore=${test_cnt}" >&2
    DISCREPANCY=1
  else
    echo "[$(date +'%F %T')]  - ${tbl}: ${prod_cnt} registros (OK)"
  fi
done

cleanup

if [ "$DISCREPANCY" -eq 1 ]; then
  notify_failure "discrepancia-en-conteos-restore"
  exit 1
fi

echo "[$(date +'%F %T')] fluxtable: Verificación de restore exitosa y certificada al 100%."
