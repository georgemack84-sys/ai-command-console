# Headline Flow 2.0 Phase H — Briefing Intelligence

## Summary

Phase H makes each story package carry visible briefing intelligence instead of relying on a generic topic explanation.

## Changes

- Added a bounded `briefingScore` to each story package.
- Added `prioritySignals` such as impact terms, source convergence, authority source, article media, and developing-story monitoring.
- Added server-generated `whyItMatters` copy based on the story's topic, confidence, and source convergence.
- Updated the hero and story drawer to show the priority score and signals.
- Replaced the older client-side topic-only explanation with package-level briefing intelligence when available.
- Hardened Headline Flow Playwright coverage so persistent event preferences do not make fixture acceptance tests brittle.

## Verification

- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow`
- `npm run typecheck`
- `npx eslint src/components/headline-flow src/server/headline-flow app/api/headline-flow tests/unit/headline-flow playwright/headline-flow.spec.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`

## Remaining Follow-Up

- Calibrate briefing score weights with production usage data.
- Add user preference weighting so saved topics and dismissed events influence future ordering.
- Add an explanation audit panel if the scoring model becomes more complex.
