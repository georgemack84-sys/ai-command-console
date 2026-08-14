# Developer Setup

## Supported prerequisites

Install:

- Git with long-path support appropriate for your checkout;
- Node.js 24 with its bundled npm;
- the .NET SDK selected by the repository `global.json`;
- PowerShell 7 or later on Windows; and
- Docker Desktop with Compose v2 only for local infrastructure workflows.

GNU Make is optional. The canonical npm entry point works on supported Unix-like
and Windows environments, and the PowerShell entry point delegates to the same
dispatcher. Confirm prerequisites from PowerShell with:

```powershell
git --version
node --version
npm --version
dotnet --version
pwsh --version
docker compose version
```

The PowerShell wrapper checks Node.js itself and exits with an actionable non-zero
diagnostic when Node.js 24+ is unavailable. Individual canonical commands similarly
fail when required npm, .NET, or Docker executables cannot be started; they never
skip a required step.

## Clean-machine path

1. Clone the repository to any writable local path. Paths containing spaces are
   supported.
2. Review the [configuration guide](configuration.md). Copy a documented
   `.env.example` only when local overrides are needed; never commit `.env` files.
3. Restore deterministic dependencies:

   ```powershell
   .\scripts\proprium.ps1 bootstrap
   ```

4. Run the infrastructure-independent merge-preparation checks:

   ```powershell
   .\scripts\proprium.ps1 format check
   .\scripts\proprium.ps1 validate
   .\scripts\proprium.ps1 test
   ```

5. Provide the four public frontend build values from `apps/web/.env.example`,
   then qualify both applications:

   ```powershell
   $env:NEXT_PUBLIC_APP_NAME = 'Proprium'
   $env:NEXT_PUBLIC_APP_VERSION = 'local'
   $env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080'
   $env:NEXT_PUBLIC_ENVIRONMENT = 'development'
   .\scripts\proprium.ps1 build
   ```

6. When infrastructure work is required, start and verify the isolated stack:

   ```powershell
   .\scripts\proprium.ps1 dev
   .\scripts\proprium.ps1 health
   ```

The Compose project owns its PostgreSQL and Redis containers. Database migrations
run before the API starts. Source validation does not start Docker, PostgreSQL,
Redis, the API, or the frontend server.

## Running outside the repository root

The PowerShell wrapper resolves the canonical dispatcher from `$PSScriptRoot` and
the dispatcher resolves all project paths from its own file. Use an absolute script
path when the current directory is elsewhere:

```powershell
& 'D:\workspaces\Proprium Repository\scripts\proprium.ps1' validate repo
```

The wrapper does not change the caller's current directory or environment. The
frontend build child alone receives `NODE_ENV=production`, which Next.js requires.

## Recovery and reset

Stop local services without deleting their data:

```powershell
.\scripts\proprium.ps1 stop
```

If the local Proprium database must be recreated, use the explicitly destructive
command:

```powershell
.\scripts\proprium.ps1 reset-db -Force
```

This removes the repository's named development volumes and must never target a
shared database. See the [local infrastructure guide](../operations/local-infrastructure.md),
[troubleshooting guide](../operations/troubleshooting.md), and
[command reference](../engineering/repository-commands.md).
