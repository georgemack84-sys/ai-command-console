$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1
$python = Get-D2DPython
$node = Get-D2DNode
New-Item -ItemType Directory -Force -Path ".dev" | Out-Null

function Test-D2DPortOpen {
  param([int] $Port)
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $asyncResult = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $asyncResult.AsyncWaitHandle.WaitOne(200)) {
      return $false
    }
    $client.EndConnect($asyncResult)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

$webPort = 5174
while (Test-D2DPortOpen -Port $webPort) {
  $webPort += 1
}
$env:D2D_WEB_PORT = "$webPort"

if (Test-D2DPortOpen -Port 8010) {
  Write-Host "API already listening on http://127.0.0.1:8010"
} else {
  Write-Host "Starting API on http://127.0.0.1:8010"
  Start-Process -WindowStyle Hidden -FilePath $python -ArgumentList "apps/api/run.py" -WorkingDirectory "$PWD" -RedirectStandardOutput ".dev/api.out.log" -RedirectStandardError ".dev/api.err.log"
}
Write-Host "Starting web on http://127.0.0.1:$webPort"
Start-Process -WindowStyle Hidden -FilePath $node -ArgumentList "server.mjs" -WorkingDirectory "$PWD/apps/web" -RedirectStandardOutput "$PWD/.dev/web.out.log" -RedirectStandardError "$PWD/.dev/web.err.log"
Set-Content -Path ".dev/web-port.txt" -Value "$webPort"
Write-Host "Development servers requested. Use ./scripts/development/stop.ps1 to stop project ports if needed."
