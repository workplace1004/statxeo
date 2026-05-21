#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0

GREP_OPTS=(--include='*.ts' --include='*.tsx' -R)
PATHS=(src/app src/server src/lib/statxai)

check() {
  local label="$1"
  local pattern="$2"
  if grep "${GREP_OPTS[@]}" -e "$pattern" "${PATHS[@]}" >/dev/null 2>&1; then
    echo "FAIL: $label"
    grep "${GREP_OPTS[@]}" -n -e "$pattern" "${PATHS[@]}" || true
    fail=1
  fi
}

check "@supabase imports in production paths" "@supabase"
check "SUPABASE_ env references in production paths" "SUPABASE_"
check "lib/supabase imports in production paths" "lib/supabase"
check 'legacy .from("statxeo_") in production paths' '\.from\("statxeo_'

check "@supabase in package.json" \
  grep "@supabase" package.json

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Supabase purge check failed. Mongo + statxeo_session only."
  exit 1
fi

echo "OK: no Supabase references in production bundle paths."
