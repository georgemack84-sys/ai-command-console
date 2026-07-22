[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('bootstrap', 'dev', 'stop', 'build', 'test', 'lint', 'format', 'migrate', 'reset-db', 'health', 'help')]
    [string]$Command = 'help',
    [switch]$Force
)

$arguments = @('scripts/proprium-command.cjs', $Command)
if ($Force) { $arguments += '--force' }
node @arguments
exit $LASTEXITCODE
