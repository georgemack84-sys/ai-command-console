$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
$databasePath = $env:D2D_DATABASE_PATH
if (-not $databasePath) {
  $databasePath = "data/day_to_day_assistant.sqlite3"
}
if (-not (Test-Path $databasePath)) {
  throw "Database not found at $databasePath. Run migrations before backing up."
}

$backupDir = Join-Path (Split-Path $databasePath -Parent) "backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $backupDir "d2d-backup-$stamp.sqlite3"
Copy-Item -LiteralPath $databasePath -Destination $destination -Force
$checksum = Get-FileHash -Algorithm SHA256 -LiteralPath $destination
$checksum.Hash | Set-Content -Path "$destination.sha256" -Encoding ascii
Write-Host "Backup written to $destination"
Write-Host "SHA256 $($checksum.Hash)"
