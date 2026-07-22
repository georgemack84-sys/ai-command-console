#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/../.."
PYTHONPATH="$PWD/apps/api/src" python3 -m unittest discover -s apps/api/tests
node apps/web/tests/smoke.test.mjs
