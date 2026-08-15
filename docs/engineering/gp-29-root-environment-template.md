# GP-29 Root Environment Template

## Outcome

The Repository Platform owns an eight-key Proprium root contract for local Compose orchestration. `.env.example` is safe to copy, deterministic, value-safe, and mechanically validated. The ignored `.env` counterpart is optional when Compose defaults are sufficient and is never required for compilation.

## Canonical catalog

| Key                    | Purpose                                     | Format                         | Requirement                               | Secret | Template value/class                            | Environments            | Validation                             |
| ---------------------- | ------------------------------------------- | ------------------------------ | ----------------------------------------- | ------ | ----------------------------------------------- | ----------------------- | -------------------------------------- |
| `COMPOSE_PROJECT_NAME` | Isolate the local Compose project           | Non-empty Compose project name | Optional; Compose defaults it             | No     | `proprium` / `SAFE_DEFAULT`                     | Local, CI orchestration | Non-empty, portable text               |
| `POSTGRES_DATABASE`    | Provision/select the local database         | Non-empty identifier           | Optional; Compose defaults it             | No     | `proprium` / `LOCAL_DEVELOPMENT_VALUE`          | Local, CI orchestration | Non-empty                              |
| `POSTGRES_USER`        | Provision the local database account        | Non-empty identifier           | Optional; Compose defaults it             | No     | `proprium` / `LOCAL_DEVELOPMENT_VALUE`          | Local, CI orchestration | Non-empty                              |
| `POSTGRES_PASSWORD`    | Authenticate local PostgreSQL               | String                         | Optional input; required by the container | Yes    | `local-development-only` / `PLACEHOLDER_SECRET` | Local, disposable CI    | Exact approved placeholder in template |
| `POSTGRES_HOST_PORT`   | Publish PostgreSQL to the host              | Integer port                   | Optional; defaults to `55432`             | No     | `55432` / `LOCAL_DEVELOPMENT_VALUE`             | Local, CI orchestration | Integer `1..65535`                     |
| `REDIS_HOST_PORT`      | Publish Redis to the host                   | Integer port                   | Optional; defaults to `6379`              | No     | `6379` / `LOCAL_DEVELOPMENT_VALUE`              | Local, CI orchestration | Integer `1..65535`                     |
| `API_PORT`             | Publish API and form the browser API URL    | Integer port                   | Optional; defaults to `8080`              | No     | `8080` / `LOCAL_DEVELOPMENT_VALUE`              | Local, CI orchestration | Integer `1..65535`                     |
| `WEB_PORT`             | Publish web and form the API allowed origin | Integer port                   | Optional; defaults to `3000`              | No     | `3000` / `LOCAL_DEVELOPMENT_VALUE`              | Local, CI orchestration | Integer `1..65535`                     |

`API_PORT` and `WEB_PORT` are host bindings. API/web container ports remain `8080` and `3000`; API `ASPNETCORE_URLS` remains backend-owned. Changing either host port in `.env` updates every dependent Compose value, preventing a port override from silently breaking browser transport or origin validation.

## Source-specification reconciliation

The Day 5 proposal is a greenfield catalog. GP-27/28 require real consumers and narrow ownership, so GP-29 applies this explicit amendment:

| Proposed key                                                    | Disposition    | Reason or canonical replacement                                                                                              |
| --------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `APP_NAME`                                                      | `REMOVE`       | Already represented by `Platform:Name` and `NEXT_PUBLIC_APP_NAME`; unused CI aliases were removed                            |
| `APP_ENVIRONMENT`                                               | `REMOVE`       | Provider-specific `ASPNETCORE_ENVIRONMENT` and `NEXT_PUBLIC_ENVIRONMENT` remain distinct; unused CI alias removed            |
| `APP_VERSION`                                                   | `REMOVE`       | Component/build metadata owns version; unused CI alias removed instead of creating a second root authority                   |
| `POSTGRES_HOST`, `POSTGRES_PORT`                                | `MOVE_BACKEND` | API endpoint values are component-owned; Compose uses service `postgres:5432` internally and root owns only the host binding |
| `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`       | `KEEP_ROOT`    | Compose provisions these values and passes the same local values to the API                                                  |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`                    | `MOVE_BACKEND` | API endpoint/authentication values are component-owned; local Compose Redis is intentionally unauthenticated                 |
| `API_PORT`, `WEB_PORT`                                          | `KEEP_ROOT`    | Added as coherent host-facing orchestration inputs                                                                           |
| `COMPOSE_PROJECT_NAME`, `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT` | `KEEP_ROOT`    | Existing real orchestration consumers omitted by the proposal                                                                |

`APP_VERSION` is not authoritative at root. Frontend package/build metadata and API `Platform:Version` own their respective representations until a later release process defines a generated shared source.

## Transitional root inventory

Every key below `# Transitional root application contract.` is classified `DEFER`: it belongs to the supported legacy command-console application, not Proprium. The explicit marker prevents those values from entering the Proprium validator or ownership map. Frontend-looking, storage, integration, observability, security, queue, feature, and AI keys remain in that bounded block until the legacy retirement/migration roadmap moves or removes them; GP-29 does not silently delete a supported application's contract.

## Safety and enforcement

The root parser accepts comments, blank lines, and simple uppercase `KEY=value` assignments only. It rejects missing/unowned/duplicate keys, malformed lines, empty examples, executable syntax, ports outside `1..65535`, and any PostgreSQL password other than the approved placeholder. Compose relationship checks also require every host binding and dependent URL/origin mapping. Diagnostics name keys and rules but never print values.

`npm run validate:configuration` runs the actual contract plus seven controlled root/Compose failures. Repository validation includes those fixtures. Existing secret scanning separately detects credential patterns and unsafe tracked files. Compose parsing proves every root key has a real consumer and that overrides resolve without starting infrastructure.
