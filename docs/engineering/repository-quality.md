# Repository Quality Standards

## Canonical owners

| Gate | Canonical owner |
| --- | --- |
| Frontend formatting | Prettier in `apps/web` |
| Frontend linting and import/dependency rules | ESLint and dependency-cruiser in `apps/web` |
| Type safety | Strict TypeScript compiler settings |
| Backend formatting and analysis | `dotnet format` and centralized .NET analyzers |
| Backend architecture | Architecture test project |
| Repository consistency | `npm run validate:repository` |
| Secret safety | `npm run validate:secrets` |
| CI orchestration | GitHub Actions |

## File rules

Text is UTF-8 without BOM, uses LF, ends with one newline, and has no trailing whitespace unless Markdown rendering requires it. `.gitattributes` owns normalization and defines the documented PowerShell and Visual Studio solution CRLF exceptions. `.editorconfig` owns indentation and editor behavior. The [GP-01 repository baseline](gp-01-repository-baseline.md) records the exact decisions, validation boundary, and deferred work.

## Commands

Run `npm run validate:repository` for required files, resolved Git attributes, representative ignore behavior, tracked-artifact and local-configuration exclusions, Markdown fences/headings/links, YAML indentation, JSON syntax, UTF-8 validation, final-newline checks, trailing-whitespace checks, and configuration validation. The command does not require infrastructure.

Run `npm run validate:secrets` for focused tracked-file, private-key, provider-token, public-configuration, placeholder, configuration-dump, and API exception-logging checks. Candidate values are never printed. The repository validator invokes this command automatically.

Run `npm run format`, `npm run format:check`, and `npm run format:verify` from `apps/web` to apply, check, and exercise the canonical frontend formatting contract. The [GP-05 frontend-formatting specification](gp-05-frontend-formatting.md) defines its file ownership and generated-output exclusions. Run `npm run lint`, `npm run typecheck`, and `npm run static-analysis:verify` for the zero-warning ESLint, strict non-emitting TypeScript, and negative-fixture contracts defined by [GP-06](gp-06-frontend-static-analysis.md). `npm run validate` includes those checks with dependency-cruiser, architecture-fixture rejection, and unit tests. Run `dotnet format services/api/Proprium.sln --verify-no-changes --no-restore` and `dotnet test services/api/Proprium.sln` for the backend; Docker supplies the SDK qualification path when a local SDK is unavailable.

## Enforcement policy

Required checks fail closed. Suppressions must be localized and justified with a removal condition. Mechanical enforcement precedes review: compiler, analyzer, architecture test, repository validator, then code review.

## Transitional scope

The repository validator governs repository configuration, `.github`, `docs`, `apps/web`, `services/api`, and `services/platform-api`. Older application surfaces are brought under the same validator as they are migrated; they are not silently rewritten by this Day 5 increment.
