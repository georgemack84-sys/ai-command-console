# GP-24 UI foundation qualification record

## Scope

This record qualifies GP-19 tokens/themes/Storybook, GP-20 primitives, GP-21
responsive shell, GP-22 overlays, and GP-23 route states as one Week 2 foundation.

## Candidate environment

- Date: 2026-08-14
- Platform: Windows, PowerShell
- Node.js: 24.13.1
- npm: 11.8.0
- Revision: the GP-24 commit identified in Git at completion
- Clean restoration: root `npm ci` and `apps/web` `npm ci` passed

## Executed evidence

| Gate                                | Result                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Clean restore                       | Root `npm ci` installed 788 packages; frontend `npm ci` installed 610 packages from their lockfiles                      |
| `npm run repo -- validate week-2`   | Passed the aggregate policy and five controlled failures                                                                 |
| `npm run repo -- validate frontend` | Passed GP-19 through GP-24, lint, typecheck, architecture, 19 theme tests, and 78 covered tests                           |
| `npm run repo -- build frontend`    | Passed with explicit public configuration; five static pages and three dynamic routes were emitted                       |
| `npm run repo -- build storybook`   | Passed with 29 static stories; vendor Axe chunk warning remains registered as `W2-SB-001`                                |
| `npm run test:storybook`            | 25/25 keyboard, responsive, theme, Axe, cleanup, and console scenarios passed                                            |
| `npm run test:browser`              | Passed 21 application-shell, authentication, responsive, and Axe assertions                                              |
| `npm run test:config-build-failure` | Invalid public configuration failed closed as required                                                                   |
| `npm run test:repository-commands`  | 22/22 canonical command and PowerShell adapter tests passed                                                              |
| `npm run repo -- validate repo`     | Repository, documentation, frozen baseline, CI contract, and secret policies passed                                      |

Command results are recorded in the GP-24 completion report. GitHub Actions on
the published commit remains the authoritative remote evidence.

No PostgreSQL, Redis, or Docker service was started. The first sandboxed
Storybook build and browser attempt could not clean up Windows child processes;
unrestricted reruns used the same commands and passed. A diagnostic direct
Next.js build inherited a non-production `NODE_ENV`; the canonical repository
build set `NODE_ENV=production` and passed.

## Result

`BLOCKED`: automated qualification is required to be green, but the expired
`W2-A11Y-002` human screen-reader/native-zoom/visual attestation prevents the
Week 2 exit gate from closing.
