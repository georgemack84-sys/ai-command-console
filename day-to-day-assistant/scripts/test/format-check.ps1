$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path "$PSScriptRoot/../..")

$files = Get-ChildItem -Recurse -File |
  Where-Object {
    $_.FullName -notmatch "\\.git\\" -and
    $_.FullName -notmatch "\\.dev\\" -and
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.Extension -in @(".md", ".py", ".ps1", ".js", ".mjs", ".json", ".yml", ".yaml", ".toml", ".css", ".html")
  }

foreach ($file in $files) {
  $text = Get-Content -LiteralPath $file.FullName -Raw
  if ($text -match "[ `t]+`r?`n") {
    throw "Trailing whitespace found in $($file.FullName)"
  }
}

Write-Host "Format check passed."
