#!/usr/bin/env bash
# Ставит cron: два раза в день вызывается docker start (через run-parser-cron.sh).
#
#   ./install-parser-cron.sh              — в crontab текущего пользователя
#   sudo ./install-parser-cron.sh --system  — файл /etc/cron.d/relocator-parser (user root)
#
# Расписание по умолчанию: 12:00 и 20:00 (локальное время). Переопределение:
#   PARSER_CRON_SCHEDULE='0 10,18 * * *' ./install-parser-cron.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_SCRIPT="${SCRIPT_DIR}/run-parser-cron.sh"
SCHEDULE="${PARSER_CRON_SCHEDULE:-0 12,20 * * *}"
MARKER="relocator-parser-cron"

if [[ ! -x "${RUN_SCRIPT}" ]]; then
  chmod +x "${RUN_SCRIPT}" || true
fi

if [[ "${1:-}" == "--system" ]]; then
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "Для --system нужен root: sudo $0 --system" >&2
    exit 1
  fi
  LOG_FILE="${PARSER_CRON_LOG:-/var/log/parser-cron.log}"
  CRON_FILE="/etc/cron.d/relocator-parser"
  LINE="${SCHEDULE} root ${RUN_SCRIPT} >> ${LOG_FILE} 2>&1"
  umask 022
  {
    echo "# ${MARKER} — managed by install-parser-cron.sh"
    echo "SHELL=/bin/sh"
    echo "PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin"
    echo "${LINE}"
    echo ""
  } >"${CRON_FILE}"
  chmod 644 "${CRON_FILE}"
  echo "Записано ${CRON_FILE}"
  echo "Строка: ${LINE}"
  exit 0
fi

LOG_FILE="${PARSER_CRON_LOG:-${HOME}/.local/state/relocator-parser-cron.log}"
mkdir -p "$(dirname "${LOG_FILE}")"
LINE="${SCHEDULE} ${RUN_SCRIPT} >> ${LOG_FILE} 2>&1 # ${MARKER}"

TMP="$(mktemp)"
( crontab -l 2>/dev/null | grep -vF "${MARKER}" || true
  echo "${LINE}"
) >"${TMP}"
crontab "${TMP}"
rm -f "${TMP}"

echo "Добавлено в crontab пользователя $(whoami)"
echo "${LINE}"
