# Troubleshooting

## API Does Not Start

Run:

```powershell
Get-Content .dev/api.err.log
./scripts/development/health.ps1
```

Check that port `8010` is free and `.env` exists.

## Web Port Is Not 5174

If `5174` is occupied, `make dev` uses a fallback port and writes it to `.dev/web-port.txt`.

## Docker Is Unavailable

`make doctor` reports Docker status. Local API and web tests can still run, but Phase 1 PostgreSQL qualification remains conditional until Docker Compose works.

## PostgreSQL Port Conflict

Stop the conflicting local database or set `D2D_POSTGRES_PORT` in `.env`.

## Pre-Commit Is Not Installed

Install with:

```powershell
make pre-commit-install
```
