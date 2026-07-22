$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1
Invoke-D2DNode apps/web/tests/smoke.test.mjs
