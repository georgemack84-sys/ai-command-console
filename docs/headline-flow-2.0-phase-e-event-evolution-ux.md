# Headline Flow 2.0 Phase E: Event Evolution UX

## Status

Phase E makes event evolution visible in the briefing experience. Story packages now carry event metadata, and the UI explains what changed without requiring the user to open the full timeline first.

## What It Adds

- Event-level update summary.
- Event-level update reasons.
- Dormant event resolution after the active event window, defaulting to 48 hours.
- Feed package `eventMetadata` containing event status, version, update reasons, and update summary.
- Feed diagnostics include resolved event counts.
- A main-story "What changed" strip.
- Timeline fallback continuity if a cached story references an unavailable event.
- Repository retry behavior for deterministic event-id races during overlapping feed refreshes.
- Desktop and mobile Playwright coverage for the Headline Flow flow.

## Local Verification

- Headline Flow unit suite passed.
- Scoped lint passed.
- Typecheck passed.
- Prisma schema validation passed.
- Migration deploy passed locally.
- Prisma client generation passed.
- API smoke test confirmed feed stories include event metadata.
- Desktop and mobile Headline Flow Playwright acceptance passed.

## Next Recommendation

Phase F should make event continuity actionable:

- Add a compact event-history queue view.
- Add user controls for marking events saved, resolved, or muted.
- Add feed-level "changed since last briefing" grouping.
- Add tests for concurrent live-provider refreshes and event-resolution behavior over time.
