# GP-07 Frontend Architecture and Dependency Boundaries

**Version:** 1.0
**Status:** Implemented

## Purpose and ownership

GP-07 turns the frontend dependency graph into fail-closed repository policy. Prettier owns formatting, ESLint owns source-level static analysis, TypeScript owns type correctness, dependency-cruiser owns relationships between modules, and Knip owns unused-file and unused-export detection. The checks are static, non-mutating, and require no running application, database, cache, Docker daemon, environment file, or secret.

The canonical configuration is `apps/web/.dependency-cruiser.cjs`. The locally installed and lockfile-controlled dependency-cruiser version is `16.10.4`. `apps/web/scripts/run-dependency-cruiser.mjs` resolves that exact local CLI and normalizes its working environment, so no global installation is required. Resolution consumes the canonical frontend `tsconfig.json`, including the `@/*` alias, rather than maintaining a second alias map.

The canonical dead-code configuration is `apps/web/knip.json`, backed by the
lockfile-controlled Knip version. Its source project is production TypeScript;
framework configuration, repository scripts, type-contract checks, and
architecture fixtures are explicit executable entry points. This preserves
negative-test targets without hiding production files from analysis.

## Audited layer model

The repository does not currently have a generic `features/`, `shared/`, `hooks/`, or `services/` tree. GP-07 therefore enforces the structure that exists instead of reorganizing application code.

| Layer | Current paths | Responsibility |
| --- | --- | --- |
| Routes and application composition | `src/app` | Next.js routes, layouts, route states, metadata, and top-level composition |
| Application shell | `src/shell` | Navigation shell, layout composition, and shell-owned state |
| Providers | `src/providers` | Application context and provider composition |
| Capability components | `src/components` | Auth, authorization, and other cohesive user-facing components |
| Libraries and infrastructure adapters | `src/lib` | Domain helpers, authentication/authorization logic, and API clients |
| Shared UI | `src/ui` | Generic components and foundations that do not know application capabilities |
| Configuration | `src/config` | Validated, browser-safe public configuration |
| Foundations | `src/theme`, `src/state`, `src/types` | Low-level tokens, generic state contracts, and types |
| Development support | `src/test`, `src/testing`, `tests`, stories, scripts, `.storybook` | Test, fixture, Storybook, and tooling-only code |

`src/generated` is tool-owned and is not an analysis root. Generated contracts that production modules intentionally import still appear in the traversed graph. Build output, coverage, dependencies, and Storybook output are likewise outside the source roots.

## Dependency direction

Dependencies flow from composition toward foundations. The enforced matrix is:

| From | May depend on | Must not depend on |
| --- | --- | --- |
| Routes/app | Shell, providers, capability components, libraries, shared UI, config, and foundations | Test, story, or tooling code |
| Shell | Capability components, libraries, shared UI, config, and foundations | Routes/app or providers |
| Providers | Libraries, shared UI, config, and foundations | Routes/app, shell, or capability components |
| Capability components | Libraries, shared UI, config, and foundations | Routes/app, shell, or providers |
| Libraries | Config and foundations, including generated API contracts | Routes/app, shell, providers, capability components, shared UI, or test support |
| Shared UI | Theme and generic types | Routes/app, shell, providers, capabilities, libraries, config, state, or test support |
| Theme | Theme-owned modules and types | Higher application layers |
| Config | Config-owned modules and types | Application, presentation, or library layers |
| State/types | Same-layer foundations | Higher application layers |
| Tests and stories | Production source | Not applicable; these are consumers |
| Production source | Production source allowed by the rows above | Tests, stories, Storybook configuration, or tooling scripts |

All layers are also subject to unresolved-import and circular-dependency failures. Type-only imports count because they still express architectural coupling. Boundary rules operate on resolved modules, so the same prohibited edge fails when written with the `@/*` alias, a relative path, or a dynamic `import()`.

Story modules are development consumers, so they may compose providers and configuration around the component under test. This exception applies to story files as consumers; production modules remain unable to import stories or Storybook tooling.

## Feature public APIs

Capability ownership currently spans `src/components/<capability>` and `src/lib/<capability>`; GP-07 does not disguise that established split as a new feature architecture. If `src/features/<name>` is introduced later, its public entry point is `src/features/<name>/index.ts` (or `.tsx`). Code outside that feature must use the public entry point and must not deep-import implementation files. Cross-feature collaboration must use a public API, a shared contract, or app-level composition. Feature-specific cross-feature rules must be added with the first real feature rather than relying on broad exceptions.

A public barrel is deliberate and minimal. It must not export every internal module, create a cycle, or mix incompatible server and client surfaces solely to make an import legal.

## Configuration and server boundaries

`src/config/environment.ts` is the approved frontend environment boundary. GP-06's ESLint policy prohibits direct `process.env` access elsewhere, while GP-07 keeps configuration at the bottom of the dependency graph. Consumers import resolved configuration instead of reading the environment directly.

The frontend currently has no server-secret configuration module. If one is added, it belongs at `src/config/server.ts` or under `src/config/server/`, must import Next.js's `server-only` marker, and must never be imported by components, providers, shell, or shared UI. The dependency rule reserves that directory boundary now. Dependency-cruiser can enforce paths and transitive imports; it cannot reliably infer every runtime server/client distinction from arbitrary Next.js source, so GP-07 makes no broader claim.

## Commands and diagnostics

Run commands from `apps/web`:

```bash
npm run architecture
```

This canonical command analyzes production source, verifies the allowed-dependency fixture matrix, and runs every prohibited dependency fixture in isolation. A violation exits non-zero and reports the source, target, and readable rule name. The component commands are:

```bash
npm run architecture:check
npm run architecture:fixtures:passing
npm run architecture:fixtures:failing
npm run deadcode
npm run deadcode:verify
```

`npm run validate` includes formatting verification, zero-warning linting, strict type checking, dead-code enforcement, architecture validation, and frontend tests. Invalid fixtures live under `tests/architecture/fixtures/failing`, outside normal source validation, and each fixture must fail for its expected named rule. The passing fixtures prove representative legal directions. The disposable dead-code verifier proves that an unreachable file and an unconsumed export both fail without modifying source.

## Exceptions and changes

There are no dependency-direction exceptions in the GP-07 baseline. A future exception must identify an exact source pattern, exact target pattern, reason, owner, and removal condition. Broad ignores of a layer, all feature-to-feature imports, and advisory-only warnings are prohibited.

Unused function parameters and caught errors may be prefixed with `_` when their
signature or callback contract requires them. Ordinary variables, imports, and
destructured values receive no underscore exemption. Unused exports are removed
unless they are stable consumer-facing contracts; such contracts require a
focused `@public` annotation and supporting API documentation. Generated code,
framework discovery, and executable repository fixtures are modeled explicitly
rather than covered by blanket source-tree ignores.

The enablement audit found no production violation requiring remediation. GP-07 changes enforcement, fixtures, commands, and documentation only; it does not redesign routes, authentication, state ownership, API clients, or user-visible behavior. Any future violation that requires those changes is an architecture decision and must not be hidden inside an allow list.
