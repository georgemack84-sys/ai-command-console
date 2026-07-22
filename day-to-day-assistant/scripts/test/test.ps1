$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
./scripts/test/test-backend.ps1
./scripts/test/test-frontend.ps1
./scripts/test/test-integration.ps1
Write-Host "Tests passed."
