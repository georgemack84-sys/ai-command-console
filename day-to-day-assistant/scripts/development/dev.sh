#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."
python3 apps/api/run.py &
node apps/web/server.mjs &
wait
