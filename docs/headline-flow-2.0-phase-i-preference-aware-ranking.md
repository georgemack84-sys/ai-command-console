# Headline Flow 2.0 Phase I — Preference-Aware Ranking

## Summary

Phase I resolves the Phase H caveat by making briefing ranking respond to server-backed user preferences.

## Changes

- Added a preference profile input to feed construction.
- Built the profile from saved event history in `GET /api/headline-flow/feed`.
- Boosted stories whose topics match saved event topics.
- Boosted a currently surfaced event when the user has saved that exact event.
- Applied preference-aware ranking before final feed trimming so personalization can affect story order.
- Added `personalizationReason` to story display metadata.
- Surfaced personalization explanations in the hero and story detail drawer.
- Kept muted and resolved events hidden from the active feed while saved-topic affinity still improves future ordering.

## Verification

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts`
- `npx eslint src/components/headline-flow src/server/headline-flow app/api/headline-flow tests/unit/headline-flow tests/unit/health-routes.test.ts playwright/headline-flow.spec.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`

## Notes

- The scoring model is still intentionally lightweight and explainable.
- Future calibration should use real interaction analytics once the app has enough usage data.
