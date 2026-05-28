#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] YAML parse check"
ruby -e 'require "yaml"; YAML.load_file("docs/project-state.yaml"); puts "project-state.yaml OK"'

echo "[2/3] Current focus check"
if ! rg -n "## Current Focus|RELIABILITY-P1|No active focus is set." docs/roadmap.md >/dev/null; then
  echo "roadmap current focus section missing expected content"
  exit 1
fi
echo "roadmap current focus check passed"

echo "[3/4] Active reliability task check"
if ! rg -n "RELIABILITY-P1-T02" docs/project-state.yaml docs/roadmap.md docs/changelog/progress-log.md >/dev/null; then
  echo "active reliability task markers missing"
  exit 1
fi
echo "active reliability task markers found"

echo "[4/4] Resume marker check"
if ! rg -n "## Resume From Here" docs/changelog/progress-log.md >/dev/null; then
  echo "progress log resume marker missing"
  exit 1
fi
echo "progress log resume marker found"

echo "tracker sync checks passed"
