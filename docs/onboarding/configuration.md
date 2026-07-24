# Configuration Guide

## Ownership and templates

| Template | Owner | Scope |
| --- | --- | --- |
| `.env.example` | Repository Platform | Shared local infrastructure values |
| `apps/web/.env.example` | Frontend | Browser-safe build configuration only |
| `services/platform-api/.env.example` | Platform API | Canonical backend runtime template |
| `services/api/.env.example` | Platform API | Compatibility mirror for the current `Proprium.Api` source location |

Create local files from the templates: `.env`, `apps/web/.env.local`, and `services/platform-api/.env` (or `services/api/.env` while the backend remains at that path). Local files are ignored by Git and must never be committed.

## Precedence

Configuration is resolved in this order, with later sources taking precedence: application defaults, environment-specific settings, environment variables, a future secret-provider layer, then approved command-line overrides. Defaults and environment-specific settings may not contain secrets. Command-line overrides must not carry secrets.

The frontend uses only `NEXT_PUBLIC_*` values. They are embedded at build time and must not contain passwords, tokens, keys, credentials, or private connection strings. Backend code consumes typed options; direct environment access belongs only at configuration bootstrap.

## Secret boundary

Template values are development-only placeholders. `POSTGRES_PASSWORD=change-me` is deliberately non-production. Real values originate from local ignored files, CI secrets, or a future approved secret provider. Do not log secrets, put them in OpenAPI, pass them on command lines, or embed them in Docker images. Treat a committed secret as permanently compromised.

## Validation

Run `npm run validate:configuration` from the repository root. The command checks required templates and keys, malformed or duplicate lines, browser-safe frontend variables, placeholder safety, backend mirror drift, and Git ignore rules. It does not require Docker, PostgreSQL, Redis, local environment files, or credentials.
