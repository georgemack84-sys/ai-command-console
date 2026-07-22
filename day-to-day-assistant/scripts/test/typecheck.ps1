$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1
Invoke-D2DPython -m compileall apps/api/run.py apps/api/src apps/api/tests scripts/development
Invoke-D2DNode --check apps/web/server.mjs
Invoke-D2DNode --check apps/web/src/main.js
Invoke-D2DNode --check apps/web/src/api-client.js
Write-Host "Typecheck placeholder passed. Install pyright/tsc in Phase 1 to enforce strict type checks."
