#!/usr/bin/env bash
set -euo pipefail

# Run as root on the staging VM. The script is intentionally idempotent: it
# never overwrites the generated runtime environment after first boot.
APP_ROOT="/srv/ai-command-console/staging"
SHARED_ROOT="$APP_ROOT/shared"
HOSTNAME="34.45.207.173.sslip.io"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash scripts/bootstrap-staging-vm.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose nginx openssl
systemctl enable --now docker nginx

if id deploy >/dev/null 2>&1; then
  usermod -aG docker deploy
fi

install -d -m 0750 -o deploy -g deploy "$APP_ROOT" "$SHARED_ROOT"

if [[ ! -f "$SHARED_ROOT/staging.env" ]]; then
  auth_secret="$(openssl rand -base64 48 | tr -d '\n')"
  admin_secret="$(openssl rand -base64 48 | tr -d '\n')"
  postgres_password="$(openssl rand -hex 32)"
  database_url="postgresql://ai_command_console:"
  database_url+="$postgres_password"
  database_url+="@postgres:5432/ai_command_console?schema=public"
  cat >"$SHARED_ROOT/staging.env" <<EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$HOSTNAME
AI_COMMAND_CONSOLE_AUTH_SECRET=$auth_secret
ADMIN_SECRET=$admin_secret
AI_COMMAND_CONSOLE_SECURE_COOKIES=true
AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS=1209600
AI_COMMAND_CONSOLE_STORAGE_DRIVER=sqlite
AI_COMMAND_CONSOLE_DATA_ROOT=/var/lib/ai-command-console
AI_COMMAND_CONSOLE_DATABASE_PATH=/var/lib/ai-command-console/workspace.sqlite
AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH=/var/lib/ai-command-console/agents/console.sqlite
AI_COMMAND_CONSOLE_WRITE_LEGACY_JSON_MIRRORS=false
OBSERVABILITY_MODE=full
SECURITY_MODE=enforced
CONTINUITY_VERIFICATION_ENABLED=true
INTEGRITY_VALIDATION_ENABLED=true
RESTORE_SIMULATION_ENABLED=true
FAIL_FAST_ENABLED=true
DEBUG_MODE=false
POSTGRES_DB=ai_command_console
POSTGRES_USER=ai_command_console
POSTGRES_PASSWORD=$postgres_password
DATABASE_URL=$database_url
EOF
  chown deploy:deploy "$SHARED_ROOT/staging.env"
  chmod 0600 "$SHARED_ROOT/staging.env"
fi

cat >/etc/nginx/sites-available/ai-command-console-staging <<EOF
server {
  listen 80;
  server_name $HOSTNAME;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
ln -sfn /etc/nginx/sites-available/ai-command-console-staging /etc/nginx/sites-enabled/ai-command-console-staging
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "Bootstrap complete. Runtime env: $SHARED_ROOT/staging.env"
echo "Next: deploy a release, then request TLS with certbot for $HOSTNAME."
