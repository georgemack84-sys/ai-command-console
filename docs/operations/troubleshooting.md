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
| Repository CI fails | `npm run repo -- validate repo`, `npm run test:repository-commands`, and `npm run test:ci-workflow` | Repair the reported repository rule, command contract, or workflow contract; do not bypass the gate. |
| Frontend CI fails | `npm run repo -- validate frontend` and `npm run repo -- build frontend` | Restore `apps/web/package-lock.json` with `npm ci`, then follow the named formatting, ESLint, TypeScript, architecture, test, build, or browser diagnostic. |
| Backend CI fails | `npm run repo -- validate backend` and `npm run backend:test:unit` | Use the SDK selected by `global.json`; repair the named format, compiler, analyzer, architecture, classification, unit-test, or permission-catalog failure. |
| Integration CI cannot become ready | `docker compose -f docker-compose.proprium.yml ps` and `logs postgres redis database-migrations` | Confirm PostgreSQL/Redis health and the one-shot migration result before rerunning the classified integration suite. |
| Docker CI fails | `npm run repo -- validate docker` | Fix the reported Compose configuration, build context, Dockerfile, or image-build failure. Images are never published by this gate. |
| OpenAPI CI fails | Build `Proprium.Api` in Release, then run `npm run repo -- validate openapi` | Fix backend generation or the reported OpenAPI invariant; the temporary contract is never committed automatically. |
| Health CI fails | `npm run repo -- dev` followed by `npm run repo -- health` | Inspect Compose logs for startup, migration, liveness, readiness, or frontend-health failures, then run `docker compose -f docker-compose.proprium.yml down --volumes --remove-orphans`. |
