#!/usr/bin/env bash
set -euo pipefail

script_dir="scripts"
status=0

for script in "${script_dir}"/*.sh; do
  if [[ ! -x "${script}" ]]; then
    echo "not executable: ${script}"
    status=1
  fi

  if ! rg -q "^set -euo pipefail$" "${script}"; then
    echo "missing strict mode: ${script}"
    status=1
  fi
done

if [[ "${status}" -ne 0 ]]; then
  echo "script hygiene check failed"
  exit 1
fi

echo "script hygiene check passed"
