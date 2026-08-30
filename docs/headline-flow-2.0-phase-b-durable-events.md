# Headline Flow 2.0 Phase B: Durable Event Registry

## Status

Phase B adds durable event storage and wires the feed pipeline to map story packages onto stable event ids.

## What It Adds

- Prisma-backed `HeadlineFlowEvent` and `HeadlineFlowEventEvidence` tables.
- Additive migration: `202608290001_headline_flow_event_registry`.
- A Prisma repository implementing the Phase A event-registry interface.
- Optional feed pipeline registry ingestion that replaces temporary story event ids with durable `hfe_` ids.
- Feed diagnostics for event registry status, mapped stories, created events, updated events, unchanged events, and persistence errors.
- A short timeout guard so current headlines still load if registry persistence is unavailable.

## Local Verification

- Prisma client generation completed after stopping the Next dev server that was locking the Windows query engine DLL.
- The migration was applied to the configured local PostgreSQL database.
- Authenticated feed smoke test returned a durable `hfe_` event id and `eventRegistry.status: updated`.

## Phase C Recommendation

Expose event history in the product UI:

- Add an authenticated event-detail endpoint.
- Add event timeline and evidence-delta panels to Headline Flow.
- Let users distinguish new, updated, developing, and resolved event states.
- Add route and Playwright coverage for repeated refreshes showing continuity instead of isolated story cards.
