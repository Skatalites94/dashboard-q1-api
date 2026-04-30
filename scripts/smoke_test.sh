#!/bin/bash
# Smoke test post-deploy. Uso:
#   ./scripts/smoke_test.sh https://tu-dominio.up.railway.app <DASHBOARD_PASSWORD>
# Sin password si DASHBOARD_PASSWORD no está activado.
set -e

URL="${1:-http://localhost:8000}"
PASS="${2:-}"

if [ -n "$PASS" ]; then
  AUTH="-u admin:$PASS"
else
  AUTH=""
fi

ENDPOINTS=(
  "/health"
  "/api/comercial/bootstrap"
  "/api/comercial/touchpoint-flows/"
  "/api/comercial/canvas-layout/"
  "/api/gastos/bootstrap"
  "/api/bootstrap"
)

EXIT=0
echo "Smoke test: $URL"
echo "─────────────────────────────────────────"
for ep in "${ENDPOINTS[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" $AUTH "$URL$ep" || echo "000")
  if [ "$code" = "200" ]; then
    printf "  ✓ %-45s %s\n" "$ep" "$code"
  else
    printf "  ✗ %-45s %s\n" "$ep" "$code"
    EXIT=1
  fi
done
echo "─────────────────────────────────────────"
[ "$EXIT" = "0" ] && echo "Smoke test OK" || echo "Smoke test FAILED"
exit $EXIT
