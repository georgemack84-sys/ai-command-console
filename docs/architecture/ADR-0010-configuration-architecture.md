# ADR-0010: Configuration Architecture

- Status: Accepted
- Date: 2026-08-15
- Decision owner: Repository Platform
- Applies to: `apps/web`, `services/api`, repository tooling, CI, and deployment configuration

## Context

Configuration is an explicit runtime dependency, not ambient workstation state. A configuration value is any externally supplied value that changes application identity, dependency locations, runtime behavior, or access to a protected resource. Every published value must have a stable name, owner, purpose, type, format, required/optional status, default behavior, public/secret classification, applicable environments, and validation rule.

The repository already has concrete frontend and API configuration mechanisms. This decision names their shared contract without changing precedence or inventing the GP-28 through GP-36 implementation details.

## Configuration flow

Every executable follows one pipeline:

```text
approved source -> bootstrap -> typed binding -> validation -> approved object -> narrow consumer
```

Application code consumes only the approved object. Repeating string parsing, provider lookup, or environment access in business logic bypasses the pipeline and is prohibited.

Configuration categories are application identity, infrastructure, behavior, secret, and browser-public configuration. Classification does not grant ownership: every value still belongs to the component that understands and maintains it.

## Bootstrap boundaries

| Executable            | Approved raw-input boundary                                             | Approved output                                                                    |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Platform API          | `services/api/Proprium.Api/Program.cs` and `Proprium.Api/Configuration` | Validated immutable startup snapshot and narrow `IOptions<T>` registrations        |
| Web application       | `apps/web/src/config/environment.ts` plus `environment-schema.ts`       | Frozen `PublicEnvironment`; derived values may be exposed through `application.ts` |
| Repository/CI tooling | The owning script entry point                                           | A command-local typed/validated value; never an application service locator        |

`Program.cs` composes ASP.NET Core providers. `ApiConfiguration.Resolve` is the only application bootstrap reader and must complete before the service provider is built. Infrastructure and application consumers receive their owned typed options. They do not receive `IConfiguration`.

The web adapter performs explicit `NEXT_PUBLIC_*` reads so Next.js can inline them, validates the complete object, and freezes the result. Browser code has no secret configuration. A future server-only frontend adapter must live at `src/config/server.ts` or `src/config/server/`, import Next's `server-only` marker, validate independently, and remain unreachable from client-capable modules.

Test setup, integration orchestration, migration/export commands, and build tooling are bootstrap infrastructure, not normal application consumers. Any direct provider access there must be local to the command, value-safe, documented in the GP-27 audit, and must not be re-exported as a general configuration API.

## Typed binding and startup validation

External text becomes an appropriate application type once, at bootstrap. Required values are validated before normal execution. Validation covers absence, whitespace, type, format, range, enumeration, incompatible combinations, and prohibited operational values as applicable.

Invalid required configuration prevents successful startup. Diagnostics identify the key and safe expectation without echoing the value. Secret-bearing configuration objects redact string representations. Optional defaults are permitted only when the default is safe, documented, and semantically optional; credentials and required endpoints never receive concealing defaults.

The current API resolver is an approved equivalent to `AddOptions<T>().Bind(...).Validate(...).ValidateOnStart()`: it produces typed options before container construction and fails immediately. GP-31 and GP-33 may converge the implementation on framework binding, but may not weaken this behavior.

## Least exposure and ownership

| Owner                  | May understand                                            | Must not receive by default                         |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| Repository Platform    | Template ownership, local Compose inputs, CI contracts    | Runtime secret contents                             |
| Web application        | Validated browser-public identity and API endpoint values | Credentials, signing material, private endpoints    |
| Platform API bootstrap | Provider composition, binding, validation, registration   | Business decisions                                  |
| API subsystem consumer | Its narrow typed options                                  | Broad `IConfiguration`, unrelated subsystem options |
| Deployment Platform    | Runtime secret injection and provider policy              | Authority to expose secrets to browser code         |

Options align with ownership (`PlatformOptions`, `PostgresOptions`, `RedisOptions`, `SessionOptions`, and similarly narrow future models). A global settings bag or configuration service locator is not an approved dependency.

## Public and secret classification

Every value is classified `PUBLIC` or `SECRET`. `PUBLIC` means safe to disclose, not globally relevant. Every `NEXT_PUBLIC_*` value is public and observable in the delivered browser bundle. A secret may originate only from ignored local configuration, process configuration supplied by an approved runtime, CI secrets, or a future external secret provider.

Tracked templates contain names and non-secret placeholders only. Real passwords, tokens, private keys, signing keys, certificate material, and secret connection-string components never belong in source, tracked settings, documentation, Docker build arguments/layers, OpenAPI, logs, or browser configuration. Consumers depend on typed values, so replacing local environment injection with Docker Secrets, a vault, or another provider does not redesign business code.

## Build-time and runtime separation

Restore, static analysis, architecture tests, type checking, and backend compilation require no runtime configuration, PostgreSQL, Redis, container, migration, health check, external API, or real secret. A frontend production bundle may require its explicitly documented public build inputs; that does not authorize infrastructure access or secret inputs during compilation.

Runtime startup may bind and validate configuration, then initialize dependencies. Migrations, health probes, OpenAPI export, and integration tests are explicit commands rather than compilation side effects.

Given the same build, ordered sources, and values, effective configuration and validation outcomes must be identical. Developer identity, shell aliases, registry state, IDE settings, undocumented files, global tooling, prior processes, and implicit service discovery may not change required behavior.

## Prohibited patterns

- `Environment.GetEnvironmentVariable`, `process.env`, or equivalent reads outside an approved bootstrap or test/tooling boundary.
- `IConfiguration`, arbitrary string dictionaries, or generic resolvers used as service locators in domain, application, or ordinary infrastructure code.
- Repeated parsing of raw strings by consumers, silent required defaults, or partially initialized required configuration.
- Secret values in tracked files, command lines, images, diagnostics, telemetry, OpenAPI, or browser-delivered code.
- A single global configuration object supplied to unrelated components.
- Compilation that connects to infrastructure, starts services, migrates data, calls APIs, or requires runtime credentials.
- Required behavior influenced by undocumented workstation state.

An exception requires an owner, exact location, narrow rationale, data classification, compensating enforcement, and review/removal condition. Convenience alone is not a justification.

## Enforcement and roadmap continuity

`npm run validate:configuration-architecture` scans production API and web source, rejects raw access and broad backend configuration outside the approved boundaries, verifies validation occurs before consumption, checks controlled negative fixtures, and verifies this decision's required sections. Existing frontend ESLint/dependency rules, backend architecture tests, template validation, secret scanning, and repository validation provide complementary enforcement.

GP-28 through GP-36 own template structure, inventory, frontend and backend concrete models, precedence, complete startup validation, build independence, secret-provider controls, and the full configuration test suite. They may strengthen mechanics but must preserve this flow, ownership, classification, least-exposure, determinism, and provider-independent consumer contract. A conflict requires an explicit ADR amendment.

Operational precedence and current inventory remain defined by the [configuration guide](../onboarding/configuration.md). Secret handling remains governed by [GP-04 secret safety](../engineering/gp-04-secret-safety.md).
