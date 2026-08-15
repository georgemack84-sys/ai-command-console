# GP-06 Frontend Static Analysis

**Status:** Implemented

## Outcome

GP-06 makes frontend correctness and code-quality rules executable repository policy. It converges the existing Next.js flat ESLint presets and strict TypeScript configuration, adds focused missing enforcement, and leaves dependency-layer direction to GP-07.

## Canonical tools and ownership

`apps/web/eslint.config.mjs` is the only ESLint configuration. ESLint 9.39.4, TypeScript 5.9.3, Next.js's ESLint preset, and the import plugin are exact frontend development dependencies resolved by `apps/web/package-lock.json`; global tools are not required.

The ownership boundary is:

- Prettier owns presentation and formatting;
- ESLint owns TypeScript/React/Next.js correctness and repository code-quality patterns;
- TypeScript owns structural types, strict nullability, implicit-any rejection, return completeness, and unchecked indexed access; and
- GP-07 dependency tooling owns which architectural layer may import another.

ESLint does not enforce quotes, indentation, wrapping, semicolons, or other Prettier concerns. Import ordering is a code-structure policy and therefore belongs to ESLint.

## Enforced policy

`npm run lint` is non-mutating, scans handwritten source, configuration, scripts, tests, and Storybook files, and fails for any warning. It also reports unused or invalid inline configuration. The rules enforce:

- unused imports, variables, parameters, and caught errors, with a leading underscore as the only intentional-unused convention;
- built-in, external, repository-alias, relative, and type-only import groups with blank lines and case-insensitive alphabetical ordering;
- duplicate-import rejection and type-only import syntax;
- React hook location and dependency correctness plus the installed Next.js correctness preset;
- debugger, loose equality, casual source-console usage, explicit `any`, non-null assertions, and shadowing restrictions; and
- type-aware floating/misused-promise and discriminated-switch exhaustiveness checks for compiler-owned `src` files.

Intentional fire-and-forget promises must use `void`. Environment access remains prohibited in source except the validated configuration adapter and controlled test bootstrap. Source console calls may use `warn` or `error` only; scripts retain console diagnostics without introducing a logging framework.

Generated permission output, copied theme bootstrap output, Next/build/test reports, and deliberately invalid GP-07 architecture fixtures are exact exclusions. Ordinary unit, browser, source, configuration, script, and Storybook files remain linted. Exclusions do not hide active source.

## TypeScript contract

`tsconfig.json` retains strict mode, strict null checks, no implicit `any`, no implicit returns, and unchecked-index access. `npm run typecheck` invokes `tsc --noEmit --incremental false`, so validation cannot create JavaScript, declarations, or incremental build metadata. It requires no application build, service, database, container, environment file, or credential.

Type-aware ESLint is intentionally scoped to compiler-owned `src`. Configurations and external test suites still receive ordinary TypeScript, React, Next.js, unused-code, and import checks without pretending they belong to the application compiler project.

## Commands and remediation

Run from `apps/web`:

```text
npm run format:check
npm run lint
npm run typecheck
npm run static-analysis:verify
```

`static-analysis:verify` uses disposable fixtures to prove that clean and intentionally unused source passes while unused imports/variables, duplicate or misordered imports, non-type imports, hook misuse, `debugger`, explicit `any`, floating promises, and TypeScript assignment errors fail with file/rule/compiler diagnostics. It also proves lint does not mutate source.

`npm run lint:fix` is optional local cleanup. After automatic fixes, developers run Prettier and the non-mutating checks. CI and `npm run validate` use only canonical validation commands.

Suppressions must use a line-scoped directive, name one or more specific rules, and include a reason after `--`. File-wide or unexplained disables fail the verifier. A legitimate local exception never justifies weakening a global rule.

## Scope boundary

GP-06 adds no dependency-layer rules, server/client conversions, application behavior changes, Git hooks, CI workflows, backend analyzers, or global tools. Promise and import cleanup is mechanical; changes that alter runtime order or component architecture remain outside lint auto-remediation.
