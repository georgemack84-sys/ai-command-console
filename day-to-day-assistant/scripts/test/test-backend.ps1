$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1
$env:PYTHONPATH = "$PWD/apps/api/src"
Invoke-D2DPython -m unittest discover -s apps/api/tests
