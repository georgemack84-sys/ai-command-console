# GP-04 Secret Boundaries and Secret-Safety Enforcement

**Status:** Implemented

## Outcome

GP-04 defines what Proprium treats as confidential, limits where confidential values may exist, prevents common tracked-secret mistakes, and establishes the response to a confirmed exposure. It extends the existing repository and configuration validators; it does not introduce a production secret provider or encrypted secrets in Git.

## Classification and ownership

A secret is a value whose disclosure could grant access, impersonate an identity, weaken a cryptographic guarantee, or expose a protected service or data source.

| Current value | Classification | Logical owner | Allowed consumers |
| --- | --- | --- | --- |
| PostgreSQL password | Infrastructure secret | Local database operator | Compose provisioning and Platform API only |
| Redis password, when configured | Infrastructure secret | Cache operator | Platform API only |
| Session token digest key | Cryptographic secret | Authentication subsystem | Platform API authentication infrastructure only |
| Login rate-limit privacy key | Cryptographic secret | Authentication subsystem | Platform API rate limiter only |
| Local administrator password | Authentication secret | Development operator | Development-only API migration/bootstrap path |
| Legacy command-console authentication/admin values | Authentication secrets | Legacy application operator | Legacy server runtime only |
| Optional provider API keys | Provider secrets | Owning integration | Owning server-side integration only |

Hostnames, ports, application/environment names, database names, public API URLs, and browser-delivered Mapbox public access tokens are not confidential. `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is the one exact public-token naming exception because Mapbox public access tokens are intentionally browser-visible; it does not authorize other `NEXT_PUBLIC_*TOKEN*` names.

Connection URLs are context-dependent: any embedded credential makes the full URL secret-bearing. The repository's static PostgreSQL credentials are explicitly disposable local/test fixtures. They must never be reused outside isolated development or test infrastructure.

## Allowed locations

Real development/runtime secrets may exist only in:

- ignored local environment files used by an owning component;
- process environment supplied by the shell, IDE, container runtime, or CI secret mechanism;
- an approved local secret store when one is introduced; or
- a future approved production secret provider.

The API does not automatically load `.env` files. A secret change requires external value replacement plus restart/redeployment, not a source edit or rebuild.

## Prohibited locations

Real secrets must not appear in tracked templates, `appsettings*.json`, source, test source, documentation, snapshots, workflow literals, Dockerfiles, Compose files, OpenAPI, logs, exception messages, telemetry, browser configuration, or command-line arguments. Configuration dumps and raw exception-object logging are prohibited because either can carry values outside the typed configuration boundary.

Private-key and credential containers such as `.key`, `.pem`, `.p12`, `.pfx`, keystores, `credentials.json`, and service-account JSON files are ignored as defense in depth and fail tracked-file validation. `.gitignore` is not considered a security boundary.

## Placeholder and fixture policy

Tracked examples use empty optional values or unmistakable markers such as `local-development-only`, `replace-with-...`, `change-me`, `test-only`, or `ci-placeholder`. Valid 32-byte base64 test material is permitted where cryptographic validation requires it. Deterministic credentials in disposable local/CI infrastructure are test fixtures, not deployable defaults, and must be identified by context.

Tests must construct prohibited token/private-key signatures at runtime so the repository does not contain the signatures it is designed to reject. Suppressions must be exact by path/name/value classification; broad file or directory exclusions are forbidden.

## Mechanical enforcement

`npm run validate:secrets` scans tracked paths and text without printing candidate values. It fails for:

- tracked local environment, private-key, certificate-container, or credential files;
- private-key headers and recognizable GitHub, OpenAI-style, or AWS access-key signatures;
- public frontend names that imply confidential material, except the exact Mapbox public-token name;
- unsafe sensitive literals in templates, tracked ASP.NET configuration, workflows, Dockerfiles, or Compose;
- unapproved credential-bearing URLs;
- broad configuration dumps; or
- raw exception-object logging in the Proprium API.

`npm run test:secret-safety` exercises positive and negative fixtures. `npm run validate:repository` invokes the secret check, so the existing CI repository gate receives the same enforcement without a workflow change.

Secret-bearing API records and the aggregate configuration snapshot redact their string representation. Runtime validation errors name only the setting and safe expectation. API exception/retry logs retain safe operation metadata and exception type, never the exception object or message.

## Exposure response

If a credential appears genuine:

1. stop reproducing or transmitting the value;
2. record only its file/location and owning system;
3. revoke or rotate it immediately and invalidate dependent sessions/credentials when applicable;
4. remove it from current source and replace it with external configuration;
5. add or tighten focused prevention rules;
6. assess Git history, forks, caches, CI logs, build artifacts, and other distribution points; and
7. decide any history rewrite as an operator-controlled incident action.

Deletion or history rewriting never substitutes for revocation/rotation. A credential committed even briefly is presumed compromised.

## CI, Docker, and future providers

CI must inject secrets through the platform secret mechanism and must not echo them, dump environments, or place them in workflow literals. Docker build arguments and image-layer environment instructions are not secret stores. Compose may reference externally supplied values or use explicitly disposable local fixtures only.

GP-04 leaves cloud secret stores, rotation automation, certificate lifecycle, IAM architecture, encrypted-in-Git workflows, and DLP platforms to later architecture decisions.
