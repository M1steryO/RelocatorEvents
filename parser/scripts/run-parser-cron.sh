#!/usr/bin/env bash
# Контейнер parser-server-container уже создан на проде (как в CI); cron только стартует его снова.
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
docker start -a parser-server-container
