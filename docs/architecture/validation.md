# Backend architecture validation (GP-44)

Proprium makes its backend architecture executable. The validation suite runs offline and fails CI when a rule is violated.

| Rule | Boundary | Enforcement |
| --- | --- | --- |
| ARCH-001 | Domain independence | Project graph and compiled dependency checks |
| ARCH-002 | Application independence | Project graph and compiled dependency checks |
| ARCH-003 | Infrastructure boundary | Project graph and compiled dependency checks |
| ARCH-004 | API composition boundary | Project graph and compiled dependency checks |
| ARCH-005 | Service locator prohibition | Public-signature and production-wide IL inspection |
| ARCH-006 | Public container boundary | Production-wide `IServiceProvider`/scope public-signature inspection |
| ARCH-007 | Migration ownership | Reflection checks for EF migrations, snapshots, and `DbContext` ownership |
| ARCH-008 | Endpoint organization | Endpoint namespace and public-contract checks |
| ARCH-009 | Architecture-test isolation | Build-safe registration and design-time model tests |
| ARCH-010 | Exception governance | Registry completeness and expiry validation |

Run the complete architecture gate with:

```powershell
npm run validate:backend-architecture
```

The test project must not require PostgreSQL, Redis, Docker, a network connection, production credentials, or an `.env` file. Integration validation is a separate CI stage.

Service-location calls are prohibited everywhere except the type-specific composition boundaries asserted by the test: `Program`, OpenAPI tooling registration, Infrastructure service registration, and `RetryExecutor`'s scoped retry implementation.

Layer-rule failures identify the `ARCH-*` rule, the violating type, the forbidden boundary, and the expected dependency direction.

## Regression evidence

The suite includes controlled violations that must fail without altering production code:

| Rules | Deliberate regression evidence |
| --- | --- |
| ARCH-001 through ARCH-003 | A fixture creates a forbidden inward-to-outward dependency. |
| ARCH-004 and ARCH-008 | A fixture endpoint depends on `PropriumDbContext`. |
| ARCH-005 and ARCH-006 | Fixtures call or publicly expose `IServiceProvider`; constructor, method, property, and field surfaces are covered. |
| ARCH-007 | A fixture derives from EF Core `Migration` outside Infrastructure persistence. |
| ARCH-009 | Build-safe tests construct registration and the EF design-time model without connecting to external infrastructure. |
| ARCH-010 | Registry validation rejects incomplete, broad, or expired exceptions. |

## Exceptions

Add an exception only to `ArchitectureExceptionRegistry` when it names one exact type, an `ARCH-*` rule, a reason, an approver, a creation date, and an expiry date. Never suppress an assembly, namespace, or framework broadly. The exception must be paired with a test that keeps its scope narrow.

The active `RetryExecutor` exceptions for ARCH-005 and ARCH-006 are approved by George and expire on 2026-12-05. They are the only rule-derived allowlist entries; composition-root types are canonical boundaries, not exceptions.

## Endpoint delivery boundary

Endpoint modules must live in `Proprium.Api.Endpoints`, must not expose Infrastructure types in their public APIs, and must not reference `Proprium.Infrastructure`. Endpoint handlers receive Application contracts; Infrastructure implements those contracts.
