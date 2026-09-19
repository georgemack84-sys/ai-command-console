param(
  [string]$Task = "assembleDebug"
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$toolRoot = Join-Path $projectRoot ".tools"
$jdkRoot = Get-ChildItem -LiteralPath (Join-Path $toolRoot "temurin-21") -Directory -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName
$sdkRoot = Join-Path $toolRoot "android-sdk"

if (-not $jdkRoot -or -not (Test-Path -LiteralPath (Join-Path $jdkRoot "bin\\java.exe"))) {
  throw "Project-local JDK is missing. Install Temurin JDK 21 under .tools/temurin-21."
}

if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot "platforms\\android-36"))) {
  throw "Android SDK API 36 is missing. Install it under .tools/android-sdk."
}

$env:JAVA_HOME = $jdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$jdkRoot\\bin;$env:Path"

Push-Location (Join-Path $projectRoot "android")
try {
  & .\gradlew.bat $Task --console=plain --no-daemon
  if ($LASTEXITCODE -ne 0) {
    throw "Android build task $Task failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
