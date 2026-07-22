#!/usr/bin/env sh
set -eu

echo "Operating system: $(uname -s)"
echo "Architecture: $(uname -m)"

check() {
  if command -v "$1" >/dev/null 2>&1; then
    "$1" --version | head -n 1
  else
    echo "MISSING: $1"
    return 1
  fi
}

check git
check python3
check node

if command -v docker >/dev/null 2>&1; then
  docker --version
  docker compose version || true
else
  echo "Docker missing; PostgreSQL runtime remains conditional."
fi

if [ -f .env ]; then
  echo ".env exists."
else
  echo ".env can be created from .env.example."
fi

echo "READY"
