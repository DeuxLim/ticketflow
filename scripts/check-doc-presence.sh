#!/usr/bin/env bash
set -euo pipefail

required_docs=(
  "docs/project-state.yaml"
  "docs/roadmap.md"
  "docs/changelog/progress-log.md"
  "docs/developer/README.md"
  "docs/deployment/free-platforms.md"
)

missing=0
for doc in "${required_docs[@]}"; do
  if [[ ! -f "${doc}" ]]; then
    echo "missing: ${doc}"
    missing=1
  fi
done

if [[ "${missing}" -ne 0 ]]; then
  echo "doc presence check failed"
  exit 1
fi

echo "doc presence check passed"
