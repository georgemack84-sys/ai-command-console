$ErrorActionPreference = "Stop"
param(
  [Parameter(Mandatory = $true)]
  [string] $Path
)

Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1

if (-not (Test-Path $Path)) {
  throw "Backup not found at $Path."
}

$targetDir = "data/restore-rehearsals"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
$target = Join-Path $targetDir ("restore-rehearsal-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".sqlite3")
Copy-Item -LiteralPath $Path -Destination $target -Force
Invoke-D2DPython -c "import sqlite3,sys; con=sqlite3.connect(sys.argv[1]); result=con.execute('PRAGMA integrity_check').fetchone()[0]; print(result); raise SystemExit(0 if result == 'ok' else 1)" $target
Write-Host "Restore rehearsal staged at $target"
