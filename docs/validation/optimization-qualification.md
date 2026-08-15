# Optimization qualification

Date: 2026-08-15

## Scope

This pass optimized repository feedback time and frontend runtime boundaries
without weakening formatting, static-analysis, architecture, accessibility,
authentication, or backend security contracts. Measurements are local Windows
observations from the isolated `codex/optimization` worktree. Absolute timings
vary with filesystem and process caches; process counts and emitted route
boundaries are the stable comparisons.

## Validation pipeline

| Target                        |                                                     Before |                                   After | Preserved contract                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------: | --------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static-analysis fixtures      | 2 type-aware ESLint launches; 130.54 s initial observation | 1 launch; 11.94 s follow-up observation | Clean fixture has zero diagnostics; invalid fixture reports every required rule; lint remains non-mutating; TypeScript negative fixture remains separate |
| Architecture failing fixtures |                    14 dependency-cruiser launches; 23.90 s |               1 graph traversal; 3.45 s | Every fixture is matched to its exact source path and named violation                                                                                    |
| Aggregate architecture gate   |                                40.27 s initial observation |           12.37 s follow-up observation | Production graph, passing fixtures, and all failing fixtures remain mandatory                                                                            |

The complete frontend command passed after both runner changes in 153.15 s.
The aggregate result included 105 production modules, 242 dependencies, 21
test files, and 88 passing tests with the existing coverage thresholds.

## Frontend runtime boundary

Authentication was previously mounted in the root client provider. As a result,
authentication-independent routes such as `/health` inherited authentication
client code and initiated current-user resolution.

`AuthenticationProvider` is now mounted only in the public-login and protected
route groups. `ThemeProvider` remains global. In the production build's route
client-reference manifest, the root layout entry changed from two emitted
chunks totaling approximately 289.2 KiB to one emitted chunk of approximately
20.1 KiB, measured before compression. Chunk hashes are intentionally omitted
because they are build-specific.

The authentication qualification now requires both route-group providers,
rejects a root-wide authentication provider, and exercises nine controlled
failures. The production build and all 29 application-browser assertions passed.

## Backend and authentication review

No speculative backend change was admitted. The reviewed hot paths already use:

- unique indexes for normalized usernames and session token hashes;
- no-tracking session and authorization reads;
- a security-versioned permission cache with a bounded 60-second lifetime;
- PostgreSQL session and user state as the authority on every authenticated
  request; and
- bounded Redis and in-memory login-rate-limit behavior.

Combining authorization queries or parallelizing rate-limit increments would
change security semantics without production load evidence. Those changes are
therefore deferred until tracing identifies a measurable bottleneck.

## Qualification evidence

| Command                                                               | Result                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------- |
| `npm run repo -- validate frontend`                                   | PASS                                                 |
| `npm run repo -- validate repo`                                       | PASS                                                 |
| `npm run repo -- validate backend`                                    | PASS; Release build produced 0 warnings and 0 errors |
| `npm run backend:test:unit`                                           | PASS; 64 tests                                       |
| `npm run build` from `apps/web` with canonical production environment | PASS                                                 |
| `npm run test:browser` from `apps/web`                                | PASS; 29 assertions                                  |
| `npm run storybook:build` from `apps/web`                             | PASS with tracked `W2-SB-001` vendor warning         |
| `npm run test:storybook` from `apps/web`                              | PASS; 29 tests                                       |

The Storybook manager build required normal host filesystem access for its
generated cache, matching the already documented local-tooling limitation. No
generated cache or Next.js development configuration drift is included in the
change set.

## Closure

The optimization scope is complete for the current qualified architecture.
Further backend query consolidation, cache expansion, or client code splitting
requires production telemetry or a new feature-level bundle regression. CI
remains the authoritative post-push Linux and integration qualification.
