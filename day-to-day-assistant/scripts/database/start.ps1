$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker is required to start PostgreSQL."
}

docker compose up -d postgres
Write-Host "PostgreSQL start requested."
