# Staging VM runbook

This stack runs PostgreSQL, migrations, the web process, and the external job
worker as separate Docker Compose services. PostgreSQL is not published to the
host network. The web service only binds to loopback and must sit behind a TLS
reverse proxy.

## Temporary hostname

The initial staging hostname is `https://34.45.207.173.sslip.io`. Replace it
with an owned subdomain before treating staging as a long-lived environment.

## First boot

On the VM, clone or upload the release source, copy `staging.env.example` to
`staging.env`, set the two secrets, and run:

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml up --build -d
```

Run migrations again after every release with:

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml run --rm migrate
```

The web service is ready for Nginx at `http://127.0.0.1:3000`.

## Safety checks

```bash
docker compose --env-file staging.env -f docker-compose.staging.yml ps
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/api/ready
```

Do not expose PostgreSQL on port 5432. Keep `staging.env` outside version
control and rotate either secret if it is ever displayed or copied to a log.
