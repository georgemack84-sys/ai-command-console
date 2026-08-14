# Repository Command Reference

## Shared command model

The dependency-free Node.js dispatcher in `scripts/proprium-command.cjs` is the
single command implementation. npm and PowerShell are entry points into that same
process, so they preserve command order, diagnostics, mutation boundaries, and
exit codes rather than maintaining separate Windows logic.

Run npm commands from the repository root. The PowerShell wrapper discovers the
dispatcher relative to its own location and may be called from any directory:

```text
npm run repo -- validate frontend
```

```powershell
& 'C:\path to\repository\scripts\proprium.ps1' validate frontend
```

PowerShell passes each token as a process argument; it does not construct or
evaluate a command string. Paths containing spaces therefore require only normal
PowerShell quoting around the script path.

## Canonical command parity

| Purpose | npm / Unix-like shell | PowerShell 7+ |
| --- | --- | --- |
| Full source validation | `npm run repo -- validate` | `.\scripts\proprium.ps1 validate` |
| Repository validation | `npm run repo -- validate repo` | `.\scripts\proprium.ps1 validate repo` |
| Frontend validation | `npm run repo -- validate frontend` | `.\scripts\proprium.ps1 validate frontend` |
| Backend validation | `npm run repo -- validate backend` | `.\scripts\proprium.ps1 validate backend` |
| Test-classification validation | `npm run repo -- validate test-classification` | `.\scripts\proprium.ps1 validate test-classification` |
| Check formatting | `npm run repo -- format check` | `.\scripts\proprium.ps1 format check` |
| Apply all formatting | `npm run repo -- format` | `.\scripts\proprium.ps1 format` |
| Apply frontend formatting | `npm run repo -- format frontend` | `.\scripts\proprium.ps1 format frontend` |
| Apply backend formatting | `npm run repo -- format backend` | `.\scripts\proprium.ps1 format backend` |
| Build both applications | `npm run repo -- build` | `.\scripts\proprium.ps1 build` |
| Build frontend | `npm run repo -- build frontend` | `.\scripts\proprium.ps1 build frontend` |
| Build backend | `npm run repo -- build backend` | `.\scripts\proprium.ps1 build backend` |
| Safe tests | `npm run repo -- test` | `.\scripts\proprium.ps1 test` |
| Unit tests | `npm run repo -- test unit` | `.\scripts\proprium.ps1 test unit` |
| Architecture tests | `npm run repo -- test architecture` | `.\scripts\proprium.ps1 test architecture` |
| Command help | `npm run repo -- --help` | `.\scripts\proprium.ps1 help` |

The [GP-13 command specification](gp-13-canonical-repository-commands.md) defines
the purpose, mutation, infrastructure, prerequisites, and ordering of each command.
Required failures return non-zero through either entry point. Neither entry point
accepts flags that skip required gates.

## Operational compatibility commands

The dispatcher also retains the existing operational commands. These are not part
of the infrastructure-independent validation contract.

| Command | Purpose | External requirement |
| --- | --- | --- |
| `bootstrap` | Restore root/frontend npm dependencies and the .NET solution | Network, Node.js, npm, .NET SDK |
| `dev` | Build and start the Proprium Compose stack | Docker Desktop / Compose v2 |
| `stop` | Stop the Compose stack without removing data | Docker Desktop / Compose v2 |
| `lint` | Compatibility alias for repository, frontend lint, and backend format checks | Restored dependencies |
| `migrate` | Run the one-shot migration service | Docker Desktop / Compose v2 |
| `health` | Check API liveness/readiness and frontend health | Running local stack |
| `export-permissions` | Export backend permissions through the API project | Restored/built .NET solution |
| `reset-db -Force` | Recreate the named Proprium development database volume | Running Docker; destructive to local Proprium data |

For example:

```powershell
.\scripts\proprium.ps1 bootstrap
.\scripts\proprium.ps1 dev
.\scripts\proprium.ps1 health
.\scripts\proprium.ps1 reset-db -Force
```

`reset-db` removes only the Compose volumes named by this repository and requires
the explicit PowerShell `-Force` switch. Do not use it for shared environments.

## Current boundary

GP-14 provides parity for the commands established by GP-13 and the operational
commands that already existed. Integration execution, OpenAPI generation/checking,
Docker qualification, and persistence qualification remain separate CI workflows
or low-level diagnostic commands until their planned canonical game plans define
stable public semantics. GP-14 does not invent placeholder PowerShell commands for
them. CI currently invokes the same underlying validators; later CI orchestration
may switch to the canonical category commands without changing their behavior.
