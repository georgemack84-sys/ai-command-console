# Troubleshooting

| Symptom | Check | Resolution |
| --- | --- | --- |
| API readiness returns 503 | `docker compose -f docker-compose.proprium.yml ps` and `logs platform-api` | Confirm PostgreSQL and Redis are healthy, then rerun `make dev`. |
| Migration service fails | `docker compose -f docker-compose.proprium.yml logs database-migrations` | Fix the forward migration or configuration; do not edit migration history manually. |
| Port 3000, 55432, 6379, or 8080 is occupied | `docker ps` and local process manager | Stop the conflicting local service or change the Compose port mapping deliberately. |
| Environment validation fails | `npm run validate:configuration` | Start from the relevant `.env.example`; remove secrets from browser-visible variables. |
| Local database needs a clean slate | `.\scripts\proprium.ps1 reset-db -Force` | This deletes only the named Proprium development PostgreSQL volume. |
| PowerShell reports that Node.js is missing or too old | `node --version` and `Get-Command node` | Install Node.js 24+, open a new PowerShell 7 session, and rerun the command. |
| A command works only from the repository root | `& 'C:\path to\repository\scripts\proprium.ps1' help` | Use the GP-14 wrapper by absolute path; it discovers the repository from its script location. |
| A canonical child tool fails | Read the inherited npm, .NET, or Docker diagnostic immediately above the wrapper error | Install or repair the named prerequisite; the wrapper intentionally preserves the non-zero result. |
| PowerShell execution policy blocks the checked-in wrapper | `Get-ExecutionPolicy -List` | Use an organization-approved PowerShell 7 policy. Do not copy commands into a second local script. |
| CI differs from local validation | `.\scripts\proprium.ps1 format check`, `validate`, `test`, and `build` | Use the canonical categories; infrastructure and browser qualification remain explicit CI jobs. |
