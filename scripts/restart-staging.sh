#!/usr/bin/env bash
set -euo pipefail

# This script runs through the `current` release symlink on the staging VM.
# Use the bootstrap-managed absolute path: relative paths are resolved after
# that symlink and therefore point into a release directory rather than the
# staging root. Keeping the file outside a release also prevents it leaking
# into the Docker build context.
staging_env_file="${STAGING_ENV_FILE:-/srv/ai-command-console/staging/shared/staging.env}"

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

if ! docker-compose --env-file "$staging_env_file" -f docker-compose.staging.yml up --build -d; then
  # Compose does not include the dependent container's output in its failure
  # message. Emit only service state and PostgreSQL's own logs; neither exposes
  # the environment file nor its credentials.
  echo "Staging Compose startup failed; collecting PostgreSQL diagnostics." >&2
  docker-compose --env-file "$staging_env_file" -f docker-compose.staging.yml ps >&2 || true
  docker-compose --env-file "$staging_env_file" -f docker-compose.staging.yml logs --no-color postgres >&2 || true
  exit 1
fi
