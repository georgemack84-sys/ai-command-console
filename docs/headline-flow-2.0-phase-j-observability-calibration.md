# Headline Flow 2.0 Phase J — Observability and Calibration

## Summary

Phase J makes Headline Flow's ranking and personalization decisions inspectable from both the API payload and the UI.

## Changes

- Added per-story ranking audit metadata:
  - base score
  - personalization boost
  - final score
  - original rank
  - personalized rank
- Added feed-level personalization diagnostics:
  - applied/skipped status
  - saved event count
  - active topic weights
  - boosted story count
  - reordered story count
- Surfaced ranking audit details in the story diagnostics drawer.
- Added Playwright coverage for the Ranking Audit diagnostics panel.
- Added unit coverage for preference-aware rank movement and personalization diagnostics.

## Verification

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts`
- `npx eslint src/components/headline-flow src/server/headline-flow app/api/headline-flow tests/unit/headline-flow tests/unit/health-routes.test.ts playwright/headline-flow.spec.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`

## Calibration Notes

- Ranking remains intentionally explainable and bounded.
- Personalized boosts are capped so user affinity can reorder comparable stories without overwhelming breaking or high-confidence public-interest stories.
- The new diagnostics make future tuning measurable before adding heavier analytics or learned ranking.
