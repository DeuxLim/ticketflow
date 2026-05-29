#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://ticketflow-frontend-flax.vercel.app/auth/login}"
HEALTH_URL="${HEALTH_URL:-https://ticketflow-api-rut0.onrender.com/api/health}"
LOGIN_URL="${LOGIN_URL:-https://ticketflow-api-rut0.onrender.com/api/auth/login}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-8}"
CURL_MAX_TIME="${CURL_MAX_TIME:-20}"
CURL_RETRY="${CURL_RETRY:-1}"

HEALTH_TMP=""
AUTH_TMP=""

cleanup() {
  rm -f "${HEALTH_TMP:-}" "${AUTH_TMP:-}"
}
trap cleanup EXIT

HEALTH_TMP="$(mktemp /tmp/ticketing-health.XXXXXX.json)"
AUTH_TMP="$(mktemp /tmp/ticketing-auth.XXXXXX.json)"

echo "[1/3] Frontend reachability: ${FRONTEND_URL}"
frontend_status="$(curl -sS --retry "${CURL_RETRY}" --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -o /dev/null -w "%{http_code}" "${FRONTEND_URL}")"
echo "status=${frontend_status}"
if [[ "${frontend_status}" != "200" ]]; then
  echo "frontend check failed"
  exit 1
fi

echo "[2/3] Backend health: ${HEALTH_URL}"
health_status="$(curl -sS --retry "${CURL_RETRY}" --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -o "${HEALTH_TMP}" -w "%{http_code}" "${HEALTH_URL}")"
echo "status=${health_status}"
cat "${HEALTH_TMP}"
echo
if [[ "${health_status}" != "200" ]]; then
  echo "health check failed"
  exit 1
fi

echo "[3/3] Auth endpoint behavior: ${LOGIN_URL}"
auth_status="$(curl -sS --retry "${CURL_RETRY}" --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -o "${AUTH_TMP}" -w "%{http_code}" \
  -X POST "${LOGIN_URL}" \
  -H "Content-Type: application/json" \
  --data '{"email":"nobody@example.com","password":"wrongpass"}')"
echo "status=${auth_status}"
cat "${AUTH_TMP}"
echo
if [[ "${auth_status}" =~ ^5[0-9][0-9]$ ]]; then
  echo "auth endpoint returned 5xx"
  exit 1
fi

echo "hosted smoke check passed"
