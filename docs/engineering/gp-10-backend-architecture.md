# GP-10 Backend Architecture Tests

**Version:** 1.0
**Status:** Implemented

## Purpose and ownership

GP-10 freezes the backend dependency model as executable policy. The dedicated `Proprium.ArchitectureTests` project owns compiled-code rules, while `scripts/backend-architecture-policy.cjs` owns project-reference and package-reference rules that cannot be inferred reliably from compiled assemblies. Both layers are required: project metadata catches forbidden references even when no source currently uses them, and compiled inspection catches forbidden type dependencies and public contracts.

The architecture suite uses the centrally locked `NetArchTest.eNhancedEdition` 1.4.5 package. It remains separate from unit and integration execution, requires no database, Redis, Docker daemon, environment file, credential, or running API, and does not broaden GP-11's future integration-test classification scope.

## Canonical dependency matrix

| Project | Permitted production project references |
| --- | --- |
| `Proprium.Domain` | None |
| `Proprium.Contracts.V1` | None |
| `Proprium.Application` | `Proprium.Domain` |
| `Proprium.Infrastructure` | `Proprium.Application`, `Proprium.Domain` |
| `Proprium.Api` | `Proprium.Application`, `Proprium.Contracts.V1`, `Proprium.Infrastructure` |

`Proprium.IntegrationTests` may reference API and Infrastructure. `Proprium.ArchitectureTests` may inspect all production projects and the integration-test assembly. Production projects may never reference a test project. Any project-reference cycle fails validation.

Domain, Application, and Contracts are framework-independent boundaries. Their project metadata and compiled types must not introduce ASP.NET Core, Entity Framework Core, Npgsql, or StackExchange.Redis dependencies. Contracts remains a leaf boundary; Application cannot depend on API or Infrastructure; Infrastructure cannot depend on API. API remains the composition root and currently uses minimal endpoints, so controller types are rejected.

## Namespace and dependency-resolution rules

Every handwritten production type must live under the namespace matching its owning project. The top-level API `Program` type is the single source-authored exception because the C# top-level statement model emits it in the global namespace. Compiler-, collection-expression-, anonymous-type-, and regex-generator output is excluded by type identity and generated naming because those types are tool-owned rather than architectural source.

Domain and Application public contracts must not expose `IServiceProvider`, `IServiceScope`, or `IServiceScopeFactory`. They also must not define zero-argument generic service-resolver APIs such as `Resolve<T>()`, `GetService<T>()`, or `GetRequiredService<T>()`. Typed constructor dependencies remain the default.

API startup and Infrastructure registration factories may resolve services because they are composition boundaries. `RetryExecutor` is the one intentional production runtime-scope owner: its exact `IServiceScopeFactory` constructor dependency is asserted so the exception cannot silently spread to another Infrastructure type. Authentication handlers are inspected at IL level and may not resolve services through `HttpContext.RequestServices` or service-provider extension methods.

## Commands

Restore and build before running the no-build architecture suite:

```bash
dotnet restore services/api/Proprium.sln
dotnet build services/api/Proprium.sln --configuration Release --no-restore --nologo
npm run validate:backend-architecture
```

The aggregate command runs:

- `backend:architecture:metadata` for the exact project graph, production-to-test edges, implementation packages, and cycles;
- `backend:architecture:fixtures` for isolated forbidden-edge, forbidden-package, and cycle evidence; and
- `backend:architecture:test` for compiled layer, namespace, framework, container-signature, and service-location rules.

The compiled rule helpers also have controlled in-project fixtures proving that forbidden dependencies, misplaced namespaces, container-shaped public contracts, and generic resolvers are rejected while ordinary typed dependencies and generic repository methods remain valid.

## Failure and exceptions

Architecture failures must identify the violated project, namespace, type, or dependency boundary. Remediate by moving behavior to its owning layer, introducing an inward-facing abstraction, or removing the unused project/package reference. Do not weaken a rule merely to admit an existing dependency.

A future exception must be exact, source-controlled, justified beside the test, assigned an owner and removal condition, and backed by a test that prevents its scope from widening. Namespace-wide, assembly-wide, or framework-wide suppression lists are not acceptable.

## Audit result

The pre-implementation project graph already matched the canonical matrix, and the compiled audit found no production boundary violation requiring remediation. GP-10 therefore adds fail-closed enforcement and negative evidence without changing application behavior or introducing infrastructure-dependent validation.
