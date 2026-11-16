#!/usr/bin/env bash
# Safe cleanup of generated Next.js / TypeScript artefacts.
# Usage: bash scripts/cleanup-dev-cache.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if pgrep -f "next dev" >/dev/null 2>&1; then
  echo "⚠  A 'next dev' server is running. Stop it (Ctrl+C) and run this again."
  exit 1
fi

before="$(du -sh .next 2>/dev/null | awk '{print $1}' || echo '0')"
rm -rf .next
rm -f tsconfig.tsbuildinfo
rm -f .npmrc.tmp

after="$(du -sh . 2>/dev/null | awk '{print $1}')"
echo "✓ Removed .next (was ${before}) and generated tsbuildinfo."
echo "  Project is now ${after}. Run 'npm run dev' to rebuild the cache."
