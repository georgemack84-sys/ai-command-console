# Headline Flow 2.0 Phase L - Analytics Retention and Calibration Windows

## Summary

Phase L turns interaction analytics into an operationally bounded signal. Headline Flow now prunes old interaction rows according to a configurable retention window and reports interaction summaries across 24-hour, 7-day, and retained all-time calibration windows.

## Changes

- Added `HEADLINE_FLOW_INTERACTION_RETENTION_DAYS` with a default of 90 days and a 365-day cap.
- Added interaction-event pruning and windowed summaries in the analytics repository.
- Updated `/api/headline-flow/interactions` so both `GET` and `POST` return windowed summaries.
- Updated the diagnostics drawer with `24h`, `7d`, and `all` analytics controls plus retention visibility.
- Expanded unit coverage for retention pruning, windowed summaries, and route response shape.
- Expanded Playwright coverage for the diagnostics analytics controls.

## Verification

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts`
- `npx eslint src/config/env.ts src/components/headline-flow/headline-flow-client.tsx src/server/headline-flow/analytics/interaction-events.ts app/api/headline-flow/interactions/route.ts tests/unit/headline-flow/interaction-events.test.ts tests/unit/headline-flow/interactions-route.test.ts playwright/headline-flow.spec.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`
