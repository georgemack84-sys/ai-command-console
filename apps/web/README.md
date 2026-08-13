# Proprium frontend

Run locally with `npm install`, copy `.env.example` to `.env.local`, then use `npm run dev`. Public configuration is validated before production builds. `.env.docker` supplies Docker Compose build interpolation only:

```bash
docker compose --env-file ./apps/web/.env.docker build web
```

Changing a `NEXT_PUBLIC_*` value requires rebuilding the image; it is not runtime configuration.

Run `npm run format` to apply the repository-owned frontend formatting policy and `npm run format:check` to verify it without changing files. `npm run format:verify` exercises the formatter contract with temporary fixtures. Editor format-on-save is optional; these commands and the locked dependency are authoritative. Run `npm run validate` for the complete local quality gates.

Run `npm run lint` for zero-warning ESLint validation and `npm run typecheck` for strict, non-emitting TypeScript validation. `npm run static-analysis:verify` proves representative unused-code, import-order, hook, debugger, explicit-`any`, floating-promise, and type-error failures with disposable fixtures. `npm run lint:fix` is an optional local remediation command; canonical validation never modifies source.
