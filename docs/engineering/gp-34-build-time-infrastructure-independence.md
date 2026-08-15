# GP-34 Build-Time Infrastructure Independence

**Status:** Implemented

## Outcome

Proprium's restore, compile, static-analysis, unit-test, architecture-test,
integration-project compilation, and OpenAPI metadata paths do not require
PostgreSQL, Redis, Docker, a running API, local environment files, or production
credentials. Runtime infrastructure becomes mandatory only in commands that
explicitly activate or inspect it.

The frontend remains a build-time exception only for its four public GP-30
values. CI supplies safe syntactically valid values; the build does not contact
the configured API.

## Audited boundaries

| Finding                                    | Classification     | Boundary                                                                                                                           |
| ------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `AddDbContext` registration                | `BUILD_SAFE`       | Provider options are evaluated when the context is resolved, not during registration or container construction                     |
| Redis multiplexer registration             | `BUILD_SAFE`       | `ConnectionMultiplexer.Connect` is inside the singleton factory and is not invoked by registration or container construction       |
| PostgreSQL/Redis readiness checks          | `RUNTIME_ONLY`     | Connectivity occurs only when the readiness check executes                                                                         |
| `--migrate` database migration and seeding | `RUNTIME_ONLY`     | Explicit operational branch after application construction; normal startup and tooling do not invoke it                            |
| Integration fixtures and API clients       | `INTEGRATION_ONLY` | Classified tests compile with the solution and activate infrastructure only during integration execution                           |
| EF design-time factory                     | `BUILD_SAFE`       | Uses a `.invalid` synthetic host, constructs metadata with a closed connection, and performs no migration or reachability check    |
| OpenAPI export                             | `BUILD_SAFE`       | Captures mapped endpoint data sources and generates Swagger from the service graph without starting the host or binding a listener |
| `--health-probe` HTTP request              | `RUNTIME_ONLY`     | Runs only when the explicit health command is requested                                                                            |
| Docker Compose commands                    | `RUNTIME_ONLY`     | Confined to Docker validation, migration, development, health, integration, and reset commands                                     |

No static constructor or module initializer activates runtime infrastructure.
Configuration validation remains structural: it parses and checks relationships
but performs no DNS, database, Redis, HTTP, migration, or health operation.

## OpenAPI metadata mode

OpenAPI export still executes full GP-33 structural configuration validation.
`OpenApiToolingConfiguration` supplies stronger, synthetic metadata-only values
whose PostgreSQL and Redis hosts use the reserved `.invalid` top-level domain.
If either client is accidentally resolved, generation fails rather than reaching
a developer or production service.

ASP.NET normally makes minimal endpoint metadata available when the host starts.
The tooling-only endpoint data source captures the already mapped route metadata
and exposes it to the API explorer directly. Generation therefore does not call
`StartAsync`, `Run`, migrations, health checks, or any listener API. The generator
also rejects lifecycle output such as `Now listening on` as a controlled failure.
Its temporary profile and working directory contain .NET/NuGet state and are
removed afterward, so generation leaves no repository-local tooling sentinel.

This is not a runtime validation bypass: normal startup still requires the full
effective configuration, and the tooling values exist only behind the explicit
`--write-openapi` operation.

## EF design-time boundary

`PropriumDbContextFactory` is metadata-only. Its connection string uses
`postgres.design-time.invalid`, synthetic credentials, and a one-second timeout
as defense in depth. Constructing the context and reading its EF model leaves the
Npgsql connection closed. Migration execution remains owned by the explicit
Compose `database-migrations` service.

## Command dependency matrix

| Command or operation                               | Infrastructure requirement                                           |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run repo -- format check`                     | None                                                                 |
| `npm run repo -- validate`                         | None                                                                 |
| `npm run repo -- build backend`                    | None; compiles every application and test project                    |
| `npm run repo -- build frontend`                   | Public `NEXT_PUBLIC_*` values only; no reachable API                 |
| `npm run repo -- test`                             | None; unit and architecture suites only                              |
| `dotnet build ...Proprium.IntegrationTests.csproj` | None                                                                 |
| `npm run repo -- validate openapi`                 | Prior API build only; no runtime service                             |
| `npm run repo -- validate docker`                  | Docker daemon; image/configuration validation only                   |
| `npm run repo -- migrate`                          | Docker, PostgreSQL, and Redis through explicit Compose orchestration |
| `npm run backend:test:integration`                 | Prepared PostgreSQL and Redis plus runtime configuration             |
| `npm run repo -- dev`                              | Docker and the full local stack                                      |
| `npm run repo -- health`                           | Running application stack                                            |

Dependency restore may contact the normal npm and NuGet package registries. Those
package sources are not Proprium runtime infrastructure.

## Mechanical enforcement

`validate:build-time-independence` checks the composition, GP-33 validator, EF
factory, OpenAPI tool, repository command graph, production initializers, and CI
workflow. Controlled fixtures prove that it rejects host startup during OpenAPI,
connectivity in configuration, live-looking EF settings, Docker in OpenAPI,
production module initializers, services in build CI, and integration jobs that
do not depend on the service-free backend gate.

Backend CI restores and builds the full solution without service containers.
This compiles the integration project before the separate integration job starts
Compose. The integration job depends on successful backend validation, preserving
the direction from artifact qualification to infrastructure-dependent execution.
