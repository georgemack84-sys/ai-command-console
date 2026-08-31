#!/usr/bin/env bash
set -euo pipefail

# This script runs from the checked-out release directory on the staging VM.
# Keep the host-only environment file outside the Docker build context so that
# neither Next's output tracer nor Docker can follow a dangling release symlink.
staging_env_file="${STAGING_ENV_FILE:-../shared/staging.env}"

if [[ ! -f "$staging_env_file" ]]; then
  echo "Staging environment file is missing: $staging_env_file" >&2
  exit 1
fi

set -a
source "$staging_env_file"
set +a

: "${POSTGRES_DB:=ai_command_console}"
: "${POSTGRES_USER:=ai_command_console}"
: "${DATABASE_URL:=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public}"

export DATABASE_URL
export STAGING_ENV_FILE="$staging_env_file"

docker-compose --env-file "$staging_env_file" -f docker-compose.staging.yml up --build -d
