# GP-08 Backend Compiler Standards and Analyzer Baseline

**Version:** 1.0
**Status:** Implemented

## Purpose and ownership

GP-08 makes backend compiler and analyzer diagnostics deterministic, repository-owned, and fail-closed. The C# compiler owns language, type, and nullable diagnostics. The .NET SDK analyzers own high-value correctness and maintainability diagnostics. GP-09 will own backend formatting, GP-10 architecture tests, and GP-11 integration-test classification.

The policy applies to all seven projects in `services/api/Proprium.sln`: API, application, domain, infrastructure, contracts, architecture tests, and integration tests. Compilation is static and requires no PostgreSQL, Redis, Docker daemon, API process, environment file, or secret.

## Canonical configuration

`Directory.Build.props` is the shared compiler policy:

| Property | Value | Purpose |
| --- | --- | --- |
| `TargetFramework` | `net8.0` | One framework for every backend project |
| `Nullable` | `enable` | Nullable reference analysis for handwritten source |
| `TreatWarningsAsErrors` | `true` | Compiler and required analyzer warnings fail the build |
| `EnableNETAnalyzers` | `true` | Use the analyzers included with the selected SDK |
| `AnalysisLevel` | `8.0` | Pin the .NET 8 default ruleset instead of following `latest` |
| `Deterministic` | `true` | Require deterministic compiler output |

`Directory.Build.targets` validates the evaluated properties before compilation. A project-level override cannot silently weaken nullable analysis, warnings-as-errors, analyzers, the analysis level, or deterministic output. `npm run backend:compiler:check` also audits project files for `NoWarn`, `WarningsNotAsErrors`, and overrides of shared properties.

`global.json` selects SDK feature band `8.0.400` with `latestPatch` roll-forward. This permits servicing patches in that feature band without moving to another .NET 8 feature band. Analyzer diagnostics use the fixed `8.0` level, so installing a newer unrelated SDK does not opt the repository into a new ruleset. The baseline uses built-in SDK analyzers; no redundant analyzer NuGet package or version is required.

## Canonical commands

From the repository root, restore and compile independently:

```bash
dotnet restore services/api/Proprium.sln
dotnet build services/api/Proprium.sln --configuration Release --no-restore --nologo
```

Release is the canonical GP-08 configuration. A successful build must report `0 Warning(s)` and `0 Error(s)`. Restore requires package-source access when dependencies are not cached, but neither restore nor compilation starts runtime infrastructure or reads application secrets.

Run the policy and negative contract checks with:

```bash
npm run validate:backend-compiler
```

This command audits shared settings, project overrides, and warning suppressions, then builds controlled projects outside the solution. The fixtures prove that nullable dereference (`CS8602`), an ordinary compiler warning promoted to an error (`CS1998`), and an SDK analyzer finding (`CA2200`) all fail. A scoped-suppression fixture proves a justified `CS1998` suppression does not hide an unrelated `CS8602` failure. A final fixture proves the evaluated MSBuild target rejects `Nullable=disable` even when passed after shared properties are imported.

## Analyzer severity and remediation

The fixed .NET 8 analyzer baseline supplies deterministic default severities. Warnings-as-errors turns required warning diagnostics into build failures without maintaining a duplicate list of hundreds of rule IDs. GP-08 deliberately does not enable the broader `recommended` mode: the audit found `CA1711` and `CA1859` findings that would require domain type naming and public return-type changes, which are inappropriate for a compiler-tooling increment.

Remediate a failure according to its diagnostic ID and preserve the diagnostic's file, line, column, and message. Prefer a correct nullable annotation, guard, construction invariant, resource lifetime, or async flow. Do not use broad null-forgiving operators, change public/domain contracts, alter persistence semantics, or redesign dependency-injection ownership merely to silence a diagnostic.

## Generated code and suppressions

Generated code remains compiled. SDK/source-generator output under `obj` is ignored by repository scans and must never be edited. EF migration files matching `Persistence/<14-digit timestamp>_*.cs`, their `.Designer.cs` companions, and `*ModelSnapshot.cs` are recognized narrowly as EF-generated source. Their generator-owned nullable directives and specific obsolete-API pragmas are accepted; migrations are not excluded from compilation or analyzer execution.

Handwritten source must not use `#nullable disable` or a blanket `#pragma warning disable`. A specific pragma must list diagnostic IDs and include an inline reason; `SuppressMessage` must include `Justification`. Project-level `NoWarn` and `WarningsNotAsErrors` are prohibited. A future exception must be scoped to the smallest file or symbol, identify the exact diagnostic, explain why it is inapplicable, and include a removal condition when temporary. There are no handwritten production suppressions in the GP-08 baseline.

## Audit result

Before GP-08, the Release solution already compiled with zero warnings and errors under nullable analysis, warnings-as-errors, and SDK analyzers. No backend source remediation or behavioral change was necessary. GP-08 pins the analyzer and SDK roll-forward policy, corrects the domain project's Release solution mapping from Debug to Release, makes weakening overrides fail mechanically, and adds executable negative evidence.
