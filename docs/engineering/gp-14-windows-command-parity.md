# GP-14 Windows Command Parity

## Decision

GP-14 exposes the complete GP-13 command vocabulary through PowerShell 7 without
creating a Windows validation implementation. `scripts/proprium.ps1` is a bounded
adapter: it locates `proprium-command.cjs` relative to `$PSScriptRoot`, verifies
Node.js 24+, forwards tokens through PowerShell's argument operator, and exits with
the dispatcher's exact status. The Node dispatcher continues to own paths, command
composition, tool invocation, output, configuration behavior, and failure policy.

This design provides capability parity rather than identical shell syntax:

```text
npm run repo -- validate backend
.\scripts\proprium.ps1 validate backend
```

Both reach the same command definition and repository-owned tools. No command uses
`Invoke-Expression`, concatenated shell text, a hard-coded checkout path, home
directory, or drive letter.

## Platform contract

- Invocation is independent of the caller's current directory.
- Script and repository paths containing spaces are passed as individual arguments.
- Standard output and error remain attached to the child process.
- Child success returns zero; child failure and interruption return non-zero.
- Missing or unsupported Node.js fails before dispatch with remediation guidance.
- Missing downstream tools fail through the shared dispatcher's executable error.
- Environment variable names and GP-03 precedence remain platform-neutral.
- The wrapper does not enumerate, log, or persist environment values or secrets.
- `.gitattributes` keeps tracked text canonical while explicitly checking out
  PowerShell files with CRLF and shell files with LF.
- Non-mutating command semantics and infrastructure boundaries remain those defined
  by GP-13.

## Automated evidence

`npm run test:repository-commands` executes the shared dispatcher contract plus
Windows-specific child-process tests. On Windows with PowerShell 7, the tests prove:

- invocation from a nested caller directory;
- forwarding of a two-token command without shell evaluation;
- wrapper and dispatcher discovery beneath a temporary path containing spaces;
- propagation of the dispatcher's non-zero unknown-command result; and
- an actionable exit `127` when Node.js is absent from `PATH`.

PowerShell-specific cases are skipped on platforms where PowerShell 7 is not
installed; the platform-independent dispatcher contract still runs there. The
[repository command reference](repository-commands.md) records the full parity
matrix and the [developer setup guide](../onboarding/developer-setup.md) records the
clean-machine workflow.

## Deliberate boundary

GP-14 does not add commands that GP-13 did not define. OpenAPI generation and drift
checking, integration execution, Docker qualification, persistence qualification,
and full health qualification already have CI or low-level implementation paths,
but their stable canonical semantics belong to later game plans. Creating Windows
aliases now would establish an unreviewed second public API. Existing operational
`dev`, `stop`, `migrate`, and `health` commands remain available through PowerShell
and fail closed when their Docker or runtime prerequisites are unavailable.

CI currently calls the same underlying repository, frontend, backend, architecture,
and classification validators. GP-14 does not rewrite GitHub Actions ahead of the
planned CI game plan; future jobs can adopt the GP-13 categories without changing
the Windows adapter or validation implementation.
