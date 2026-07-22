# Repository Command Reference

The canonical command surface is available through `make` and the Windows-compatible PowerShell wrapper. Both delegate to the same repository-owned implementation.

| Command | Purpose |
| --- | --- |
| `bootstrap` | Restore root/frontend Node dependencies and the .NET solution. |
| `dev` | Build and start the isolated Proprium Compose stack. |
| `stop` | Stop the isolated Proprium Compose stack without removing data. |
| `build` | Build frontend and backend without live infrastructure. |
| `test` | Run frontend tests and backend non-integration tests. |
| `lint` | Run repository validation, frontend lint, and backend format verification. |
| `format` | Apply frontend and backend formatting. |
| `migrate` | Run the one-shot migration service. |
| `reset-db` | Deliberately recreate the Proprium local database. |
| `health` | Check API liveness/readiness and frontend health. |

Examples:

```powershell
.\scripts\proprium.ps1 bootstrap
.\scripts\proprium.ps1 dev
.\scripts\proprium.ps1 reset-db -Force
```

```text
make bootstrap
make dev
make reset-db
```

`reset-db` removes only the named `proprium` Compose PostgreSQL volume. The PowerShell wrapper requires `-Force`; the Make target is already an explicit destructive command.
