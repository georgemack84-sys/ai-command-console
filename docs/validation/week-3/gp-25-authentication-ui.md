# GP-25 authentication UI validation record

## Candidate

- Base: GP-24 commit `4c3750ba51ee1dd533d29e01a9c046e464cf66e3`
- Platform: Windows / PowerShell
- Qualification: `FOUNDATION_COMPATIBLE`
- Revision: the GP-25 commit reported by Git at completion

## Executed evidence

| Domain | Result | Command/evidence |
| --- | --- | --- |
| Focused policy | PASS | `npm run validate:authentication-ui`; 15 required artifacts and five controlled failures |
| Unit and architecture | PASS | `npm run repo -- validate frontend`; 104 modules, 239 dependencies, 21 test files, and 86 tests |
| Week 2 regression | PASS | GP-19 through GP-24 gates inherited by frontend validation |
| Browser | PASS | `npm run test:browser`; 29 direct-access, no-flash, login-outcome, refresh, logout, Back, responsiveness, scaling, and Axe assertions |
| Catalog | PASS | `npm run repo -- build storybook` and `npm run test:storybook`; 35 stories and 29 Storybook tests |
| Production | PASS | `npm run repo -- build frontend` with explicit public environment |
| Invalid production configuration | PASS | `npm run test:config-build-failure`; invalid public configuration prevented the build |
| Repository | PASS | `npm run repo -- validate repo` and `npm run test:repository-commands`; 23 command tests |

## Controlled failures

- Boolean-only session authority is rejected.
- Browser-storage authentication authority is rejected.
- Structurally unvalidated return paths are rejected.
- Raw backend error rendering is rejected.
- Missing invalid-session no-flash browser evidence is rejected.

## Qualification boundary

Frontend browser integration uses deterministic network responses and does not
claim a live database-backed credential flow. The inspected backend endpoints and
their existing integration suite are the authoritative server-side contract.
Valid login, invalid login, refresh continuity, logout, invalid-session rejection,
and protected-route no-flash behavior were exercised through the production
frontend using deterministic browser transport responses. A live full-stack
browser session against PostgreSQL and Redis was not executed for this record.
Week 2 remains conditionally qualified for its separately recorded human
accessibility attestation; GP-25 does not silently resolve that exception.
