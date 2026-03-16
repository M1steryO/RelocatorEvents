#!/usr/bin/env bash
set -euo pipefail

# Список контейнеров, которые надо поднять
CONTAINERS=(
  front-server-container
  gateway-server-container
  auth-server-container
  events-server-container
  media-server-container
  parser-server-container
)

start_one() {
  local name="$1"

  if ! docker inspect "$name" >/dev/null 2>&1; then
    echo "❌ Container not found: $name"
    return 1
  fi

  # Если уже запущен — ничего не делаем
  if docker ps --format '{{.Names}}' | grep -qx "$name"; then
    echo "✅ Already running: $name"
    return 0
  fi

  echo "▶ Starting: $name"
  docker start "$name" >/dev/null
}

main() {
  local failed=0

  for c in "${CONTAINERS[@]}"; do
    if ! start_one "$c"; then
      failed=1
    fi
  done

  echo
  echo "Status:"
  docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}" \
    | (head -n 1; grep -E "front-server-container|gateway-server-container|auth-server-container|events-server-container|media-server-container|parser-server-container" || true)

  exit "$failed"
}

main "$@"