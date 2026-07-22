$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1
if (Test-Path "data/day_to_day_assistant.sqlite3") {
  Remove-Item -LiteralPath "data/day_to_day_assistant.sqlite3"
}
Invoke-D2DPython ./scripts/development/migrate.py
Write-Host "Development database reset."
