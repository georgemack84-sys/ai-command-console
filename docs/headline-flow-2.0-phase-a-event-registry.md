# Headline Flow 2.0 Phase A: Event Registry Foundation

## Status

Phase A now has a tested event-registry domain layer. It can ingest current `StoryPackage` records, create stable event records, attach source evidence, and merge related updates into the same event without changing the current Headline Flow UI or feed contract.

## What It Adds

- Event records with workspace scope, topic, title, summary, importance, confidence, status, version, timestamps, and evidence.
- Evidence records derived from story package sources.
- Deterministic event ids based on workspace and normalized event match keys.
- Matching by topic plus shared evidence URLs or strong headline token overlap.
- Merge behavior that increments event versions only when story content or evidence changes.
- An in-memory repository for tests and service development.

## Current Boundaries

- This does not persist events to the database yet.
- This does not change the `/headline-flow` UI yet.
- This does not alter provider selection, RSS search behavior, or feed generation.
- Evidence currently comes from story package source trails. Phase B should preserve canonical article-level evidence before package projection.

## Phase B Recommendation

Wire the event registry behind the authenticated feed pipeline with durable storage:

- Add Prisma models or an equivalent repository for `HeadlineFlowEvent` and `HeadlineFlowEventEvidence`.
- Ingest canonical stories before they are projected into story packages.
- Return event ids from the registry as the package `eventId`.
- Expose event history and evidence deltas to the front end.
- Add route tests that prove repeated feed refreshes update existing events instead of creating disconnected packages.
