# GP-31 Backend Typed Configuration

**Status:** Implemented

## Outcome

The Platform API has one typed startup configuration path. ASP.NET Core providers
feed `ApiConfiguration.Resolve`, which maps canonical keys, validates and parses
them without connectivity, creates an immutable `ApiConfigurationSnapshot`, and
registers narrow `IOptions<T>` values before the service provider is built.

The roadmap's `services/platform-api` and `APP_*` examples were greenfield
assumptions. The repository's real owner is `services/api`. GP-02 removed unused
`APP_*` aliases and adopted `PLATFORM__NAME` and `PLATFORM__VERSION`, which map
natively to `Platform:Name` and `Platform:Version`. `ASPNETCORE_ENVIRONMENT`
remains the single operational environment authority; it is not duplicated in
application metadata.

## Typed ownership and mapping

| Concern             | External keys                                                                               | Typed owner                    | Consumer                        |
| ------------------- | ------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------- |
| Framework host      | `ASPNETCORE_ENVIRONMENT`, `ASPNETCORE_URLS`                                                 | ASP.NET Core host              | Framework bootstrap             |
| Platform metadata   | `PLATFORM__NAME`, `PLATFORM__VERSION`                                                       | `PlatformOptions`              | Platform endpoint               |
| PostgreSQL          | `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `PostgresOptions`              | EF Core registration            |
| Redis               | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`                                                | `RedisOptions`                 | Redis registration              |
| Sessions            | `SESSION_TOKEN_DIGEST_KEY`, `SESSION_LIFETIME_MINUTES`                                      | `SessionOptions`               | Session infrastructure          |
| Authentication      | `AUTH_ALLOWED_ORIGIN`                                                                       | `AuthenticationRequestOptions` | API request policy              |
| Login throttling    | `LOGIN_RATE_LIMIT_*`                                                                        | `LoginRateLimitOptions`        | Rate-limit infrastructure       |
| Local administrator | `LOCAL_ADMIN_*`                                                                             | `LocalAdministratorOptions`    | Development migration bootstrap |

The canonical template is `services/api/.env.example`. Direct host execution
uses `localhost` and host-published PostgreSQL port `55432`; root Compose uses
service DNS names and container ports. This difference is intentional.

## Binding and validation

The API uses explicit mapping because canonical flat infrastructure names such
as `POSTGRES_HOST` do not match ASP.NET Core section-binding conventions. The
platform metadata keys use the framework's double-underscore mapping. Required
strings reject missing, empty, and whitespace-only values. Integers parse with
invariant culture and enforce documented ranges. Supported environments,
origins, booleans, base64 key material, locked rate-limit values, and conditional
local-administrator rules are validated deterministically.

This resolver is the repository-approved equivalent of options binding plus
`ValidateOnStart`: it completes before container construction and fails normal
startup immediately. GP-33 may expand cross-model compatibility diagnostics but
must not weaken this behavior.

## Consumption and secret safety

`IConfiguration` is confined to `Proprium.Api.Configuration` and composition
bootstrap. Domain, application, and ordinary infrastructure types receive typed
values or behavioral abstractions. Configuration is static for the process
lifetime; no snapshot/monitor reload mechanism is enabled.

PostgreSQL connection strings are built with `NpgsqlConnectionStringBuilder`,
and Redis configuration is built with `ConfigurationOptions`. This preserves
special characters without manual credential concatenation. Options and the
aggregate snapshot redact secret-bearing fields from string representations.
Validation exceptions report only the canonical key and safe expectation.

Binding and registration do not open database/cache connections, run migrations,
or probe infrastructure. Connectivity belongs to runtime client creation and
health checks; restore, build, unit tests, architecture tests, and OpenAPI export
remain infrastructure-independent.

## Enforcement and extension

Repository source policy rejects `Environment.GetEnvironmentVariable` and broad
`IConfiguration` outside the API bootstrap boundary. Backend architecture tests
also prohibit configuration/options framework dependencies in Domain and
Application. Focused tests cover canonical typed mapping, malformed and
out-of-range ports, required strings, optional Redis passwords, provider-native
connection construction, precedence, and secret-safe diagnostics.

To add a backend value, identify one owning concern, classify it as public or
secret, choose a stable canonical key, add its typed property and explicit
mapping, define validation/default semantics, update the canonical template and
deployment inputs, and add success/failure tests plus documentation. Introduce a
new options model only for a cohesive subsystem. Never add a string lookup to
business logic or a compatibility alias without a documented migration and
removal point.
