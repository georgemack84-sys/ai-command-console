# Headline Flow 2.0 Phase K — Interaction Analytics

## Summary

Phase K adds a lightweight feedback loop for Headline Flow without storing raw browsing history or broad user telemetry.

## Changes

- Added `HeadlineFlowInteractionEvent` persistence for scoped Headline Flow interactions.
- Added `GET /api/headline-flow/interactions` for aggregate interaction summaries.
- Added `POST /api/headline-flow/interactions` for narrow action recording.
- Recorded key product interactions:
  - story opened
  - next story
  - previous story
  - topic filter selected
  - source opened
  - saved, unsaved, muted, unmuted, resolved, and restored events
- Added aggregate diagnostics:
  - total tracked actions
  - source open rate
  - saved topic counts
  - muted topic counts
- Kept analytics event IDs as soft links so telemetry does not fail when an event is transient, hidden, resolved, or later deleted.
- Surfaced interaction analytics in the story diagnostics drawer.
- Added unit coverage for the repository and API route.
- Added Playwright coverage for the Interaction Analytics diagnostics panel.
- Removed stale `.next-production` generated types from regular TypeScript checking so local typecheck is not blocked by old production build artifacts.

## Privacy Boundary

The interaction log records only Headline Flow product actions and associated story/event metadata. It does not store raw browsing history, full article content, passwords, private user files, or external page activity.

## Verification

- `npx prisma validate`
- `npx prisma migrate deploy`
- `npx prisma generate`
- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts`
- `npx eslint playwright/headline-flow.spec.ts src/components/headline-flow app/api/headline-flow src/server/headline-flow tests/unit/headline-flow tests/unit/health-routes.test.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`

## Remaining Follow-Up

- Add retention controls for interaction events.
- Add trend windows, such as 24-hour and 7-day summaries.
- Use aggregate interaction signals to calibrate ranking weights once enough usage data exists.
