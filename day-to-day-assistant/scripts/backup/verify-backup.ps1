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

$checksumPath = "$Path.sha256"
if (Test-Path $checksumPath) {
  $expected = (Get-Content $checksumPath -Raw).Trim().ToLowerInvariant()
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
  if ($expected -ne $actual) {
    throw "Backup checksum mismatch."
  }
}

Invoke-D2DPython -c "import sqlite3,sys; con=sqlite3.connect(sys.argv[1]); result=con.execute('PRAGMA integrity_check').fetchone()[0]; print(result); raise SystemExit(0 if result == 'ok' else 1)" $Path
Write-Host "Backup verified: $Path"
