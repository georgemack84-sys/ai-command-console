# Nuru Product Reset Roadmap

**Status:** Proposed

## North star

> **Nuru discovers what you didn't know you'd love.**

Nuru is a personal discovery intelligence. It learns, cautiously and visibly,
what makes a person curious; searches for credible material on their behalf;
and presents a small number of meaningful, explainable discoveries.

Nuru is not a generic assistant, a reading-list manager, or an internal
knowledge-governance product.

## V1 product decision

**Target user:** a curious adult who enjoys ideas, real stories, and depth, but
does not want to spend their free time hunting across many apps and publishers.
They value credible sources and want help finding an unexpectedly compelling
next thread—not a stream of more of the same.

**V1 promise:** after a short interview, Nuru returns a finite edition of seven
credible discoveries from books, documentaries, and long-form articles. At
least one discovery makes a reasonable, evidence-backed leap beyond the user's
declared interests.

**V1 non-goals:** unrestricted web search, social recommendations, news
alerts, an infinite feed, autonomous factual publishing, and a general-purpose
research workspace.

## Product boundary reset

The existing curation, provenance, source-quality, audit, and relationship
work remains valuable. It becomes Nuru's **trust layer**, rather than its
primary user-facing identity.

```text
Personal curiosity and feedback
        ↓
Taste Map hypotheses
        ↓
Autonomous candidate retrieval
        ↓
Trust layer: source policy, provenance, quality, deduplication
        ↓
Personal discovery ranking and diversity controls
        ↓
Finite edition: “I found something.”
        ↓
Evidence-backed explanation and feedback
        ↓
Taste Map update
```

The trust layer may reject or downgrade candidates. It must not require a
human operator to manually supply the inventory before Nuru can discover.

## Guardrails

- Preserve source provenance, user controls, auditability, and explicit
  correction of preference signals.
- Nuru may autonomously retrieve *candidates* from approved sources; retrieval
  is not a factual endorsement or a durable knowledge write.
- Models may interpret evidence and write bounded explanations. They may not
  invent sources, claims, or permanent preferences.
- Behavioral activity is weak, decaying evidence. Explicit user feedback has
  greater weight.
- A finite session replaces infinite scroll. Do not optimize for time spent.
- A discovery must be both credible enough to present and personally meaningful
  enough to justify the interruption.

## V1 source policy

Nuru uses a small allowlisted registry. Each adapter is read-only, rate-limited,
and records the source URL, retrieval time, creator/publisher, publication date,
and source-policy version.

| V1 domain | Initial source | Eligible material | Default handling |
| --- | --- | --- | --- |
| Books | Open Library, publisher metadata where available | Books with stable bibliographic metadata | Present as a book discovery; link to a legitimate source or availability page |
| Documentaries | TMDB plus official distributor/publisher metadata | Films/documentaries with clear credits and release metadata | Present as a discovery; do not claim a work is available to stream unless verified |
| Long-form articles | A small allowlisted RSS set from museums, universities, public broadcasters, and established editorial publications | Articles with publisher, byline/date where available, and a direct canonical URL | Link and summarize; never reproduce paywalled or copyrighted article text |

Candidates are automatically rejected or held when origin is unavailable,
metadata is materially incomplete, a source is outside policy, the item is a
likely duplicate, or content safety checks fail. Human review is reserved for
policy exceptions, disputed source quality, and source-registry changes—not
routine recommendation inventory.

## Phase 0 — Recommit the product (1 week)

### Outcome

One unambiguous product definition guides all new work.

### Work

- Adopt this north star and update the Nuru product constitution and product
  specifications to distinguish the personal product from the internal trust
  layer.
- Freeze new governor, operator, canonical-knowledge, and curation-console UI
  work unless it is required to support candidate trust or safety.
- Rename user-facing concepts away from “catalog record,” “admission,” and
  “governor.” Use discovery, source, reason, and evidence.
- Define a lightweight source policy: source classes, allowed domains, source
  metadata, retrieval cadence, license/terms expectations, and failure policy.
- Establish product measures: meaningful saves, explanation usefulness,
  confirmed emerging interests, completed Rabbit Holes, diversity, and repeat
  recommendation rate. Exclude time-spent optimization.
- Establish `/nuru/discover` as the sole reader-facing Nuru entry point. Treat
  legacy `/nuru` surfaces as migration targets; operator and review routes stay
  outside normal discovery navigation.

### Exit gate

Every new Nuru proposal can answer: *how does this improve Nuru's ability to
find a meaningful, explainable surprise for this person?*

## Phase 1 — Learn the person (2–3 weeks)

### Outcome

Nuru has a real, evidence-backed Taste Map rather than only a list of topics.

### Work

- Build the first-run conversational Taste Interview. Ask about recent
  fascinations, what made them compelling, dislikes, preferred depth, and
  appetite for unfamiliar territory.
- Add a probabilistic Taste Map domain model: interests, dimensions, positive
  and negative signals, format preferences, exploration tolerance, confidence,
  evidence count, recency, and status.
- Support `candidate`, `emerging`, `established`, `declining`, and `dormant`
  interests. Never store “user likes X” as an absolute fact.
- Let the user inspect, confirm, quiet, delete, pause learning, and reset their
  map. Show the evidence behind each meaningful inference.
- Replace thin feedback with reasons such as: loved the subject/story/person/
  process, too similar, wrong format, too technical, not deep enough, or
  already knew it.
- Add the V1 persistence contracts below. Every interpretation remains distinct
  from the raw evidence that supports it.

```text
TasteSignal
  id, userId, concept, dimension, polarity, weight, confidence,
  evidenceType, evidenceId, createdAt, expiresAt, status

DiscoveryCandidate
  id, type, title, creator, summary, topics, sourceUrl, publisher,
  publishedAt, retrievedAt, sourcePolicyVersion, qualityState

RetrievalRun
  id, sourceId, queryContext, startedAt, completedAt, candidateCount,
  failureReason, policyVersion

DiscoveryRecommendation
  id, userId, candidateId, sessionId, lane, score, scoreBreakdown,
  explanationEvidenceIds, rankingVersion, shownAt

DiscoveryReaction
  id, recommendationId, reactionType, reasonCode, createdAt
```

### Exit gate

A new user can complete the interview, see tentative interests with their
evidence, correct them, and receive a deliberately incomplete initial map.

## Phase 2 — Let Nuru find material (2–3 weeks)

### Outcome

Nuru autonomously creates a credible, normalized candidate pool.

### Work

- Create a source-registry interface and begin only with the three source
  classes specified in the V1 source policy: Open Library, TMDB, and a small
  curated RSS/article source set.
- Normalize books, films/documentaries, videos, articles, people, and events
  into one `DiscoveryCandidate` contract.
- Store source URL, publisher/creator, publication date, retrieval timestamp,
  source class, topic signals, rights/access notes, and provenance state.
- Use the existing quality, provenance, duplicate, and relationship systems as
  automatic eligibility checks. Route only ambiguous, risky, or policy-violating
  cases to review.
- Add source freshness and health checks; show uncertainty and unavailable
  source states instead of filling gaps.

### Exit gate

Nuru can retrieve and normalize candidates across at least three domains with
source evidence, without the user submitting the material first.

## Phase 3 — Make personal discovery work (3–4 weeks)

### Outcome

Nuru produces a small, reproducible personal edition that can surprise without
becoming arbitrary.

### Work

- Replace topic-overlap-only ordering with deterministic scoring that balances:

  ```text
  taste resonance
  + novelty
  + cross-domain connection
  + quality and source confidence
  + exploration/diversity weight
  - repetition penalty
  ```

- Implement Familiar, Adjacent, Serendipity, Wildcard, and Rabbit Hole as real
  ranking policies, not visual labels.
- Generate a finite daily edition: three strong matches, two adjacent, one
  serendipity, and one wildcard when candidate coverage permits. A missing lane
  must be shown honestly as unavailable, not filled with a weak fit.
- Give every discovery a grounded explanation: relevant Taste Map evidence,
  the unexpected connection, source details, and calibrated confidence.
- Record recommendations, explanations, reactions, and resulting Taste Map
  changes to prevent repeats and make the system debuggable.
- Add synthetic-persona tests that demonstrate different people receive
  different, explainable editions from the same candidate pool.

### Acceptance thresholds

- The same input snapshot always produces the same session and score breakdown.
- No dismissed candidate is shown again unless the user explicitly restores it.
- No candidate may appear twice within 30 days unless the user saved it or asks
  for it directly.
- A seven-item session contains at least three source/publisher families and at
  least two content formats whenever the eligible pool permits.
- Every displayed item includes a valid source URL, at least one ranking reason
  tied to retained evidence, and a clear distinction between source facts and
  Nuru's interpretation.
- A persona with different evidence receives a materially different order and
  at least three different candidates from the same sufficiently broad pool.

### Exit gate

Given the same Taste Map and candidates, Nuru returns predictable, diverse
recommendations and explains each one without inventing personalization.

## Phase 4 — Deliver the Nuru moment (2–3 weeks)

### Outcome

The user experiences Nuru as a quiet, curious companion rather than a catalog
or a control console.

### Work

- Make Discover the primary surface: “I found 7 things.” Keep the edition
  bounded and editorial.
- Lead each card with the discovery and its personal connection; place source
  and provenance information one interaction away, never hidden.
- Build Discovery Detail around why it matters, why Nuru chose it, and the
  possible next directions—not just a source record.
- Build 5–8-node Rabbit Holes from eligible graph connections and ranked
  candidates. Explain every transition and let the user choose branches.
- Surface emerging interests as explicit hypotheses: “I've noticed something…
  Shall we explore it?” Never silently promote them.
- Remove or de-emphasize operator surfaces from normal discovery navigation.

### Exit gate

A user can have the complete loop: interview → edition → explore a surprise →
understand why → react → see Nuru's understanding evolve → take a Rabbit Hole.

## Phase 5 — Calibrate, protect, and release (ongoing)

### Outcome

Nuru becomes more useful without becoming manipulative, opaque, or brittle.

### Work

- Evaluate recommendation relevance, novelty, explanation grounding, source
  diversity, repeat avoidance, and emerging-interest accuracy with fixture
  profiles and voluntary user feedback.
- Add an anti-bubble policy across topic, format, source, creator, geography,
  era, and perspective.
- Monitor source failure, cost, latency, freshness, and retrieval coverage.
- Audit privacy controls and deletion/reset behavior. Keep sensitive-attribute
  inference out of the Taste Map.
- Expand sources only after the retrieval, ranking, and explanation loop is
  demonstrably useful with the initial set.

## What we retain, reframe, and stop

| Keep and use | Reframe | Pause |
| --- | --- | --- |
| Provenance, source quality, deduplication, relationship graph, audit history, privacy controls | Governance becomes a background trust service; the catalog becomes a candidate pool | New operator dashboards, mandatory manual admission for ordinary discoveries, and curation features with no direct discovery benefit |

## First implementation slice

Build this vertical slice before expanding infrastructure:

```text
Taste interview
→ initial probabilistic Taste Map
→ retrieve candidates from Open Library, TMDB, and curated RSS
→ source/quality checks
→ one seven-item finite edition
→ grounded “Why Nuru chose this?”
→ structured feedback
→ visible Taste Map update
```

If that slice makes one person say, “I would not have found this myself, but I
see why you brought it to me,” Nuru is back on course.

## Delivery sequence and release gates

| Release | Scope | Gate |
| --- | --- | --- |
| R0 — Product reset | Constitution/spec alignment, source policy, route ownership | One user-facing product path and no unresolved conflict between curation and discovery purpose |
| R1 — Taste foundation | Interview, Taste Signal persistence, map inspection and corrections | A user can see and correct every meaningful signal |
| R2 — Autonomous pool | Three read-only adapters, normalization, quality and retrieval-run history | Nuru retrieves eligible candidates without user-submitted articles |
| R3 — Personal edition | Deterministic ranking, finite seven-item session, explanations, feedback, history | Meets all Phase 3 acceptance thresholds with synthetic personas |
| R4 — Nuru moment | Discovery detail, structured feedback, emerging-interest hypotheses, 5–8-node Rabbit Hole | A complete user loop works without operator UI |
| R5 — Calibration | Evaluation fixtures, source-health monitoring, privacy/deletion tests, controlled source expansion | Recommendation quality is measurable without engagement optimization |

No work should enter R4 or later until the previous release gate is demonstrated
with seeded data and automated tests. This prevents visual polish or
infrastructure expansion from obscuring an unfinished personal-discovery loop.
