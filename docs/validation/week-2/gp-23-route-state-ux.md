# GP-23 Route-State UX Qualification

Qualification requires the route-state policy and its five controlled failures,
strict TypeScript, lint, dependency architecture, unit behavior, browser-backed
Storybook keyboard and Axe coverage, responsive 320px validation, production
Storybook and Next.js builds, repository validation, and the complete
infrastructure-independent frontend gate.

Automated evidence covers one polite loading announcement, decorative skeletons,
no loading focus theft, terminal-state context focus, safe generic error copy,
single user-driven reset invocation, internal recovery links, root/protected main
ownership, long-copy wrapping, theme selection, reduced motion, and serious or
critical Axe violations.

Controlled fixtures reject raw exception exposure, duplicate protected main
landmarks, loading focus theft, full reload as nested recovery, and missing
not-found story coverage. Runtime failure and not-found probes must be temporary
or test-only and removed before commit.

Foundation classification: `FOUNDATION_COMPATIBLE`.

## Qualification evidence

| Command | Result |
| --- | --- |
| `npm run validate:route-states` | PASS; 15 required artifacts and five rejected controlled failures |
| `npm run validate:frontend` | PASS; 19 Vitest files and 78 tests, including 100% route-state line coverage |
| `npm run storybook:build` | PASS; six route-state stories included |
| `npm run test:storybook` | PASS; 21 total Playwright tests, including five route-state keyboard/responsive/theme/Axe checks |
| `npm run test:browser` | PASS; 21 application shell and authentication regression assertions |
| `npm run repo -- build frontend` | PASS; clean production Next.js build with the canonical `_not-found` route |
| `npm run test:repository-commands` | PASS; 21 dispatcher and PowerShell tests |
| `npm run repo -- validate repo` | PASS; repository, documentation, baseline, and CI contracts |

A temporary, untracked-at-commit production probe exercised an actual loading
boundary, synthetic secret-bearing thrown error, one-click reset recovery, explicit
`notFound()`, terminal focus, and 320px overflow. All scenarios passed. The probe
routes, probe script, and stale generated development types were removed before the
clean production build and final diff audit.
