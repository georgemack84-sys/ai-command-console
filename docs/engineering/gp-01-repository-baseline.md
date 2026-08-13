# GP-01 Repository Baseline

**Status:** Implemented
**Scope:** Phase 1, Week 1, Day 5

## Outcome

GP-01 establishes the repository-level file policy that every later Day 5 gate can reuse. This is a qualification and refinement of an existing repository, not a greenfield setup. The root configuration files are canonical, representative behavior is mechanically validated, and the tracked-file audit found no generated build output or unapproved local environment files.

## Decisions

- Repository text is UTF-8 without a byte-order mark, ends with a newline, and uses LF by default.
- PowerShell scripts and Visual Studio solution files use CRLF in the working tree because the repository already supports those Windows-native tool paths. Shell scripts remain LF.
- Markdown may retain trailing spaces when they are meaningful. Other governed text may not.
- Spaces are the default indentation. C# uses four spaces, web and configuration formats use two, and Makefiles use tabs.
- Root `.gitattributes` owns normalization and binary classification. The currently tracked binary format, `.ico`, and the supported image formats are explicitly binary.
- Root `.gitignore` owns generated output, local configuration, runtime state, editor state, and operating-system files. The former `apps/web/.gitignore` duplicated that ownership and was removed.
- Environment examples and the reviewed frontend Docker/test configurations remain trackable. Their schema, precedence, and startup validation belong to the configuration game plan, not GP-01.
- Existing language-specific formatter, analyzer, and compiler policy is preserved but is not expanded by GP-01.
- GP-01 does not perform repository-wide renormalization. Any future normalization-only change must be isolated so semantic review remains clear.

## Mechanical validation

`npm run validate:repository` fails when:

- a required baseline or existing configuration-governance file is missing;
- representative source, shell, PowerShell, solution, or binary paths resolve to the wrong Git attributes;
- representative build, environment, IDE, test, or coverage output is not ignored;
- a committed environment example or approved harness configuration is accidentally ignored;
- tracked local environment files, generated directories, caches, databases, or build output are found;
- governed text contains a UTF-8 BOM, invalid UTF-8, a missing final newline, or prohibited trailing whitespace; or
- the repository's existing JSON, YAML, Markdown, or configuration checks fail.

The validator inspects secret risk by tracked path only. It does not print or scan the contents of possible secret files.

## Acceptance evidence

Run these commands without Docker, databases, credentials, or running services:

```text
npm run validate:repository

# Supply the same public, non-secret build values as CI.
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Proprium
NEXT_PUBLIC_APP_VERSION=gp-01
NEXT_PUBLIC_API_BASE_URL=https://api.ci.example
NEXT_PUBLIC_ENVIRONMENT=test
npm run build --prefix apps/web

dotnet build services/api/Proprium.sln --configuration Release
git diff --check
```

The environment assignments above describe required process values; use the syntax for the current shell. They are not a request to create or commit a local environment file.

GP-01 does not add a CI workflow. The existing CI repository-consistency step already invokes the same repository-owned validator and can reuse its stronger checks.

## Deferred work

GP-01 does not define environment keys, configuration precedence, ESLint or Prettier rules, TypeScript strictness, .NET analyzer policy, architecture tests, container policy, or new CI orchestration. Those remain owned by their dedicated Day 5 game plans.
