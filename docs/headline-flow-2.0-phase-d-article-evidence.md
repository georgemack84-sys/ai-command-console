# Headline Flow 2.0 Phase D: Article-Level Evidence

## Status

Phase D upgrades the event registry from package/source evidence to canonical article evidence. Headline Flow can now preserve the article identity behind each event while keeping the existing briefing feed shape stable.

## What It Adds

- Article-level evidence fields for event history:
  - article id
  - provider id
  - provider article id
  - canonical article URL
  - article fingerprint
  - author
  - image URL
  - retrieved timestamp
  - update reason
- Additive Prisma migration: `202608290002_headline_flow_article_evidence`.
- Follow-up uniqueness migration: `202608290003_headline_flow_evidence_article_uniqueness`.
- Canonical-story ingestion path for the registry.
- Backward-compatible package-source ingestion path for tests and fallback usage.
- Update-reason classification:
  - `new_evidence`
  - `source_corroboration`
  - `lead_angle_changed`
  - `duplicate`
  - `stale`
- Timeline labels for evidence update reasons plus provider, author, and retrieval metadata.
- Timeline fallback continuity when a cached package points to an event that is temporarily unavailable.

## Local Verification

- Prisma schema validation passed.
- Prisma migration deploy passed locally.
- Prisma client generation passed.
- Headline Flow unit suite passed.
- Scoped lint passed.
- Typecheck passed.
- Headline Flow Playwright desktop acceptance passed.
- API smoke test confirmed new evidence includes provider id, article id, fingerprint, retrieved timestamp, and update reason.
- API smoke test confirmed article-level persistence succeeds after removing the overly strict source/package evidence uniqueness rule.

## Next Recommendation

Phase E should make event evolution more legible:

- Store event-level update reason summaries, not only evidence-level labels.
- Add a feed-level “what changed since last refresh” section.
- Add resolved-event rules so older events can leave the active briefing queue cleanly.
- Expand Playwright coverage to mobile and live-provider states.
