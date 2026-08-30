# Headline Flow 2.0-A RC5

Date: 2026-08-30

## Status

Headline Flow 2.0-A RC5 is the next stabilization checkpoint after the RC4 package gate. It preserves the accepted 2.0-A event-registry surface and adds the final local-demo and branded-entry fixes needed for operator review.

## Included Since RC4

- `/headline-flow` redirects unauthenticated users to `/auth?next=%2Fheadline-flow`.
- The auth page presents Headline Flow copy and returns to the requested Headline Flow destination after login.
- The local demo button opens Headline Flow directly instead of the AI Command Console home shell.
- Local Headline Flow startup defaults to automatic provider selection.
- Fixture topic visuals use bundled assets so local demos do not depend on remote image optimization.
- Development readiness treats missing background workers as warnings instead of blocking the Headline Flow demo.
- Browser-test configuration isolates temporary worktrees, uses deterministic fixture news, disables rate limiting, and unoptimizes images for local Playwright runs.

## Verified Locally

The following checks passed on 2026-08-30:

- `npm run typecheck`
- `npm run test:headline-flow`
- `npx playwright test playwright/public-routes.spec.ts --project=desktop-chromium --grep "headline flow auth gate|auth page shows"`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`
- `npx eslint playwright.config.ts`
- `npm run build`

## Required Remote Verification

- GitHub manual staging workflow from tag `headline-flow-2.0-a-rc5`

## Release Caveat

RC5 can validate packaging in artifact-only staging. A full production-maturity signoff still requires a real staging host deployment with `DEPLOY_ARTIFACT_ONLY` disabled, SSH credentials configured, and post-deploy smoke checks enabled.
