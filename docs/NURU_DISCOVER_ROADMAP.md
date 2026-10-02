# Nuru Discover Roadmap

## Product outcome

Deliver a responsive, editorial discovery experience modeled on the approved Nuru
Discover concept: a daily, bounded set of explainable recommendations; one
featured discovery; four recommendation lanes; saved items; curiosity paths;
and an evolving user-owned Taste Map.

The product promise is:

> Nuru helps a person discover a richer world while showing why each discovery
> was selected and where its claims came from.

This is not a replacement for Nuru V1. Nuru V1 governs knowledge; Nuru Discover
presents approved knowledge and records user feedback.

## Non-negotiable boundaries

```text
NURU V1
  discovers, assesses, connects, evaluates, governs, archives, audits

NURU DISCOVER
  catalogs approved items, ranks candidates, presents recommendations,
  records feedback, and explains recommendations
```

- Discover never promotes an item to canonical knowledge.
- Discover never hides source/provenance behind an unexplained score.
- Only approved or explicitly publishable knowledge can enter a user feed.
- Feedback is an `InterestSignal`, not an authority grant or a statement of fact.
- The recommendation service is deterministic in the first release; any model
  interpretation remains a proposed signal subject to policy.

## Delivery plan

### Current implementation status

- **Milestone 1 started (2026-09-15):** `NuruDiscoverCatalogService` now
  projects only `APPROVED`, explicitly `DISCOVERABLE`, provenance-backed
  canonical records. It fails closed for missing admission metadata,
  superseded records, invalid provenance, and agent-output-only material.
- A governor can now admit or withdraw an approved item in Knowledge Explorer.
  Each change records a reason and an append-only `CATALOG_ADMITTED` or
  `CATALOG_WITHDRAWN` audit event. The operation cannot modify the item’s
  content, provenance, status, or curation decision.
- **Milestone 2 started:** the read-only `discover-deterministic-v1` session
  engine ranks catalog items with visible reason codes, topic affinity, source
  status, and dismissed-item exclusion. Signed-in feedback is stored as an
  append-only `NuruDiscoverInterestSignal`, never as a change to canonical
  knowledge.

### Milestone 0 — Product contract and visual system (week 1)

Define the experience before adding recommendations.

- Create `NURU_DISCOVER_PRODUCT_SPEC.md` with desktop, tablet, and mobile
  layouts for Discover, item detail, Saved, Rabbit Holes, and Taste Map.
- Capture the approved visual system: near-black/navy surfaces, ivory editorial
  serif display type, restrained gold accents, fine borders, and atmospheric
  wide imagery.
- Define card states: loading, no result, unavailable source, saved, dismissed,
  and provenance warning.
- Establish image rules: licensed/owned imagery only, required alt text, and a
  stable fallback treatment when an item has no image.

**Exit gate:** a reviewed component inventory and responsive design reference;
no implementation begins from an unbounded aesthetic description.

### Milestone 1 — Discover domain and catalog (weeks 1–2)

Build the presentation data model without altering canonical knowledge.

```text
DiscoveryCatalogItem
  id, knowledgeItemId, title, summary, media, topics, sourcePreview,
  publicationStatus, discoverabilityPolicy

InterestSignal
  userId, subjectId, signalType, weight, source, createdAt

DiscoverySession
  userId, date, rankedItems, lane, score, explanation, version

ExplorationPath
  userId, title, seedItemId, orderedSteps, status
```

- Add a Catalog Service that projects eligible, approved Nuru knowledge into
  `DiscoveryCatalogItem` records.
- Add source-preview and provenance-link fields; no content can be presented as
  an editorial discovery unless its origin is visible.
- Add a media service boundary for image metadata, licensing state, crop hints,
  alt text, and fallbacks.
- Add migrations, repositories, service tests, and audit events for feedback
  mutations.

**Exit gate:** seeded catalog items can be queried by topic, source, project,
and publication eligibility; no Discover write reaches Nuru canonical tables
directly.

### Milestone 2 — Explainable recommendation engine (weeks 2–3)

Create a deterministic first-pass ranking service.

```text
candidate eligibility
  → source and publication checks
  → topic/relationship similarity
  → explicit feedback adjustment
  → diversity and novelty constraints
  → lane assignment
  → explanation generation
```

Implement four lanes shown in the concept:

- **Near certain match:** high topical affinity and good evidence.
- **Adjacent:** related domain or relationship-graph proximity.
- **Serendipity:** intentional but bounded cross-topic exploration.
- **Wildcard:** a low-frequency, high-novelty item that still passes quality
  and source requirements.

Every recommendation includes an explanation object:

```text
reasonCodes[]
supportingTopics[]
relatedSavedItems[]
sourceStatus
confidence
rankingVersion
```

**Exit gate:** the system produces a stable daily session of seven items, with
diversity constraints and a human-readable explanation for every item.

### Milestone 3 — Discovery experience MVP (weeks 3–5)

Implement the first polished user flow.

- Build `/nuru/discover` with the cinematic hero, daily headline, featured card,
  recommendation lanes, and “why this?” panel.
- Build content cards with media, source/type, confidence, Save, Explore, and
  Not for me actions.
- Build item detail with summary, source, provenance link, connected subjects,
  and a clear distinction between source material and Nuru’s interpretation.
- Add `/nuru/saved` and persistent saved/dismissed feedback.
- Implement keyboard navigation, accessible names, focus states, contrast checks,
  reduced-motion treatment, and responsive layouts.

**Exit gate:** a signed-in user can receive a session, inspect rationale, save
or dismiss an item, and see the next session update predictably.

### Milestone 4 — Curiosity paths and Rabbit Holes (weeks 5–6)

Turn individual cards into deliberate exploration.

- Build `/nuru/rabbit-holes` for ordered, user-owned exploration paths.
- Add the four entry points from the concept: Surprise Me, Rabbit Hole, Go
  Deeper, and Somewhere New.
- Create a Path Builder that uses approved graph relationships and ranking rules
  to propose a sequence; the user starts, continues, or ends the path.
- Track progress without treating reading behavior as hidden authority.

**Exit gate:** a user can start a path from a discovery card, inspect why each
next step was chosen, and resume it later.

### Milestone 5 — Taste Map and feedback loop (weeks 6–7)

Make personalization legible and controllable.

- Build `/nuru/taste-map` with topic strengths, recent movement, and explicit
  feedback history.
- Use only clear signals in V1: Save, Not for me, Explore, path continuation,
  and optional declared interests.
- Add “Nuru noticed something” insights only when support is sufficient; each
  insight must show its evidence and provide “Explore this” and “Not really.”
- Provide a control to remove signals and reset a topic profile.

**Exit gate:** the user can understand, correct, and delete the signals used to
personalize recommendations.

### Milestone 6 — Content operations and quality (weeks 7–8)

Make discovery usable beyond demo data.

- Create an editorial/admin catalog view for discoverability policy, media
  readiness, source status, and preview quality.
- Add automated checks for missing provenance, missing alt text, stale sources,
  duplicate catalog entries, unsafe external content, and broken media.
- Add a publishability gate: a canonical item can be durable while not yet
  eligible for Discover.
- Add search over approved catalog items with topic, type, source, date, and
  project filters.

**Exit gate:** catalog health is observable and unsupported/unsafe items cannot
enter a discovery session.

### Milestone 7 — Evaluation, polish, and launch (weeks 8–10)

- Create recommendation evaluation fixtures for strong match, adjacent,
  serendipity, wildcard, repetition, weak provenance, dismissed topic, and
  cross-project discovery cases.
- Measure save rate, dismissal rate, explanation usefulness, session diversity,
  stale-item rate, and repeated-item rate without turning metrics into hidden
  user profiling.
- Conduct visual regression testing against the reviewed design references at
  desktop, tablet, and mobile breakpoints.
- Run security and privacy review: authorization, rate limits, content
  sanitization, source safety, audit coverage, data retention, and feedback
  deletion.

**Exit gate:** product meets the Discover acceptance suite, visual quality bar,
and privacy/governance review.

## Acceptance criteria for the reference experience

The launch candidate must demonstrate all of the following:

1. A daily headline and exactly bounded set of recommendations.
2. A featured discovery with a readable rationale, source status, and confidence.
3. Four visibly distinct recommendation lanes.
4. Save and Not for me actions that alter future ranking through auditable
   `InterestSignal` records.
5. User-owned Rabbit Holes with step-by-step explanations.
6. A Taste Map that exposes and permits correction/deletion of personalization.
7. Responsive, accessible UI matching the approved editorial dark-mode visual
   system—not a generic dashboard.
8. No non-approved, unprovenanced, or policy-ineligible item in the feed.
9. No direct Discover mutation of canonical Nuru knowledge.
10. Recommendation explanations available for every rendered item.

## Indicative schedule

| Outcome | Estimated elapsed time |
| --- | ---: |
| Functional discovery MVP | 3–5 weeks |
| Personalization and Rabbit Holes | 2–3 additional weeks |
| Visual polish, evaluation, operations, launch hardening | 2–4 additional weeks |
| Full reference-quality release | 8–12 weeks total |

The estimate assumes one focused implementation stream and an initial curated
catalog. A large external-content ingestion program should be scoped separately.
