$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

./scripts/development/migrate.ps1
./scripts/test/test.ps1
./scripts/development/health.ps1
Write-Host "Local deployment qualification completed."
