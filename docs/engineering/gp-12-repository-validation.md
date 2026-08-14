# GP-12 Repository Validation

**Version:** 1.0
**Status:** Implemented

## Purpose and ownership

GP-12 establishes `npm run validate:repository` as the fast, canonical repository-structure gate. The implementation is repository-owned Node.js, uses only package-managed dependencies plus Git, performs no writes, and requires no network, Docker, PostgreSQL, Redis, application process, environment file, credential, frontend compiler, or backend compiler.

`scripts/validate-repository.cjs` is the orchestrator. `scripts/repository-validation-policy.cjs` owns reusable pure checks and stable diagnostics. GP-02/GP-03 remain authoritative for configuration inventory, and GP-04 remains authoritative for secret safety; GP-12 invokes those validators instead of copying their rules. Frontend formatting/static analysis/architecture and backend compiler/formatting/architecture/test-classification remain separate gates.

## Governed scope

The validator uses Git's tracked path set as its primary inventory. It governs root repository policy files plus `.github`, `docs`, `apps/web`, `services/api`, and `services/platform-api`. This preserves the deliberate GP-01 transitional boundary: older application surfaces are not silently reformatted or reclassified by GP-12.

Twenty-four critical files must both exist and be tracked. They cover root text/Git policy, all three environment templates, npm manifests and lockfiles, frontend Prettier/ESLint/TypeScript/dependency-architecture configuration, central .NET policy, the backend solution, architecture and integration test projects, and the composed configuration/secret validators. Stable directories are protected through those required owners rather than by requiring empty or incidental folders.

Tracked generated output remains explicit. npm and Next.js artifacts, coverage, backend `bin`/`obj`/`TestResults`, Playwright output, IDE state, OS metadata, SQLite sidecars, TypeScript build info, and user-local project files are prohibited. Intentionally tracked generated artifacts such as `services/api/permissions.json` remain allowed because they have a separate generator/drift contract. GP-12 does not generate OpenAPI or any other artifact.

## Rule registry

| Family | Responsibility |
| --- | --- |
| `RVAL-FILE` | Required tracked files, canonical editor policy, duplicate configuration authority |
| `RVAL-GIT` | Tracked local/generated artifacts, attributes, ignore behavior |
| `RVAL-TEXT` | Encoding, BOM, line endings, final newline, trailing whitespace |
| `RVAL-JSON` | Strict JSON and TypeScript JSON-with-comments syntax |
| `RVAL-YAML` | YAML parsing and deterministic indentation |
| `RVAL-MD` | Balanced fences, heading progression, repository-local links |
| `RVAL-NODE` | Required npm lockfiles, conflicting package managers, Prettier authority |
| `RVAL-DOTNET` | Project-level compiler-policy overrides and backend solution coverage |
| `RVAL-ENV` | Composed configuration-template and ownership validation |
| `RVAL-SECRET` | Composed tracked secret-boundary validation |

Every violation reports a stable rule ID, path, problem, and expected state. Independent problems are aggregated where continued inspection is reliable. Failure to obtain the Git inventory is fatal because later results would be misleading.

JSON validation uses strict parsing for ordinary files and TypeScript's parser for `tsconfig*.json`, preserving valid comments without weakening package or application configuration. YAML uses the repository-managed `js-yaml` parser; GP-12 does not reproduce GitHub Actions or Docker Compose semantics. Markdown checks are intentionally structural and offline: prose style and external URL availability are out of scope.

The package-manager contract is npm at the root and `apps/web`, with both tracked `package-lock.json` files required. pnpm, Yarn, Bun, and npm-shrinkwrap lockfiles fail. Nested `.editorconfig`, `Directory.Build.props`, or `Directory.Build.targets` files fail as conflicting authority; frontend Prettier has one approved config. Every canonical `services/api/Proprium.*/*.csproj` must appear in `Proprium.sln`, and project-local attempts to weaken the GP-08 compiler baseline fail before MSBuild runs.

## Commands

Run the complete gate from the repository root:

```bash
npm run validate:repository
```

The aggregate runs:

- `npm run repository:check` against the actual tracked repository; and
- `npm run repository:fixtures` against isolated in-memory policy fixtures.

Fixtures prove a valid model passes and that missing/untracked critical files, tracked `.env` and build output, malformed strict JSON, malformed YAML, unclosed fences, broken local Markdown links, conflicting lockfiles/configuration, compiler-policy overrides, and projects omitted from the solution fail with the expected rule IDs. GP-02/GP-04 retain their own deeper positive and negative evidence.

## Remediation

Use the rule ID and path before changing policy. Restore or track missing canonical files; remove prohibited paths from Git while retaining ignore coverage; repair malformed structured text; use npm's approved lockfiles; remove project-local compiler overrides; or add a canonical backend project to the solution. Do not suppress a rule to admit local state.

A future exception must identify an exact path or artifact family, its canonical owner, why tracking is required, and a removal condition where temporary. It must update policy, fixtures, and this document together. Broad directory exclusions and CI-only repository rules are prohibited.

## Audit result

The pre-implementation validator already covered the GP-01 baseline, governed text, environment composition, and secret composition. GP-12 consolidated that owner instead of replacing it, added stable aggregate diagnostics and the missing cross-cutting policies, and found no tracked artifact or policy violation requiring repository cleanup. The qualified repository contains 7,040 tracked paths, 24 required files, two canonical npm lockfiles, seven canonical backend projects in the solution, and zero unexplained repository-validation violations.
