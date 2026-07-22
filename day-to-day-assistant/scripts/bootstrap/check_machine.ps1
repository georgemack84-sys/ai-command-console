$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")
. ./scripts/common/runtime.ps1

$failures = New-Object System.Collections.Generic.List[string]

function Test-CommandAvailable {
  param([string] $Name, [string] $Label)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    $failures.Add("$Label is not available on PATH.")
    return
  }
  & $Name --version
}

function Test-PortFree {
  param([int] $Port, [string] $Label)
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
  try {
    $listener.Start()
    Write-Host "$Label port $Port is available."
  } catch {
    Write-Host "$Label port $Port is already in use."
  } finally {
    $listener.Stop()
  }
}

Write-Host "Operating system: $([System.Runtime.InteropServices.RuntimeInformation]::OSDescription)"
Write-Host "Architecture: $([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)"

if (Get-Command git -ErrorAction SilentlyContinue) {
  git --version
} else {
  $failures.Add("Git is not available on PATH.")
}

try {
  Invoke-D2DPython --version
} catch {
  $failures.Add($_.Exception.Message)
}

try {
  Invoke-D2DNode --version
} catch {
  $failures.Add($_.Exception.Message)
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
  npm --version
} else {
  Write-Host "npm not found on PATH; Node runtime may still be available through bundled tooling."
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
  $dockerVersion = docker --version 2>$null
  if ($dockerVersion) {
    Write-Host $dockerVersion
  }
  $composeVersion = docker compose version 2>$null
  if ($composeVersion) {
    Write-Host $composeVersion
  }
  if ($LASTEXITCODE -ne 0) {
    $failures.Add("Docker Compose is not available.")
  }
  docker info *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker daemon is running."
  } else {
    Write-Host "Docker daemon is not reachable. PostgreSQL startup will be conditional."
  }
} else {
  Write-Host "Docker is not available. PostgreSQL startup will be conditional."
}

if (Get-Command make -ErrorAction SilentlyContinue) {
  make --version | Select-Object -First 1
} else {
  Write-Host "make is not available; PowerShell scripts can be used directly on Windows."
}

Test-PortFree -Port 8010 -Label "API"
Test-PortFree -Port 5174 -Label "Frontend"
Test-PortFree -Port 5432 -Label "PostgreSQL"

if (-not (Test-Path ".env")) {
  Write-Host ".env does not exist yet and can be created from .env.example."
} else {
  Write-Host ".env exists."
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Host "READY"
