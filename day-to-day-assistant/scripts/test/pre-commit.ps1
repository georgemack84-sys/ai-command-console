$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

if (Get-Command pre-commit -ErrorAction SilentlyContinue) {
  pre-commit run --all-files
} else {
  Write-Host "pre-commit is not installed; running local fallback checks."
  ./scripts/test/format-check.ps1
  ./scripts/test/lint.ps1
  ./scripts/test/typecheck.ps1
  ./scripts/test/test.ps1
}
