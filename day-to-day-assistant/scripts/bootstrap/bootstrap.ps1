$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1
./scripts/bootstrap/check_machine.ps1

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

Invoke-D2DPython --version
Invoke-D2DNode --version

New-Item -ItemType Directory -Force -Path "data" | Out-Null
Invoke-D2DPython ./scripts/development/migrate.py

if (Get-Command pre-commit -ErrorAction SilentlyContinue) {
  pre-commit install
} else {
  Write-Host "pre-commit not installed; hook installation skipped."
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) {
    docker compose up -d postgres
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Docker PostgreSQL startup skipped because docker compose returned exit code $LASTEXITCODE."
    }
  } else {
    Write-Host "Docker PostgreSQL startup skipped because the Docker daemon is not reachable."
  }
}

Write-Host "Bootstrap complete. Next: make test, then make dev."
