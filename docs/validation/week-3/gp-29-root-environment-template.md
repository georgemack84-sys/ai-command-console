# GP-29 Root Environment Template Validation

## Scope

This record qualifies the eight-key Repository Platform contract, metadata,
placeholder safety, typed port checks, Compose consumer alignment, local-file
exclusion, CI cleanup, and infrastructure-independent application builds.

## Automated evidence

| Evidence                                 | Result                                            |
| ---------------------------------------- | ------------------------------------------------- |
| Root/configuration contract              | PASS: 8 canonical Proprium keys                   |
| Controlled root and Compose failures     | PASS: 8 rejected fixtures                         |
| Environment-template ownership failures  | PASS: 6 rejected fixtures                         |
| GP-27 configuration architecture policy  | PASS: 157 production source files                 |
| GP-27 controlled architecture failures   | PASS: 5 rejected fixtures                         |
| Repository consistency                   | PASS: 7,152 tracked paths and 45 required files   |
| Repository validation fixtures           | PASS                                              |
| Secret safety                            | PASS                                              |
| CI workflow contract                     | PASS: 7 stable merge gates                        |
| Developer documentation contract         | PASS: 10 authoritative documents                  |
| Backend Release build without `.env`     | PASS: 7 projects, 0 warnings, 0 errors            |
| Frontend production build without `.env` | PASS: public validation, TypeScript, and 7 routes |
| Formatting, syntax, and diff checks      | PASS                                              |

The isolated worktree reused installed frontend dependencies through a temporary
junction and used Next's supported `--webpack` builder because Turbopack rejects
that out-of-root link. No tracked build configuration changed.

## Compose evidence

`docker compose -f docker-compose.proprium.yml config` passed without starting
services. Defaults resolved to PostgreSQL `55432`, Redis `6379`, API `8080`, web
`3000`, browser API URL `http://localhost:8080`, and allowed origin
`http://localhost:3000`.

An explicit override render also passed:

```text
POSTGRES_HOST_PORT=15432
REDIS_HOST_PORT=16379
API_PORT=18080
WEB_PORT=13000
NEXT_PUBLIC_API_BASE_URL=http://localhost:18080
AUTH_ALLOWED_ORIGIN=http://localhost:13000
```

The root `.env` path is ignored and untracked. No local value was read, printed,
created, or overwritten during qualification.

## Exit decision

GP-29 satisfies AC-29.1 through AC-29.10 through an explicit amendment of the
greenfield key proposal. Real orchestration consumers remain canonical; phantom
application metadata and component-internal endpoint aliases remain excluded.
GP-30 can proceed without revisiting root ownership or host-port semantics.
