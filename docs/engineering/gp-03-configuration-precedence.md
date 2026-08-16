# GP-03 Configuration Model and Precedence

**Status:** Implemented

## Outcome

GP-03 freezes how each Proprium component resolves configuration, validates the resolved startup snapshot, and reports invalid settings without printing their values. It builds on the GP-02 inventory without adding production secret delivery or automatic backend `.env` loading.

## Review findings

- The frontend already had one explicit `process.env` boundary, a strict schema, build-time validation, and an ESLint restriction. GP-03 qualifies and tests that design rather than creating speculative server/public modules.
- The API initially used ASP.NET Core's default providers and typed options, but parsing, defaults, and registration were embedded in `Program.cs`. GP-03 moved parsing into one resolvable boundary; GP-32 later made provider composition explicit and allowlisted command-line configuration.
- The API had no backend `.env` loader. Adding one would create a new source and premature precedence behavior, so local API values remain process/IDE/container inputs.
- Integration tests intentionally read process environment at their infrastructure boundary. Unit and architecture tests use explicit in-memory inputs and do not consume developer `.env` files.

## Canonical precedence

Later sources win.

### Repository Compose interpolation

1. defaults written in `docker-compose.proprium.yml`;
2. values from the ignored root `.env` automatically read by Compose;
3. variables already present in the invoking process environment.

### Web build configuration

1. required values filled from ignored `apps/web/.env.local` by the repository prebuild validator;
2. values already present in the build process environment.

Process values are never overwritten by `.env.local`. `.env.example`, `.env.docker`, and `.env.test` are contracts or explicit harness inputs, not automatic precedence layers. There are no frontend configuration defaults.

### Platform API

1. code defaults for explicitly optional values only;
2. tracked `appsettings.json`;
3. optional tracked `appsettings.{Environment}.json`;
4. process environment variables, using `__` for hierarchical keys;
5. an optional deployment-owned secret provider;
6. allowlisted non-secret command-line configuration.

Normal startup has no configured secret provider. The OpenAPI export harness uses a deterministic in-memory test provider in the reserved fifth position. Development User Secrets and backend `.env` files are not loaded. Command-line configuration is restricted to documented operational keys; secret-shaped or unapproved keys fail policy validation before builder creation.

The API resolves these providers once into an immutable startup snapshot before service registration. Runtime reload is not supported. Lower sources override higher sources, and an invalid stronger value fails rather than falling back.

## Supported environments

The API accepts `Development`, `Test`, `Staging`, and `Production`, compared case-insensitively. Any other name fails configuration resolution. The web accepts the lowercase equivalents defined by its schema. Local-administrator bootstrap may be enabled only in API `Development`.

## Controlled boundaries

- `apps/web/src/config/environment.ts` is the sole application module allowed to read frontend process configuration.
- `ApiConfiguration.Resolve` is the sole API mapping/parsing boundary for Proprium application settings.
- Application services receive typed options; `Program.cs` consumes the resolved snapshot only for composition and migration orchestration.
- Integration-test environment reads are test infrastructure configuration, not production application access.

## Validation contract

The API rejects missing, empty, or whitespace-only required values; malformed booleans and integers; ports and numeric values outside their documented ranges; invalid allowed origins; invalid base64 key material; unlocked rate-limit thresholds; unknown environment names; and incomplete or non-Development local-administrator configuration.

Errors contain the setting name and safe expectation, never the supplied value. The frontend rejects missing, empty, whitespace-only, malformed, unsupported, and undeclared public configuration before its production build proceeds.

## Test and CI behavior

Unit and architecture tests supply configuration explicitly. Precedence tests build the same tracked/environment/command-line provider order without relying on developer files. CI supplies public frontend and API runtime/integration values through the process environment. No CI runner depends on a local `.env` file or machine-specific configuration.

## Deferred

GP-04 owns formal secret classification, secret storage/delivery, rotation, and broader redaction enforcement. Remote configuration, dynamic reload, feature-flag services, deployment-specific configuration, and CI workflow changes remain out of scope.
