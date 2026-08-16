# GP-30 Frontend Environment Configuration

**Status:** Implemented

## Outcome

Proprium has one browser-public configuration path: approved `NEXT_PUBLIC_*`
build inputs are parsed by `apps/web/src/config/environment.ts`, validated by a
strict Zod schema, frozen, and then consumed as typed configuration. Production
build validation runs before Next.js compilation and requires no API, database,
Redis instance, or Docker daemon.

## Public contract

| Key                        | Purpose                                   | Validation                                                                                       |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_NAME`     | Human-facing product name                 | Required, trimmed, non-empty                                                                     |
| `NEXT_PUBLIC_APP_VERSION`  | Build-injected display/release identifier | Required, trimmed, display-safe identifier                                                       |
| `NEXT_PUBLIC_API_BASE_URL` | Browser-visible Platform API location     | Required absolute HTTP(S) URL; no credentials, query, or fragment; one trailing slash is removed |
| `NEXT_PUBLIC_ENVIRONMENT`  | Approved client behavior profile          | `development`, `test`, `staging`, or `production`                                                |

The first three keys are the GP-30 initial catalog. `NEXT_PUBLIC_ENVIRONMENT` is
an existing approved key retained from GP-02 and GP-03 because session-cookie
behavior consumes it. All four values are public by design and may be present in
generated browser assets.

`NEXT_PUBLIC_APP_VERSION` is `BUILD_INJECTED`. The matching `0.1.0` in the web
package and templates is not dynamically derived: package metadata describes the
package, while each build supplies its display/release identifier. This permits
CI labels such as `0.1.0-test` without claiming a repository-wide Semantic
Versioning policy.

## Ownership and precedence

- `apps/web/.env.example` is the canonical frontend contract.
- An ignored `apps/web/.env.local` is the developer-owned local source.
- Existing process values win over `.env.local` during prebuild validation.
- `.env.docker` and `.env.test` are explicit harness inputs, not implicit local
  precedence sources.
- Root `API_PORT` and `NEXT_PUBLIC_API_BASE_URL` are related but independently
  owned orchestration and browser concepts.

Changing a public value after a build does not rewrite generated browser assets.
Proprium therefore keeps the build-per-environment decision in ADR-0002.

## Safety and enforcement

Passwords, privileged tokens, signing keys, private certificates, credential-
bearing connection strings, and API secrets never belong in `NEXT_PUBLIC_*`.
The repository configuration validator rejects undeclared and secret-like public
template keys and credential-like examples without printing their values. The
strict runtime schema rejects undeclared inputs, unsafe URL structures, and
missing or malformed required values. Validation diagnostics name only relevant
keys and expectations.

ESLint confines application `process.env` access to the environment bootstrap
module (with a test-setup exception). Dependency rules keep configuration at the
bottom of the frontend graph and prevent browser layers from importing future
server-only configuration. Tooling-level environment reads in Playwright,
Storybook, and scripts are classified as framework/test bootstrap boundaries,
not application configuration consumers.

## Adding configuration

Before adding a public value, confirm that disclosure in browser source, logs,
screenshots, and support exports is harmless. Then update the canonical template,
schema, explicit bootstrap read, typed consumer, Docker build inputs where
needed, repository inventory, tests, and this catalog in the same change. Never
add aliases for an existing concept.

Server-only values belong in a future `src/config/server` boundary only when a
real server-side consumer exists. They must not use `NEXT_PUBLIC_*` or be imported
by client-capable modules.

## Audit classification

- Central schema, bootstrap module, typed consumers, template, Docker build
  arguments, and build-time semantics: **KEEP / STRENGTHENED**.
- Direct reads in Playwright, Storybook, and scripts: **KEEP** as explicit
  framework/test boundaries.
- Hard-coded live-auth fallback: **KEEP** as opt-in test harness configuration;
  production API requests use the validated base URL.
- Public secrets, scattered application reads, and hard-coded production API
  endpoints: **NONE FOUND**.
