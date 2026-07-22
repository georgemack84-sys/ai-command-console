function Get-D2DPython {
  $candidates = @(
    "python",
    "python3",
    "py",
    "C:\Users\georg\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  )

  foreach ($candidate in $candidates) {
    $command = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($command) {
      return $command.Source
    }
  }

  throw "Python 3.11 or newer was not found. Install Python or set PATH before bootstrapping."
}

function Get-D2DNode {
  $candidates = @(
    "node",
    "C:\Users\georg\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  )

  foreach ($candidate in $candidates) {
    $command = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($command) {
      return $command.Source
    }
  }

  throw "Node.js 20 or newer was not found. Install Node.js or set PATH before bootstrapping."
}

function Invoke-D2DPython {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]] $Arguments)
  & (Get-D2DPython) @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Python command failed with exit code $LASTEXITCODE."
  }
}

function Invoke-D2DNode {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]] $Arguments)
  & (Get-D2DNode) @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Node command failed with exit code $LASTEXITCODE."
  }
}
