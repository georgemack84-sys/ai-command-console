# Proprium frontend

Restore with `npm ci`. For direct component development, copy `.env.example` to
the ignored `.env.local`, then use `npm run dev`. The supported complete platform
startup remains `npm run repo -- dev` from the repository root. Public
configuration is validated before production builds. `.env.docker` supplies Docker
Compose build interpolation only:

```bash
docker compose -f docker-compose.proprium.yml --env-file ./apps/web/.env.docker build web
```

Changing a `NEXT_PUBLIC_*` value requires rebuilding the image; it is not runtime configuration.

Application code reads public configuration through `src/config/environment.ts`.
That module validates and freezes the complete browser-visible contract; direct
`process.env` access elsewhere under `src` is rejected by ESLint. The API base URL
must be an absolute HTTP(S) URL without credentials, query parameters, or a
fragment. `NEXT_PUBLIC_APP_VERSION` is a build-injected display identifier; the
package version remains package metadata, and release automation must supply the
intended application version explicitly. See the [GP-30 configuration contract](../../docs/engineering/gp-30-frontend-environment-configuration.md)
for ownership, validation, and extension guidance.

Run `npm run format` to apply the repository-owned frontend formatting policy and `npm run format:check` to verify it without changing files. `npm run format:verify` exercises the formatter contract with temporary fixtures. Editor format-on-save is optional; these commands and the locked dependency are authoritative. Run `npm run validate` for the complete local quality gates.

Run `npm run lint` for zero-warning ESLint validation and `npm run typecheck` for strict, non-emitting TypeScript validation. `npm run static-analysis:verify` proves representative unused-code, import-order, hook, debugger, explicit-`any`, floating-promise, and type-error failures with disposable fixtures. `npm run lint:fix` is an optional local remediation command; canonical validation never modifies source.

Run `npm run deadcode` for non-mutating unused-file and unused-export
validation. `npm run deadcode:verify` proves both failure modes with disposable
fixtures. A leading underscore exempts only an intentionally unused function
parameter or caught error from ESLint; it does not exempt ordinary variables.
Stable, intentionally unconsumed TypeScript API exports require a focused
`@public` annotation and documentation. The [GP-07 architecture
specification](../../docs/engineering/gp-07-frontend-architecture.md) owns the
entry-point and exception policy.

Run `npm run architecture` for the complete frontend dependency contract: production graph validation, allowed-direction fixtures, and isolated prohibited-direction fixtures. The [GP-07 architecture specification](../../docs/engineering/gp-07-frontend-architecture.md) documents the actual layers, dependency matrix, feature public API policy, configuration boundary, and exception policy. The command uses the locked local dependency-cruiser installation and requires no running infrastructure or secrets.
