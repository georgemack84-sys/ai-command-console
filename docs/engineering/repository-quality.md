# Repository Quality Standards

## Canonical owners

| Gate | Canonical owner |
| --- | --- |
| Frontend formatting | Prettier in `apps/web` |
| Frontend static analysis | ESLint in `apps/web` |
| Frontend dependency architecture | dependency-cruiser in `apps/web` |
| Type safety | Strict TypeScript compiler settings |
| Backend compiler and analysis | C# compiler and centralized .NET SDK analyzers |
| Backend formatting | `dotnet format` |
| Backend architecture | Architecture test project |
| Backend test classification | Architecture test project plus `IIntegrationTest` |
| Repository consistency | `npm run validate:repository` |
| Developer documentation | `npm run validate:documentation` |
| Secret safety | `npm run validate:secrets` |
| CI orchestration | GitHub Actions |

## File rules

Repository policy, rather than a contributor's operating system, editor, IDE, or
Git installation, determines the canonical representation of committed text.
The policy applies to frontend and backend source, infrastructure, automation,
documentation, configuration, CI workflows, and committed generated text.

| Concern | Canonical rule |
| --- | --- |
| Encoding | UTF-8 without BOM |
| Repository line ending | LF by default |
| Final newline | Required for every non-empty text file |
| Trailing whitespace | Prohibited unless semantically required in Markdown |
| Default indentation | Spaces, with explicit language-specific widths |
| Tabs | Prohibited except for formats such as Makefiles that require them |
| Exceptions | Explicit, narrow, justified, documented, and mechanically encoded |

`.gitattributes` owns normalization and binary classification. `.editorconfig`
owns editor behavior and language-specific indentation. Formatters may impose
stricter rules, but they must not silently contradict the repository defaults.
The [GP-01 repository baseline](gp-01-repository-baseline.md) records the
configuration decisions and validation boundary.

### Encoding and line endings

All governed text is valid UTF-8. A BOM is prohibited unless a named tool
demonstrably requires it and the exception records its scope and removal
condition. Ordinary committed text uses LF on Windows, macOS, Linux, developer
workstations, and CI runners; local Git configuration is not an exception.

The repository retains two explicit CRLF working-tree exceptions established by
GP-01: PowerShell scripts for the supported Windows-native command path and Visual
Studio solution files for the supported .NET/Visual Studio tool path. Git still
stores their text canonically, while `.gitattributes` and `.editorconfig` produce
CRLF working copies for those patterns. These exceptions may be removed only
after the affected Windows workflows are qualified with LF.

### Whitespace and indentation

The last content line in every non-empty text file is followed by one newline.
Accidental blank lines and spaces or tabs at end of file are removed. Markdown
may retain trailing spaces only when they intentionally produce required rendered
output; Markdown's general support for hard breaks is not sufficient reason to
add them. Prefer an explicit Markdown construct when one expresses the same
result.

Spaces are the default indentation style. Web, configuration, XML, project, and
infrastructure formats use the explicit widths in `.editorconfig`; C# uses four
spaces. Makefiles retain tabs because their recipe syntax requires them. Editor
preference or operating-system convention never justifies a tab exception.

### Generated files and exceptions

Generation does not automatically exempt committed output. An exception for a
generated file identifies whether it is committed or human-edited, the owning
generator, why normalization is unsafe or creates unavoidable churn, whether the
validator inspects it, and the removal condition. Prefer configuring the
generator to emit compliant output.

The only committed generated source currently marked for review tooling is
`apps/web/src/generated/permission-catalog.ts`. The permission-catalog generator
owns it, the generated header prohibits manual edits, and the repository's
freshness check verifies it. The marker affects GitHub presentation only; the
normal text policy still applies.

Every file-policy exception records the overridden rule, exact path or narrow
pattern, technical reason, required tool or runtime, mechanical enforcement, and
removal condition where practical. Editor preference, local Git configuration,
convenience, or the fact that a file is generated or documentation is not a
technical justification. New exceptions are added to this document and encoded
in repository configuration and validation in the same change.

### Migration audit

The GP-37 audit separated tracked Git content from ignored output and unrelated
working-tree changes. It found 51 legacy text files without a final newline and
one Markdown file with trailing whitespace. The isolated follow-up normalization
repaired only those 52 files; repository validation is the continuing source of
truth for compliance. No encoding, BOM, or stored line-ending migration was
required, and no new exception was introduced.

### Source-control hygiene

The root `.gitignore` centrally excludes dependency stores, frontend and .NET
build output, test and coverage results, runtime state, local secrets, IDE and OS
state, repository-local worktrees, and diagnostic automation output. Environment
examples and the reviewed frontend Docker/test environment files are explicitly
trackable. Lockfiles, source, canonical configuration, and shared VS Code files
remain trackable. Ignore rules never replace secret scanning or generated-file
freshness validation.

## Commands

The [GP-13 canonical command reference](gp-13-canonical-repository-commands.md)
is the stable developer and future-CI interface over these validators. Use
`npm run repo -- validate` for the full infrastructure-independent gate, or its
`repo`, `frontend`, and `backend` categories for focused feedback. The low-level
commands below remain useful for diagnosis and implementation detail.

Run `npm run validate:repository` for the actual tracked-repository check plus isolated policy fixtures. It verifies required tracked files, resolved Git attributes and ignore behavior, tracked-artifact and local-configuration exclusions, configuration authority, npm lockfiles, backend solution/project policy, Markdown fences/headings/links, YAML parsing/indentation, strict and TypeScript-aware JSON syntax, UTF-8 validation, line endings, final newlines, trailing whitespace, configuration ownership, and secret safety. Failures use stable `RVAL-*` rule IDs and aggregate independent violations. The [GP-12 repository-validation specification](gp-12-repository-validation.md) defines scope, ownership, remediation, and intentional deferrals; the command requires no infrastructure or network access.

Run `npm run validate:documentation` for the GP-16 semantic onboarding contract.
It checks the authoritative guide set, README navigation, canonical command
coverage, environment-template inventory, migration and reset boundaries,
clean-machine procedure, and evidence structure. `validate repo` invokes both the
repository and documentation validators, so documentation drift fails CI.

Run `npm run validate:secrets` for focused tracked-file, private-key, provider-token, public-configuration, placeholder, configuration-dump, and API exception-logging checks. Candidate values are never printed. The repository validator invokes this command automatically.

Run `npm run format`, `npm run format:check`, and `npm run format:verify` from `apps/web` to apply, check, and exercise the canonical frontend formatting contract. The [GP-05 frontend-formatting specification](gp-05-frontend-formatting.md) defines its file ownership and generated-output exclusions. Run `npm run lint`, `npm run typecheck`, and `npm run static-analysis:verify` for the zero-warning ESLint, strict non-emitting TypeScript, and negative-fixture contracts defined by [GP-06](gp-06-frontend-static-analysis.md). Run `npm run architecture` for the production dependency graph plus positive and isolated negative fixtures defined by the [GP-07 frontend architecture specification](gp-07-frontend-architecture.md). `npm run validate` includes all of these frontend gates and unit tests. For the backend, run the restore and zero-warning Release build defined by [GP-08](gp-08-backend-compiler-standards.md), then `npm run validate:backend-compiler` for policy and negative-fixture verification. Run `npm run backend:format` to apply and `npm run backend:format:check` to verify the bounded whitespace and error-level style policy defined by [GP-09](gp-09-backend-formatting.md); `npm run backend:format:verify` exercises its failure, correction, and idempotence contract. After the Release build, run `npm run validate:backend-architecture` for the project graph, package boundaries, compiled dependencies, namespace ownership, and service-location rules defined by [GP-10](gp-10-backend-architecture.md), then run `npm run validate:backend-test-classification` for the reflection, package, filter, and negative-fixture contract defined by [GP-11](gp-11-integration-test-classification.md). `dotnet test services/api/Proprium.sln` remains a separate backend gate; Docker supplies an additional SDK qualification path rather than being required for formatting, compilation, architecture validation, or classification validation.

## Enforcement policy

Required checks fail closed. Suppressions must be localized and justified with a removal condition. Mechanical enforcement precedes review: compiler, analyzer, architecture test, repository validator, then code review.

## Transitional scope

The repository validator governs repository configuration, `.github`, `docs`, `apps/web`, `services/api`, and `services/platform-api`. Older application surfaces are brought under the same validator as they are migrated; they are not silently rewritten by this Day 5 increment.
