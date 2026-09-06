# GP-43 .NET Analyzer and Warning Policy

**Version:** 1.0
**Status:** Implemented

## Authority and scope

`Directory.Build.props`, `Directory.Build.targets`, and the root `.editorconfig`
jointly own backend compiler, analyzer, severity, and C# style policy. All seven
projects in `services/api/Proprium.sln`, including both test projects, inherit the
same settings. Project files may not override analyzer enablement, analysis mode,
warning severity, code-style enforcement, nullable analysis, or suppression
properties.

The repository pins the .NET 8 analyzer ruleset with `AnalysisLevel=8.0` and
explicitly selects `AnalysisMode=Default`. This preserves the reviewed SDK
baseline instead of enabling every recommended design and performance diagnostic;
GP-08 found that the broader mode would require unrelated domain naming and public
return-type changes. `EnableNETAnalyzers=true`, `TreatWarningsAsErrors=true`, and
`EnforceCodeStyleInBuild=true` make selected compiler, analyzer, and build-capable
style diagnostics fail locally and in automation.

## Commands

Restore dependencies once, then run the infrastructure-independent quality chain:

```bash
dotnet restore services/api/Proprium.sln --locked-mode
npm run backend:format:check
npm run validate:backend-analyzers
dotnet build services/api/Proprium.sln --configuration Release --no-restore --nologo
```

`validate:backend-compiler` remains a compatibility alias for the complete analyzer
validation. Its fixtures prove compiler warnings (`CS1998`), nullable failures
(`CS8600` and `CS8602`), an SDK analyzer failure (`CA2200`), evaluated-property
drift rejection, and narrow suppression scope. GP-43 fixtures additionally prove
interface, async-method, constant, readonly-field, access-modifier, namespace,
using-order, and unused-using violations fail their owning build or formatter gate.

## Warning and suppression policy

New build warnings are errors. `NoWarn`, `WarningsNotAsErrors`, project-local
`WarningsAsErrors`, and project-local analyzer properties are prohibited. A source
suppression must identify diagnostic IDs, state why it is correct, include a
matching restore when using a pragma, and state its removal condition or why it is
a permanent framework/fixture contract. Blanket pragmas are rejected.

The only handwritten pragma is the permanent scoped-suppression negative fixture,
which suppresses `CS1998` while proving `CS8602` remains visible. EF migration
designer and snapshot pragmas are generator-owned and recognized only by their
narrow persistence paths. Five EF required-navigation null-forgiving invariants
remain governed by the GP-42 validator.

`GenerateDocumentationFile=true` is enabled because Roslyn requires documentation
analysis before `IDE0005` can detect unused imports during builds. `CS1591` is the
single centralized non-error diagnostic override: XML documentation coverage is
not part of GP-43. Remove that override when public XML documentation becomes a
repository requirement. No `severity=none` override is permitted.

## C# style contract

- namespaces follow the existing `Proprium.<Layer>.<Feature>` folder structure and
  use file-scoped declarations;
- interfaces use `I` plus PascalCase;
- production methods declared `async` use an `Async` suffix; xUnit entry points
  retain established behavior-sentence names through two project-scoped suggestion
  overrides, removable if test naming changes;
- member constants use PascalCase and local constants use camelCase;
- fields that are never reassigned must be `readonly`;
- non-interface members use explicit accessibility;
- usings live outside namespaces, sort deterministically with `System` first, and
  unused usings fail with `IDE0005`;
- simple properties, indexers, accessors, and operators may use expression bodies;
  methods, constructors, and local functions prefer blocks for readability.

Error-level style belongs to `.editorconfig` plus `dotnet format style`; whitespace
belongs to `dotnet format whitespace`; compiler and correctness diagnostics belong
to build. The two gates converge without PostgreSQL, Redis, Docker, external APIs,
environment files, or secrets.

## Audit result and deferral

Before GP-43, the Release solution built with zero warnings and errors and already
had no project-local analyzer overrides, `NoWarn`, or `WarningsNotAsErrors`.
Activating build-time unused-import analysis removed eleven stale imports and also
normalized import ordering; no runtime behavior or public contract changed. The
final Release build remains at zero warnings and zero errors.

Two architecture-test source files retain suggestion-level namespace-folder
matching because their deeper `Domain` and `Infrastructure` namespaces are the
dependency-violation data under test. Those exceptions end if the fixtures are
retired or moved into matching subfolders.

Dependency direction, service-location restrictions, public `IServiceProvider`
contracts, migration ownership, and endpoint organization remain deferred to
GP-44 architecture validation.
