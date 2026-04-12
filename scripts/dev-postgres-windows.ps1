param(
  [switch]$StartOnly
)

$ErrorActionPreference = "Stop"

function Read-ConfiguredDatabaseUrl {
  if ($env:DATABASE_URL) {
    return $env:DATABASE_URL
  }

  foreach ($envFile in @(".env.local", ".env")) {
    $target = Join-Path (Get-Location) $envFile
    if (-not (Test-Path $target)) {
      continue
    }

    foreach ($line in Get-Content $target) {
      if ($line -match '^\s*DATABASE_URL\s*=\s*(.+?)\s*$') {
        return $matches[1].Trim().Trim('"').Trim("'")
      }
    }
  }

  return "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public"
}

function Get-DatabaseTarget {
  $databaseUrl = Read-ConfiguredDatabaseUrl
  $uri = [System.Uri]::new($databaseUrl)
  $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }

  return @{
    url = $databaseUrl
    host = $uri.Host
    port = $port
    isLocal = @("localhost", "127.0.0.1", "::1").Contains($uri.Host.ToLowerInvariant())
  }
}

$databaseTarget = Get-DatabaseTarget

function Test-PortOpen {
  param(
    [string]$TargetHost = $databaseTarget.host,
    [int]$Port = $databaseTarget.port
  )

  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $async = $client.BeginConnect($TargetHost, $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(1500, $false)
    if (-not $connected) {
      $client.Close()
      return $false
    }
    $client.EndConnect($async) | Out-Null
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Get-PostgresService {
  Get-Service -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "postgresql*" -or $_.DisplayName -like "PostgreSQL*" } |
    Sort-Object Name |
    Select-Object -First 1
}

function Get-PostgresBinPath {
  $base = "C:\Program Files\PostgreSQL"
  if (-not (Test-Path $base)) {
    return $null
  }

  $candidates = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending

  foreach ($candidate in $candidates) {
    $bin = Join-Path $candidate.FullName "bin"
    if (Test-Path (Join-Path $bin "psql.exe")) {
      return $bin
    }
  }

  return $null
}

function Write-Section {
  param([string]$Title)
  Write-Host ""
  Write-Host $Title -ForegroundColor Cyan
}

$report = [ordered]@{
  ok = $false
  checkedAt = (Get-Date).ToString("o")
  databaseUrl = $databaseTarget.url
  host = $databaseTarget.host
  port = $databaseTarget.port
  portReachable = $false
  postgresService = $null
  postgresBinPath = $null
  nextSteps = @()
}

if (Test-PortOpen) {
  $report.ok = $true
  $report.portReachable = $true
  $report.nextSteps = @(
    "Postgres is already reachable on $($databaseTarget.host):$($databaseTarget.port).",
    "Run npm run db:deploy.",
    "Run npm run db:seed."
  )
  $report | ConvertTo-Json -Depth 6
  exit 0
}

$service = if ($databaseTarget.isLocal) { Get-PostgresService } else { $null }
if ($null -ne $service) {
    $report.postgresService = @{
      name = $service.Name
      displayName = $service.DisplayName
      status = $service.Status.ToString()
    }

    if ($service.Status -ne "Running") {
      Write-Section "Starting PostgreSQL service"
      Start-Service -Name $service.Name
      Start-Sleep -Seconds 3
    }

    if (Test-PortOpen) {
    $report.ok = $true
    $report.portReachable = $true
    $report.postgresService.status = "Running"
    $report.nextSteps = @(
      "Postgres service is running on $($databaseTarget.host):$($databaseTarget.port).",
      "Run npm run db:deploy.",
      "Run npm run db:seed."
    )
    $report | ConvertTo-Json -Depth 6
    exit 0
  }
}

$binPath = Get-PostgresBinPath
if ($null -ne $binPath) {
  $report.postgresBinPath = $binPath
  $report.nextSteps += "A PostgreSQL installation was found at `"$binPath`", but $($databaseTarget.host):$($databaseTarget.port) is still not reachable. Start the PostgreSQL Windows service or open pgAdmin/Stack Builder to verify the server instance."
}

if ($StartOnly) {
  $report.nextSteps += "Postgres is not reachable yet."
  $report | ConvertTo-Json -Depth 6
  exit 1
}

if (-not $databaseTarget.isLocal) {
  $report.nextSteps += "The configured DATABASE_URL points to a non-local host. Verify that remote database is reachable from this machine."
}

$report.nextSteps += "If PostgreSQL is not installed, install it with the official Windows installer or winget install PostgreSQL.PostgreSQL."
$report.nextSteps += "After installation, ensure the server is listening on $($databaseTarget.host):$($databaseTarget.port)."
$report.nextSteps += "Then run npm run db:deploy and npm run db:seed."

$report | ConvertTo-Json -Depth 6
exit 1
