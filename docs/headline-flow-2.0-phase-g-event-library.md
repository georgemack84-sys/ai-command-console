# Headline Flow 2.0 Phase G — Event Library

## Summary

Phase G unifies saved-story behavior around server-backed event preferences and adds a management surface for saved, muted, and resolved events.

## Changes

- Replaced browser-local saved story state with `HeadlineFlowEventPreference` state from the feed and event action APIs.
- Added `GET /api/headline-flow/events/preferences` to return the authenticated user's saved, muted, and resolved event preferences joined to workspace event records.
- Added `listUserPreferences` to the event preference repository.
- Updated the feed cache key to include the authenticated user and current preference revision, preventing stale cached feeds from masking save, mute, resolve, unmute, or restore changes.
- Added an Event Library panel under the Saved rail with Saved, Muted, and Resolved filters plus inline preference actions.
- Updated Headline Flow acceptance coverage to verify the Event Library controls on desktop and mobile.

## Verification

- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow`
- `npm run typecheck`
- `npx eslint playwright/headline-flow.spec.ts src/components/headline-flow app/api/headline-flow src/server/headline-flow tests/unit/headline-flow`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium`

## Remaining Follow-Up

- Add a richer full-screen library mode once the event library grows beyond the right rail.
- Consider reducing duplicate preference lookups in feed construction if provider latency becomes a bottleneck.
