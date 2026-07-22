$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
./scripts/test/format-check.ps1
Write-Host "Format command completed. Automated rewriting is deferred until Ruff/Prettier dependencies are installed."
