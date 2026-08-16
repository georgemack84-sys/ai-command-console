# GP-05 Frontend Formatting

**Status:** Implemented

## Outcome

GP-05 makes frontend formatting deterministic, repository-owned, editor-independent, and mechanically verifiable. It converges the existing Prettier installation and commands instead of introducing a second formatter, package manager, configuration hierarchy, or style-oriented ESLint policy.

## Canonical owner and version

`apps/web/.prettierrc.json` is the only Prettier configuration. `prettier` is an exact frontend development dependency and `apps/web/package-lock.json` locks its complete resolution. Contributors and CI run the package scripts; no global installation or editor extension is required.

The configuration deliberately fixes LF line endings, two-space indentation without tabs, single quotes, semicolons, and trailing commas. These settings agree with the repository's GP-01 `.editorconfig` and `.gitattributes`: Git normalizes ordinary source to LF, while Prettier emits LF regardless of the contributor's operating system.

## File ownership

Prettier owns handwritten frontend TypeScript, TSX, JavaScript module variants, JSON configuration other than the lockfile, CSS, and frontend-local Markdown/YAML that its package-root command discovers. It also owns supported Next.js, Storybook, Playwright, Vitest, and package configuration source.

The following are outside Prettier ownership:

- dependencies and build/test output (`node_modules`, `.next`, coverage, distribution/export, Storybook, Playwright-report, and test-result directories);
- `next-env.d.ts` and `package-lock.json`, which are tool-owned;
- `src/generated`, whose permission-catalog generator is authoritative;
- `public/theme-bootstrap.js`, whose checked-in source is copied from `scripts/theme-bootstrap.js`; and
- `.env*` files, whose syntax and confidentiality boundaries belong to GP-02 and GP-04.

These are exact exclusions, not a way to hide handwritten formatting drift. The permission-catalog and theme-bootstrap workflows retain their own freshness/copy checks.

## Commands and behavior

Run from `apps/web`:

```text
npm run format
npm run format:check
npm run format:verify
```

`format` applies Prettier to the package root. `format:check` checks the same ownership boundary, never writes source, identifies drift, and exits non-zero when drift exists. `format:verify` creates disposable fixtures and proves that TypeScript, JavaScript, module variants, JSX, TSX, JSON, Markdown, and both YAML extensions are formatter-owned; misformatted source fails without mutation, write mode corrects it, CRLF becomes LF, and ignored generated output remains untouched. None of these commands loads `.env` files or requires Docker, PostgreSQL, Redis, or another service.

`npm run validate` includes both the ordinary check and the formatter-contract verifier, giving later CI the same entry point used by developers.

## Tool boundaries

Prettier owns presentation: whitespace, indentation, wrapping, quotes, semicolons, commas, and structural layout. ESLint owns correctness and code-quality policy. GP-05 adds no import sorting, Tailwind/package sorting, stylistic ESLint rules, plugins, Git hooks, or IDE requirements. Import ordering and broader static analysis remain GP-06 work.

Formatting of repository-wide documentation, backend code, environment files, and generated artifacts remains with their existing owners. Format-on-save is optional convenience; repository commands are enforcement.
