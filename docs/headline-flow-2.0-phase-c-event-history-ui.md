# Headline Flow 2.0 Phase C: Event History Surface

## Status

Phase C exposes durable event history to the product surface. The briefing remains article-first, but users can now inspect the continuity behind a story package.

## What It Adds

- Authenticated event detail endpoint at `/api/headline-flow/events/[eventId]`.
- Workspace-scoped event lookup through the event registry repository.
- Event route tests for authenticated access, anonymous access, and missing workspace events.
- Headline Flow drawer support for event-history loading.
- A Timeline tab showing event status, version, article evidence count, first detection, last meaningful update, and evidence entries.
- Feed diagnostics now appear in the drawer as registry status and event create/update counts.

## Product Meaning

Headline Flow is no longer only a momentary feed. Each package can now point back to a durable event trail, which is the base for 2.0 behaviors like story evolution, update detection, resolved-event handling, and user memory.

## Phase D Recommendation

Improve the event model from source-level evidence to canonical article-level evidence:

- Preserve canonical article URL, provider id, author, image URL, retrieved timestamp, and fingerprint in registry evidence.
- Add story-to-event delta classification: new evidence, changed lead angle, source corroboration, duplicate, stale.
- Surface event update reasons in the Timeline tab.
- Expand Playwright coverage across mobile and live-provider states.

## Local Verification

- Headline Flow unit suite passed.
- Scoped lint passed for Headline Flow server, client, route, test, and Playwright files.
- Typecheck passed.
- Headline Flow Playwright desktop acceptance passed, including opening the Timeline drawer.
- Local smoke test confirmed `/api/headline-flow/events/[eventId]` returns durable event evidence for a feed story.
