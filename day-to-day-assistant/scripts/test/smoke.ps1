$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

try {
  $api = Invoke-RestMethod -Uri "http://127.0.0.1:8010/api/v1/health/ready"
  if ($api.status -ne "healthy") {
    throw "API readiness returned $($api.status)"
  }
} catch {
  Write-Error "API readiness smoke test failed: $($_.Exception.Message)"
}

$webPort = if (Test-Path ".dev/web-port.txt") { Get-Content ".dev/web-port.txt" } else { "5174" }
$web = Invoke-WebRequest -Uri "http://127.0.0.1:$webPort/" -UseBasicParsing
if ($web.StatusCode -ne 200) {
  throw "Frontend returned status $($web.StatusCode)"
}

Write-Host "Smoke tests passed."
