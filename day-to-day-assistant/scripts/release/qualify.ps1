$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

./scripts/test/test.ps1
./scripts/test/lint.ps1
./scripts/test/typecheck.ps1
./scripts/test/format-check.ps1
Write-Host "Release checks completed. Record the result from the Operations page."
