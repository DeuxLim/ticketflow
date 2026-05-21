#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://ticketflow-frontend-flax.vercel.app/auth/login}"
HEALTH_URL="${HEALTH_URL:-https://ticketflow-api-rut0.onrender.com/api/health}"
LOGIN_URL="${LOGIN_URL:-https://ticketflow-api-rut0.onrender.com/api/auth/login}"

echo "[1/3] Frontend reachability: ${FRONTEND_URL}"
frontend_status="$(curl -sS -o /dev/null -w "%{http_code}" "${FRONTEND_URL}")"
echo "status=${frontend_status}"
if [[ "${frontend_status}" != "200" ]]; then
  echo "frontend check failed"
  exit 1
fi

echo "[2/3] Backend health: ${HEALTH_URL}"
health_status="$(curl -sS -o /tmp/ticketing-health.json -w "%{http_code}" "${HEALTH_URL}")"
echo "status=${health_status}"
cat /tmp/ticketing-health.json
echo
if [[ "${health_status}" != "200" ]]; then
  echo "health check failed"
  exit 1
fi

echo "[3/3] Auth endpoint behavior: ${LOGIN_URL}"
auth_status="$(curl -sS -o /tmp/ticketing-auth.json -w "%{http_code}" \
  -X POST "${LOGIN_URL}" \
  -H "Content-Type: application/json" \
  --data '{"email":"nobody@example.com","password":"wrongpass"}')"
echo "status=${auth_status}"
cat /tmp/ticketing-auth.json
echo
if [[ "${auth_status}" == "500" || "${auth_status}" == "502" || "${auth_status}" == "503" || "${auth_status}" == "504" ]]; then
  echo "auth endpoint returned 5xx"
  exit 1
fi

echo "hosted smoke check passed"
