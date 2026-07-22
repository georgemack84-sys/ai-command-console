$ErrorActionPreference = "Continue"
$ports = @(8010, 5174, 5175, 5176, 5177, 5178)
$processIds = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue |
  Where-Object { $_.State -eq "Listen" } |
  Select-Object -ExpandProperty OwningProcess -Unique

foreach ($processId in $processIds) {
  Stop-Process -Id $processId -Force
}

Write-Host "Requested stop for Day-to-Day Assistant development processes."
