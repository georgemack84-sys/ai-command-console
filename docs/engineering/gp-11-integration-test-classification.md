# GP-11 Integration-Test Classification

**Version:** 1.0
**Status:** Implemented

## Purpose and ownership

GP-11 makes the boundary between infrastructure-independent and infrastructure-dependent backend tests explicit before PostgreSQL, Redis, or the application host is started. `Proprium.ArchitectureTests` owns metadata-only reflection validation; `Proprium.IntegrationTests.IIntegrationTest` is the repository-owned author-intent marker; and xUnit's `Category` trait is the single CLI filtering mechanism.

The classifier recognizes exactly two test assemblies: `Proprium.ArchitectureTests` and `Proprium.IntegrationTests`. A new `*Tests` project fails metadata validation until it receives an explicit policy. Classification never infers intent from project, namespace, class, method, file, or fixture names and never constructs a test class or fixture.

## Classification contract

| Category | Required declaration | Infrastructure evidence | Execution boundary |
| --- | --- | --- | --- |
| Unit | `Category=Unit` | Prohibited | In-process and infrastructure-independent |
| Architecture | `Category=Architecture` | Prohibited | Compiled metadata, reflection, and policy only |
| Integration | `IIntegrationTest` and `Category=Integration` | Required | Real PostgreSQL, Redis, or approved application host |

Every discovered xUnit `[Fact]` and `[Theory]` must resolve to exactly one category. Class-level traits are the normal form. A method-level category combines with its class traits as xUnit does; a different method-level category therefore creates a conflict and fails. Mixed-category classes must be split.

Integration classification requires both intent and evidence. An infrastructure signal without `IIntegrationTest` is unclassified; an integration marker without an approved signal is stale or over-classified. `Category=Integration` is also required so the test is selected by the canonical xUnit filter. Unit and Architecture tests may not implement the integration marker or contain approved external-infrastructure calls.

## Approved infrastructure evidence

The registry is deliberately closed. Current evidence is:

- `IClassFixture<WebApplicationFactory<Program>>`, a deliberately derived fixture type, or constructor injection of either, representing the repository's approved real application-host boundary;
- a compiled call to the Npgsql EF Core provider's `UseNpgsql` method; or
- a compiled call to `StackExchange.Redis.ConnectionMultiplexer.Connect` or `ConnectAsync`.

The reflection scanner follows compiler-generated nested async state machines, so direct Redis connections inside asynchronous tests remain visible. It does not treat arbitrary `*Fixture` types, unrelated `WebApplicationFactory<T>` uses, EF Core in-memory use, a constructed `PostgresException`, or namespace/name text as infrastructure. No collection fixture, Redis fixture, test-container base class, SQLite substitute, or shared integration fixture library currently exists; adding one requires an exact registry entry, negative evidence, and this document to change together.

`Proprium.ArchitectureTests` may consume production types for in-process behavioral tests but may not directly reference Entity Framework Core, Npgsql, StackExchange.Redis, or Testcontainers packages. The integration project retains the approved infrastructure package boundary. GP-10 independently prevents production-to-test references.

## Commands and filtering

Restore and build first because classification inspects compiled assemblies:

```bash
dotnet restore services/api/Proprium.sln
dotnet build services/api/Proprium.sln --configuration Release --no-restore --nologo
npm run validate:backend-test-classification
```

The validation command checks recognized projects and direct packages, executes metadata negative fixtures, and runs only the five reflection-policy tests. It does not run integration tests or start infrastructure.

After a successful build, the three suites are independently selectable:

```bash
npm run backend:test:unit
npm run backend:test:architecture
npm run backend:test:integration
```

The Unit and Architecture commands require no infrastructure. `backend:test:integration` selects every `Category=Integration` test but deliberately remains an execution command: PostgreSQL, Redis, configuration, and any later orchestration must be ready before it is invoked. GP-11 validates selection integrity; later CI work owns service startup.

## Failure diagnostics and negative evidence

Validation aggregates class- and method-level violations. Diagnostics identify the test, missing or conflicting declaration, and detected infrastructure signal. Controlled compiled fixtures prove rejection of infrastructure without a marker, a marker without infrastructure, and conflicting categories; positive fixtures prove valid Unit, Architecture, and Integration states. Separate metadata fixtures prove that an unknown test project, a forbidden direct infrastructure package, and a missing test-framework package fail closed.

A future exception must name an exact type or compiled call, explain why it is external infrastructure, include positive and negative contract tests, and document its execution prerequisites. Broad namespace, package, project-name, or suffix-based inference is prohibited.

## Audit result

The repository uses xUnit 2.9.3, has no dedicated unit-test project, and historically kept infrastructure-independent behavioral tests beside architecture rules in `Proprium.ArchitectureTests`. GP-11 preserves that project layout while assigning explicit Unit and Architecture traits. All 11 existing integration classes already carried the integration filter trait and had approved compiled infrastructure evidence; they now also implement the canonical marker. The resulting partition contains 64 Unit tests and 20 Architecture tests, with zero unexplained classification violations.
