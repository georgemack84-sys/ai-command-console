[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Command = 'help',

  [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
  [string[]]$CommandArguments = @(),

  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dispatcher = Join-Path -Path $PSScriptRoot -ChildPath 'proprium-command.cjs'
if (-not (Test-Path -LiteralPath $dispatcher -PathType Leaf)) {
  [Console]::Error.WriteLine(
    "Canonical repository dispatcher was not found at '$dispatcher'."
  )
  exit 1
}

$nodeCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue |
  Select-Object -First 1
if ($null -eq $nodeCommand) {
  [Console]::Error.WriteLine(
    'Node.js 24 or later is required but was not found on PATH. Install Node.js, open a new PowerShell session, and rerun the command.'
  )
  exit 127
}

$nodeVersion = & $nodeCommand.Source --version
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(?<Major>\d+)\.') {
  [Console]::Error.WriteLine(
    'The Node.js version could not be determined. Install Node.js 24 or later and rerun the command.'
  )
  exit 1
}
if ([int]$Matches.Major -lt 24) {
  [Console]::Error.WriteLine(
    "Node.js 24 or later is required; found $nodeVersion."
  )
  exit 1
}

$forwardedArguments = @($dispatcher, $Command) + @($CommandArguments)
if ($Force.IsPresent) {
  $forwardedArguments += '--force'
}

& $nodeCommand.Source @forwardedArguments
exit $LASTEXITCODE
