# GP-33 Startup Configuration Validation

**Status:** Implemented

## Outcome

The Platform API validates one effective, typed configuration snapshot before
service registration or container construction. Independent failures are
aggregated in deterministic model order and startup receives no partially valid
snapshot. Binding and validation perform no PostgreSQL, Redis, network, or secret
provider connectivity.

The existing explicit resolver remains the repository-approved equivalent of
options binding plus `ValidateOnStart`. A second framework validation path would
duplicate parsing and risk conflicting results, so GP-33 strengthens the
canonical resolver instead.

## Failure contract

Every structured `ConfigurationValidationError` contains the canonical setting,
one stable category, a safe expectation, and a secret classification. Exception
text renders only the setting, category, and expectation; it never renders the
supplied value or an options object.

| Category       | Meaning                                                       | Examples                                       |
| -------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `Missing`      | A required value is absent, empty, or whitespace-only         | PostgreSQL host, conditional local-admin key   |
| `Malformed`    | A supplied value cannot be parsed or violates required format | Integer, boolean, origin, base64 key, enum     |
| `OutOfRange`   | A parsed scalar lies outside its documented numeric range     | Ports, session lifetime, fallback capacity     |
| `Incompatible` | Valid individual values violate an established relationship   | Locked limits, local admin outside Development |

Multiple independent errors are emitted in environment, platform, PostgreSQL,
Redis, session, authentication, rate-limit, then local-administrator order.
Dependent checks are skipped after their input has failed; for example, a
missing key is not also reported as malformed base64. The first setting and
category remain available as convenience properties for single-error callers.

## Validation matrix

| Key/model                             | Required                      | Type/format               | Range or compatibility                   | Secret |
| ------------------------------------- | ----------------------------- | ------------------------- | ---------------------------------------- | -----: |
| `ASPNETCORE_ENVIRONMENT`              | Framework default allowed     | Closed environment enum   | Development, Test, Staging, Production   |     No |
| `Platform:Name` / `Platform:Version`  | Yes after provider resolution | Non-empty string          | Repository-owned metadata                |     No |
| `POSTGRES_HOST`                       | Yes                           | Non-empty string          | No speculative hostname policy           |     No |
| `POSTGRES_PORT`                       | Yes                           | Invariant integer         | 1–65535                                  |     No |
| `POSTGRES_DATABASE` / `POSTGRES_USER` | Yes                           | Non-empty string          | No speculative provider naming policy    |     No |
| `POSTGRES_PASSWORD`                   | Yes                           | Non-empty string          | Authentication is not tested             |    Yes |
| `REDIS_HOST`                          | Yes                           | Non-empty string          | No connectivity test                     |     No |
| `REDIS_PORT`                          | Yes                           | Invariant integer         | 1–65535                                  |     No |
| `REDIS_PASSWORD`                      | No                            | Opaque string             | Empty is permitted for local topology    |    Yes |
| `SESSION_TOKEN_DIGEST_KEY`            | Yes                           | Base64, at least 32 bytes | —                                        |    Yes |
| `SESSION_LIFETIME_MINUTES`            | Yes                           | Invariant integer         | 5–43,200                                 |     No |
| `AUTH_ALLOWED_ORIGIN`                 | Yes                           | Absolute HTTP(S) origin   | No path, query, fragment, user info, `*` |     No |
| `LOGIN_RATE_LIMIT_PRIVACY_KEY`        | Yes                           | Base64, at least 32 bytes | —                                        |    Yes |
| `LOGIN_RATE_LIMIT_SOURCE`             | No; defaults to 10            | Positive integer          | Must equal locked value 10               |     No |
| `LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE`  | No; defaults to 5             | Positive integer          | Must equal locked value 5                |     No |
| `LOGIN_RATE_LIMIT_WINDOW_MINUTES`     | No; defaults to 5             | Positive integer          | Must equal locked value 5                |     No |
| `LOGIN_RATE_LIMIT_FALLBACK_CAPACITY`  | No; defaults to 10,000        | Invariant integer         | 100–100,000                              |     No |
| `LOCAL_ADMIN_ENABLED`                 | No; defaults to false         | Boolean                   | May be true only in Development          |     No |
| `LOCAL_ADMIN_USERNAME`                | When local admin is enabled   | Non-empty string          | —                                        |     No |
| `LOCAL_ADMIN_PASSWORD`                | When local admin is enabled   | Non-empty string          | No authentication test                   |    Yes |

`ASPNETCORE_URLS` remains framework-owned. The repository has no additional host
binding rule that justifies duplicating ASP.NET Core parsing. Production
placeholder rejection remains under GP-35 because no broader secret sentinel
policy has yet been established.

## Enforcement and qualification

Program composes the provider chain, resolves and validates the snapshot, then
registers services and builds the host. Repository policy mechanically requires
that order, the four categories, structured secret classification, and the final
validation gate before snapshot return.

Tests cover valid synthetic configuration, missing and whitespace values,
malformed scalars and origins, lower and upper port boundaries, out-of-range
values, compatibility rules, deterministic multi-error aggregation, secret
sentinel non-disclosure, and malformed stronger-provider overrides. They execute
the configuration phase without live infrastructure.
