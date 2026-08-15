# Week 3 Day 2 Authentication Validation Record

## Scope

This record covers credential verification, opaque PostgreSQL-backed sessions, cookie behavior, login/logout/current-user APIs, audit evidence, and Redis independence.

## Required evidence

Run the backend validation with PostgreSQL available and the standard test environment variables:

```powershell
dotnet test services/api/Proprium.IntegrationTests/Proprium.IntegrationTests.csproj
dotnet test services/api/Proprium.ArchitectureTests/Proprium.ArchitectureTests.csproj
dotnet format services/api/Proprium.sln --verify-no-changes
dotnet run --project services/api/Proprium.Api -- --write-openapi artifacts/openapi.json
```

The integration suite proves a successful `204` login, zero response body, persisted token hash, authoritative current-user resolution, logout revocation, generic unknown/disabled failures, rehash ordering, origin/CSRF rejection, strict JSON handling, response cache controls, and login success with Redis unavailable. It also verifies that the current-user response is allow-listed and includes the persisted display name.

The failure-path evidence proves that a concurrent password-rehash update prevents both session and success-event persistence, a replayed revoked cookie produces a `SessionRejected` audit event, malformed cookie input produces only safe rejection metadata, and concurrent revocation remains idempotent.

The OpenAPI integration test verifies that login and logout `204` responses have no response-body schema. It also verifies the `PropriumSession` cookie scheme is required by current-user operations but not login or logout. The architecture suite covers typed password outcomes, token generation and hashing, cookie policy, session factory behavior, and repository boundaries.

## Retention decision

Session expiry is a validity decision, not record deletion. Expired and revoked session rows remain available for authentication evidence. No physical-deletion job is introduced until an approved audit-retention policy defines the duration and disposal process.
