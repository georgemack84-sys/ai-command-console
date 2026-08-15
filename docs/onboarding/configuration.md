# Configuration Guide

## Template ownership

| Template | Owner | Purpose |
| --- | --- | --- |
| `.env.example` (before the transitional marker) | Repository platform | Proprium local Compose infrastructure |
| `.env.example` (after the transitional marker) | Legacy command console | Existing root-application contract retained until migration |
| `apps/web/.env.example` | Web application | Browser-visible Next.js build configuration |
| `services/api/.env.example` | Platform API | ASP.NET Core hosting and API runtime configuration |

`services/api/.env.example` is the only backend template. The former `services/platform-api` mirror was removed because no application exists at that path.

## Local use

Create only the local file needed by the component being run:

```text
# POSIX shells
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp services/api/.env.example services/api/.env

# PowerShell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item services/api/.env.example services/api/.env
```

Docker Compose automatically reads the root `.env`. Next.js reads `apps/web/.env.local`. `services/api/.env` is the canonical developer-owned API counterpart and local inventory, but the API does not automatically load it; source it through approved tooling or supply the same values through the shell, IDE, container, or launch profile. A local file never overrides the documented provider model merely by existing.

All local `.env` files are ignored. Never commit them. Replace sensitive examples before using a non-local environment.

## Resolution and precedence

Later sources win.

| Component | Lowest to highest precedence |
| --- | --- |
| Proprium Compose | interpolation default → root `.env` → invoking process environment |
| Web build | `apps/web/.env.local` fills missing values → existing process environment |
| Platform API | safe code defaults → `appsettings.json` → optional `appsettings.{Environment}.json` → process environment → optional secret provider → approved non-secret command line |

The API explicitly clears ASP.NET Core's incidental application-provider set and adds only the documented sources in this order. It does not load `.env` files or Development User Secrets. Supply local values through the shell, IDE launch configuration, container environment, or CI environment. ASP.NET hierarchical overrides use double underscores, so `PLATFORM__NAME` overrides `Platform:Name`. API configuration is resolved once at startup and does not dynamically reload.

The reserved provider position after environment variables is currently empty in normal startup. The internal OpenAPI export command uses an in-memory test-only provider in that position; it is not a general developer override layer. A future deployment secret provider must use the same position and requires no consumer changes.

Command-line configuration is limited to `urls`, `POSTGRES_PORT`, `REDIS_PORT`, and `Logging:LogLevel:Default`. Operational commands such as `--migrate` and `--write-openapi` are parsed separately and never become configuration. Secret-shaped and unapproved configuration keys are rejected without logging their values. A stronger malformed override fails typed validation; the API never falls back to a weaker valid value.

The API supports `Development`, `Test`, `Staging`, and `Production` environment names case-insensitively. The web schema accepts their lowercase equivalents. Unknown names fail validation.

## Proprium inventory

### Repository platform

| Variable | Requirement | Sensitive | Type | Purpose |
| --- | --- | --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Optional; defaults to `proprium` | No | String | Local Compose project identity |
| `POSTGRES_DATABASE` | Optional; local default supplied | No | String | Database provisioned by Compose and selected by the API |
| `POSTGRES_USER` | Optional; local default supplied | No | String | Local PostgreSQL account |
| `POSTGRES_PASSWORD` | Optional; local default supplied | Yes | String | Local-only PostgreSQL credential |
| `POSTGRES_HOST_PORT` | Optional; defaults to `55432` | No | Port | PostgreSQL host binding |
| `REDIS_HOST_PORT` | Optional; defaults to `6379` | No | Port | Redis host binding |
| `API_PORT` | Optional; defaults to `8080` | No | Port | Platform API host binding and browser API URL |
| `WEB_PORT` | Optional; defaults to `3000` | No | Port | Web host binding and API allowed origin |

`POSTGRES_DATABASE`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` are intentionally shared with the API template: the repository provisions them and the API consumes them. Their owner remains repository infrastructure for Compose and API runtime configuration for direct execution. `API_PORT` and `WEB_PORT` are host-facing orchestration values; they do not replace container-internal listening configuration or become general application settings.

### Web application

Every web value is required at build time, non-sensitive, and publicly observable.

| Variable | Type | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Non-empty string | Product display name |
| `NEXT_PUBLIC_APP_VERSION` | Non-empty string | Displayed build version |
| `NEXT_PUBLIC_API_BASE_URL` | Absolute URL | Browser API endpoint |
| `NEXT_PUBLIC_ENVIRONMENT` | Enum | `development`, `test`, `staging`, or `production` |

Changing a `NEXT_PUBLIC_*` value requires rebuilding the frontend. Public variables must never contain passwords, tokens, keys, credentials, or private connection strings.

### Platform API

| Variable | Requirement | Sensitive | Type | Purpose/default |
| --- | --- | --- | --- | --- |
| `ASPNETCORE_ENVIRONMENT` | Optional | No | String | ASP.NET Core environment; example selects Development |
| `ASPNETCORE_URLS` | Optional | No | URL list | Hosting addresses; container uses port 8080 |
| `PLATFORM__NAME` | Optional | No | String | Overrides `Platform:Name`; appsettings default is `Proprium` |
| `PLATFORM__VERSION` | Optional | No | String | Overrides `Platform:Version`; appsettings default is `0.1.0` |
| `POSTGRES_HOST` | Required at startup | No | Hostname | PostgreSQL endpoint |
| `POSTGRES_PORT` | Required at startup | No | Port | PostgreSQL endpoint port |
| `POSTGRES_DATABASE` | Required at startup | No | String | PostgreSQL database |
| `POSTGRES_USER` | Required at startup | No | String | PostgreSQL account |
| `POSTGRES_PASSWORD` | Required at startup | Yes | String | PostgreSQL credential |
| `REDIS_HOST` | Required at startup | No | Hostname | Redis endpoint |
| `REDIS_PORT` | Required at startup | No | Port | Redis endpoint port |
| `REDIS_PASSWORD` | Optional | Yes | String | Redis credential when authentication is enabled |
| `SESSION_TOKEN_DIGEST_KEY` | Required at startup | Yes | Base64 | At least 32 decoded bytes for token digests |
| `SESSION_LIFETIME_MINUTES` | Required at startup | No | Integer | Session lifetime from 5 to 43,200 minutes |
| `AUTH_ALLOWED_ORIGIN` | Required at startup | No | HTTP(S) origin | Exact browser origin allowed for credentialed requests |
| `LOGIN_RATE_LIMIT_PRIVACY_KEY` | Required at startup | Yes | Base64 | At least 32 decoded bytes for privacy-preserving identifiers |
| `LOGIN_RATE_LIMIT_SOURCE` | Optional; defaults to `10` | No | Integer | Locked per-source limit |
| `LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE` | Optional; defaults to `5` | No | Integer | Locked identifier/source limit |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES` | Optional; defaults to `5` | No | Integer | Locked rate-limit window |
| `LOGIN_RATE_LIMIT_FALLBACK_CAPACITY` | Optional; defaults to `10000` | No | Integer | In-memory fallback capacity |
| `LOCAL_ADMIN_ENABLED` | Optional; defaults to `false` | No | Boolean | Enables Development-only administrator bootstrap during migration |
| `LOCAL_ADMIN_USERNAME` | Required when local admin is enabled | No | String | Development bootstrap username |
| `LOCAL_ADMIN_PASSWORD` | Required when local admin is enabled | Yes | String | Development bootstrap password |

## Secret boundary

Template values are non-production examples. Real values come from ignored local files, process configuration, CI secrets, or a future approved secret provider. Do not log secrets, put them in OpenAPI, pass them on command lines, embed them in frontend variables, or bake them into images. Treat a committed real secret as permanently compromised.

The [GP-04 secret-safety policy](../engineering/gp-04-secret-safety.md) defines current secret owners, allowed and prohibited locations, exact fixture exceptions, mechanical checks, and the revoke/rotate response required for any exposure.

## Validation

Run `npm run validate:configuration` from the repository root. It verifies exact frontend and backend inventories, the root Proprium section, template tracking and ignore behavior, syntax, duplicate ownership, consumer correspondence, public-variable safety, approved sensitive examples, and the absence of tracked local environment files. It requires no Docker, PostgreSQL, Redis, local `.env` file, or credential.

At runtime, the web validates its public values before building. The API resolves a typed startup snapshot before service registration and rejects missing or empty required values, malformed types, invalid ranges and origins, invalid key encodings, unknown environments, and invalid conditional local-administrator configuration. Diagnostics identify the setting and expected form without including the supplied value. See the [GP-32 precedence specification](../engineering/gp-32-configuration-sources-and-precedence.md) for the frozen provider and ownership model.
