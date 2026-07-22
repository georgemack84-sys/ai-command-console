$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

if ($env:D2D_CONFIRM_DATABASE_RESET -ne "yes") {
  Write-Error "Refusing to reset database without D2D_CONFIRM_DATABASE_RESET=yes."
}

docker compose down -v
docker compose up -d postgres
Write-Host "PostgreSQL volume reset requested."
