param(
  [ValidateSet("bundleRelease", "assembleRelease")]
  [string]$Task = "bundleRelease"
)

$required = @(
  "AXIOM_ANDROID_KEYSTORE_PATH",
  "AXIOM_ANDROID_KEYSTORE_PASSWORD",
  "AXIOM_ANDROID_KEY_ALIAS",
  "AXIOM_ANDROID_KEY_PASSWORD"
)
$missing = $required | Where-Object { [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_)) }

if ($missing) {
  throw "A signed release requires: $($missing -join ', '). Set them as process environment variables; do not commit them to .env files."
}

$keystorePath = [Environment]::GetEnvironmentVariable("AXIOM_ANDROID_KEYSTORE_PATH")
if (-not (Test-Path -LiteralPath $keystorePath)) {
  throw "AXIOM_ANDROID_KEYSTORE_PATH does not point to a readable keystore."
}

$env:AXIOM_ANDROID_KEYSTORE_PATH = (Resolve-Path -LiteralPath $keystorePath).Path
& (Join-Path $PSScriptRoot "android-build.ps1") -Task $Task
exit $LASTEXITCODE
