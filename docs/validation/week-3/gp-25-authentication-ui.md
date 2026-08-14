# GP-25 authentication UI validation record

## Candidate

- Base: GP-24 commit `4c3750ba51ee1dd533d29e01a9c046e464cf66e3`
- Platform: Windows / PowerShell
- Qualification: `FOUNDATION_COMPATIBLE`
- Revision: the GP-25 commit reported by Git at completion

## Executed evidence

| Domain                           | Result | Command/evidence                                                                                                                                                   |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Focused policy                   | PASS   | `npm run validate:authentication-ui`; 16 required artifacts and seven controlled failures                                                                          |
| Unit and architecture            | PASS   | `npm run repo -- validate frontend`; 104 modules, 239 dependencies, 21 test files, and 87 tests                                                                    |
| Week 2 regression                | PASS   | GP-19 through GP-24 gates inherited by frontend validation                                                                                                         |
| Browser                          | PASS   | `npm run test:browser`; 29 direct-access, no-flash, login-outcome, refresh, logout, Back, responsiveness, scaling, and Axe assertions                              |
| Live browser                     | PASS   | `npm run test:browser:live-auth`; 13 assertions with no intercepted requests against the real API, PostgreSQL, and Redis                                           |
| Backend authentication           | PASS   | Focused `AuthenticationApiIntegrationTests`; 21 of 21 tests against the isolated PostgreSQL and Redis services                                                     |
| Persistence                      | PASS   | The live browser created an authoritative session row; logout set `RevokedAtUtc`; replay of the captured opaque cookie returned to login without protected content |
| Catalog                          | PASS   | `npm run repo -- build storybook` and `npm run test:storybook`; 35 stories and 29 Storybook tests                                                                  |
| Production                       | PASS   | `npm run repo -- build frontend` with explicit public environment                                                                                                  |
| Invalid production configuration | PASS   | `npm run test:config-build-failure`; invalid public configuration prevented the build                                                                              |
| Repository                       | PASS   | `npm run repo -- validate repo` and `npm run test:repository-commands`; 23 command tests                                                                           |

## Controlled failures

- Boolean-only session authority is rejected.
- Browser-storage authentication authority is rejected.
- Structurally unvalidated return paths are rejected.
- Raw backend error rendering is rejected.
- Missing invalid-session no-flash browser evidence is rejected.
- Authentication transport interception in the live suite is rejected.
- Omission of the non-production cookie contract is rejected.

## Live qualification

The live run used isolated `proprium_gp25_live` PostgreSQL and Redis services on
host ports `55435` and `56381`, a locally hosted development API on `8080`, and
the frontend on `3100`. The API readiness endpoint returned `200`. The browser
received a real non-production `proprium_session` cookie with HttpOnly,
SameSite=Lax, and path `/`; no authentication data appeared in browser storage.
Invalid login returned `401`, valid login and logout returned `204`, refresh
resolved the persisted current user, and replay after logout was rejected.

This run exposed and corrected the proxy's production-only cookie-name
assumption. The fixed frontend mirrors the backend's production/non-production
cookie selection while retaining authoritative `/me` resolution. No GP-25
environment limitation remains.

Week 2 remains conditionally qualified for its separately recorded human
accessibility attestation; GP-25 does not silently resolve that exception.
