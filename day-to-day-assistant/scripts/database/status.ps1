$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker unavailable."
  exit 0
}

docker compose ps postgres
