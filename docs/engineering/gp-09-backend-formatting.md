# GP-09 Backend Formatting and `dotnet format`

**Version:** 1.0
**Status:** Implemented

## Purpose and ownership

GP-09 makes backend formatting a deterministic repository invariant. The SDK-bundled `dotnet format` command owns C# whitespace and the small set of approved code-style transformations. GP-08 remains authoritative for language, type, nullable, and correctness-analyzer diagnostics; GP-10 will own dependency architecture and GP-11 integration-test classification.

The formatter requires no separate global tool. `global.json` selects the .NET `8.0.400` feature band with patch-only roll-forward; the implementation was qualified with SDK `8.0.424` and its bundled formatter `8.3.731007`. The canonical target is always `services/api/Proprium.sln`, covering production, contract, architecture-test, and integration-test projects.

## Canonical policy

The root `.editorconfig` is the only backend formatting policy. C# and C# script files use UTF-8, LF in the Git-normalized repository, a final newline, spaces, 4-space indentation, and a 4-column tab width. The policy explicitly uses conventional .NET indentation and Allman braces for multi-line constructs, places `else`, `catch`, and `finally` on new lines, preserves deliberate single-line blocks/statements to avoid arbitrary expansion, and retains the established error-level requirements for accessibility modifiers and file-scoped namespaces.

The canonical formatter runs two bounded passes:

1. `dotnet format whitespace` applies or verifies layout controlled by `.editorconfig`.
2. `dotnet format style --severity error` applies or verifies only approved error-level style diagnostics.

It does not run `dotnet format analyzers` and does not apply suggestion- or warning-level style changes. This prevents a formatting command from rewriting correctness logic, public APIs, nullable contracts, resource ownership, or other GP-08 concerns.

## Commands

Restore once when dependencies are not available locally:

```bash
dotnet restore services/api/Proprium.sln
```

From the repository root, apply formatting with:

```bash
npm run backend:format
```

Verify formatting without modifying files with:

```bash
npm run backend:format:check
```

Both commands use `scripts/run-backend-format.cjs`, which resolves the solution from the script location instead of relying on an arbitrary current directory. They pass `--no-restore`; package restore remains an explicit, separable step. A formatter execution error or formatting drift returns non-zero and preserves normal `dotnet format` file and diagnostic output.

Run the formatter contract with:

```bash
npm run backend:format:verify
```

The verifier creates an ignored disposable SDK project under the repository, writes deliberately malformed C#, and proves that check mode fails without mutation, write mode corrects it, clean verification passes without mutation, and a second write is idempotent. The fixture is removed in all outcomes and never participates in the backend solution.

## Generated code and migrations

SDK and source-generator output under `obj` remains formatter-excluded by default because the canonical commands do not pass `--include-generated`. That output is tool-owned and must not be edited manually.

Source-controlled EF migration files, designer companions, and model snapshots remain included. The initial audit showed formatting is stable for them: full solution verification loaded all seven projects and would change 0 of 112 files. Excluding source-controlled migrations would create a permanent formatting blind spot, while including them currently causes no regeneration churn. If a future generator begins producing unstable output, any exception must identify the exact generated path and evidence rather than excluding the infrastructure project broadly.

## Failure and remediation

Future CI must run check mode only. When verification fails, run `npm run backend:format`, inspect the formatter-only diff for semantic neutrality, then rerun check mode and the GP-08 compiler validation. IDE format-on-save is optional convenience and is never authoritative.

Formatting exceptions are not part of this baseline. Handwritten source, tests, architecture tests, and integration tests follow the same policy. A future exception must be narrow, generator- or syntax-driven, documented with an owner and removal condition, and must not weaken compiler/analyzer enforcement.

## Audit result

The pre-implementation solution was already formatter-clean, so GP-09 introduces no bulk source rewrite and no application behavior change. After making whitespace and newline conventions explicit, both canonical passes still produce no backend diff. Formatting and verification are static operations and require no PostgreSQL, Redis, Docker daemon, running API, environment file, or real secret.
