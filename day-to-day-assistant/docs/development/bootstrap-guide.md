# Bootstrap Guide

## Requirements

- Git
- Python 3.11 or newer
- Node.js 20 or newer
- PowerShell 7 recommended
- Docker optional for containerized development

## Commands

```powershell
./scripts/bootstrap/check_machine.ps1
Copy-Item .env.example .env
./scripts/bootstrap/bootstrap.ps1
./scripts/test/test.ps1
./scripts/development/dev.ps1
```

## Validation

Bootstrap checks Python, Node, the environment file, data directory creation, pre-commit availability, Docker availability when present, and database migrations. Docker Compose provides PostgreSQL when Docker is available.

Run full local validation with:

```powershell
make quality
make test
make test-smoke
```
