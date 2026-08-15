# GP-34 Build-Time Infrastructure Independence Validation

**Date:** 2026-08-15
**Result:** PASS

## Review findings

- Backend CI already restored and built the complete solution without service
  containers, so application, unit, architecture, and integration projects were
  compile-independent.
- PostgreSQL and Redis registrations were deferred; health, migration, and
  integration connectivity was confined to explicit runtime execution.
- OpenAPI generation supplied synthetic configuration but called `StartAsync`,
  unnecessarily opening a loopback listener and activating the host lifecycle.
- The EF factory performed no connection but used a local-development-looking
  connection string rather than an unmistakable metadata-only endpoint.
- CI separated backend build and integration execution, but dependency direction
  was not encoded between those jobs.

## Implemented evidence

- OpenAPI captures mapped endpoint metadata without starting or stopping the
  host. Its synthetic PostgreSQL and Redis names use `.invalid`, and generation
  fails if listener/runtime lifecycle output is detected.
- The EF design-time factory uses a non-routable synthetic host. A unit test
  constructs the complete model and proves the Npgsql connection remains closed.
- A composition test registers infrastructure and builds the service provider
  without supplying configuration or activating client factories.
- Integration CI now depends on the infrastructure-free backend gate and still
  compiles its project before starting dependencies and applying migrations.
- A source/CI policy and seven controlled failures enforce the boundary.

## No-infrastructure qualification matrix

| Operation                           | PostgreSQL | Redis | Docker | Running API |               Local `.env` |
| ----------------------------------- | ---------: | ----: | -----: | ----------: | -------------------------: |
| Backend Release solution build      |         No |    No |     No |          No |                         No |
| Backend unit tests                  |         No |    No |     No |          No |                         No |
| Backend architecture tests          |         No |    No |     No |          No |                         No |
| Integration project compilation     |         No |    No |     No |          No |                         No |
| OpenAPI generation                  |         No |    No |     No |          No |                         No |
| Frontend production build           |         No |    No |     No |          No | No; explicit public values |
| Repository/documentation validation |         No |    No |     No |          No |                         No |

## Qualification result

| Verification | Result |
| --- | --- |
| Clean-room Release solution build | PASS — 7 projects; zero warnings and zero errors |
| Explicit integration-project build | PASS — no infrastructure or runtime variables |
| Backend unit tests | PASS — 94 tests |
| Backend architecture tests | PASS — 20 tests |
| Backend compiler/analyzer and formatting policy | PASS |
| Backend test classification | PASS — 5 reflection checks |
| GP-34 source/CI policy and fixtures | PASS — 7 controlled failures rejected |
| Canonical aggregate backend validation | PASS — all 7 steps |
| Frontend production build | PASS — `.invalid` API URL; compiled, type-checked, and prerendered |
| OpenAPI metadata generation | PASS — no listener, runtime lifecycle output, or repository artifact |
| Repository/configuration validation | PASS — 7,166 tracked paths; 159 production source files |
| Developer documentation contract | PASS — 10 authoritative documents |
| Repository command tests | PASS — 24 tests |
| CI workflow contract | PASS — 7 stable merge gates |

The clean-room backend build ran after confirming `.env`,
`apps/web/.env.local`, and `services/api/.env` were absent and removing canonical
runtime variables from the child process. The frontend used only the four public
GP-30 values, with `NEXT_PUBLIC_API_BASE_URL` set to
`https://api.build-time.invalid`. OpenAPI used non-routable synthetic PostgreSQL
and Redis hosts.

No PostgreSQL, Redis, Docker daemon, running API, real credential, or external
runtime endpoint participated in qualification. Dependency restore used the
normal package-manager boundary and is not runtime infrastructure.
