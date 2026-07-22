#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."
./scripts/bootstrap/check_machine.sh

if [ ! -f .env ]; then
  cp .env.example .env
fi

python3 scripts/development/migrate.py
echo "Bootstrap complete."
