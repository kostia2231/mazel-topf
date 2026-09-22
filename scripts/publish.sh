#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

message="${*:-menu update}"

if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -q -m "content: $message"
    git push -q origin main
    echo "saved to git: $message"
else
    echo "nothing changed in the files, deploying the current state"
fi

bash scripts/deploy.sh --yes
