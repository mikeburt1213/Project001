#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")/.."

if ! gh auth status &>/dev/null; then
  echo "Opening browser to authenticate with GitHub..."
  gh auth login --hostname github.com --git-protocol https --web
fi
gh auth setup-git

echo "Force-pushing full local main (complete app including App.tsx, assets, lockfile)..."
git push -u origin main --force-with-lease
echo ""
echo "Success: https://github.com/mikeburt1213/Project001"
