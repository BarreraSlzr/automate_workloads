#!/bin/bash
# Canonical, ML-ready, safe orchestration wrapper for batch commit/fossil operations.
# See docs/CANONICAL_FOSSIL_MANAGEMENT_GUIDE.md and docs/PERFORMANCE_MONITORING_GUIDE.md

set -euo pipefail

# Check for timeout (from coreutils)
if ! command -v timeout &> /dev/null; then
  echo "[ERROR] 'timeout' not found. Please install coreutils: brew install coreutils" >&2
  exit 1
fi
# Check for gtime (GNU time)
if ! command -v gtime &> /dev/null; then
  echo "[ERROR] 'gtime' not found. Please install gnu-time: brew install gnu-time" >&2
  exit 1
fi

# Log file count and disk usage before execution
echo "[INFO] Fossil file count before:"
find fossils/ | wc -l

echo "[INFO] Fossil disk usage before:"
du -sh fossils/

# Run the main commit logic with timeout and gtime for resource monitoring
TIMEOUT_BIN=$(command -v timeout)
GTIME_BIN=$(command -v gtime)

$TIMEOUT_BIN 10m $GTIME_BIN -v bash scripts/canonical-commit.sh.original

# Run project validation and cleanup
bun run validate:unified
bun run src/cli/canonical-fossil-manager.ts generate-yaml

# Log file count and disk usage after execution
echo "[INFO] Fossil file count after:"
find fossils/ | wc -l

echo "[INFO] Fossil disk usage after:"
du -sh fossils/

echo "[INFO] Canonical commit complete and validated." 