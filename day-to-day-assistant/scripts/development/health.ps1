$ErrorActionPreference = "Stop"
try {
  Invoke-RestMethod -Uri "http://127.0.0.1:8010/api/v1/health"
} catch {
  Write-Error "API health check failed. Start the API with ./scripts/development/dev.ps1 or python apps/api/run.py"
}
