# Nuru Vault Architecture Baseline 1.0

**Status:** Proposed — requires product-owner approval before implementation

## Purpose

This baseline translates the Vault roadmap into an implementable program while
preserving the active Nuru V1 product direction: personal discovery is the
user-facing product; the Vault is its governed trust and memory layer.

It deliberately does not redefine Nuru as a general-purpose project-management
system. Project knowledge may become a bounded Vault namespace after the
personal-discovery loop is proven.

## Product boundary

```text
Personal discovery
    Taste evidence -> eligible candidates -> finite edition -> feedback
                              |
                              v
                    Nuru Vault trust layer
        source provenance, evidence, policy, history, retrieval
```

The same trust primitives can later support a `project` namespace for decisions,
requirements, architecture records, releases, and implementation evidence. That
extension must not block the discovery V1 loop or turn its normal user experience
into an operator console.

## Non-negotiable invariants

1. A source, model output, candidate, cache, index, or agent is not canonical
   authority.
2. Agents may retrieve, reason, and propose only through registered tools and
   services; they never receive direct persistence, credential, audit, or
   permission-store access.
3. Canonical changes require valid provenance, deterministic policy checks, an
   auditable decision, and any required human approval.
4. Corrections and supersession preserve history; no component silently rewrites
   or erases prior durable records.
5. Derived data inherits the most restrictive applicable classification unless
   an explicit policy authorizes a change.
6. Caches, graph/search projections, and embeddings are rebuildable projections
   of governed records, never the source of truth.
7. A failed validation, authorization, provenance, or governance check produces
   no durable mutation.

## Initial bounded model

The first Vault slice owns only these durable concepts:

| Concept | Responsibility | Must retain |
| --- | --- | --- |
| `Source` | Identifies external or human-origin material | origin, policy version, authority, retrieval time |
| `Evidence` | Immutable reference to supporting material | source, content hash, locator, captured time |
| `Candidate` | A proposed interpretation or normalized discovery item | evidence links, confidence, warnings, producer |
| `GovernanceDecision` | Deterministic/human disposition of a candidate | policy result, approver where needed, rationale, correlation ID |
| `CanonicalRecord` | Governed, versioned durable knowledge | governing decision, classification, status, supersession link |
| `AuditEvent` | Append-only lifecycle evidence | actor/service identity, action, timestamp, correlation ID |

`InfoCard`, `Claim`, `Entity`, and `Relationship` are useful domain-specific
views. They should be introduced only when their relationship to these six
records is explicit and testable.

## Authority flow

```text
Approved source or human input
        -> Evidence
        -> Candidate
        -> deterministic validation and policy
        -> required human review
        -> GovernanceDecision
        -> CanonicalRecord
        -> rebuildable retrieval projections
```

No arrow may be skipped. A rejection, hold, insufficient-evidence result, or
conflict remains an auditable outcome rather than a hidden failure.

## Delivery sequence

### BP-001 — Vault contracts

Define versioned schemas, enums, identifiers, lifecycle states, classifications,
and correlation requirements for the bounded model. Add contract tests for
schema compatibility and invalid-state rejection.

### BP-002 — Evidence and source integrity

Implement immutable source/evidence capture, content hashing, provenance
validation, and source-policy checks. Use fixtures only; do not require live
network acquisition.

### BP-003 — Candidate admission

Implement a service-only candidate write path. Agents submit structured
proposals; all malformed, unprovenanced, or out-of-policy submissions fail
closed.

### BP-004 — Canonical gate and history

Implement governance decisions, required review, canonical promotion,
supersession, and append-only audit events. Prove an agent cannot promote or
directly mutate canonical records.

### BP-005 — Retrieval projection

Build a read-only canonical lookup and one discovery-oriented retrieval view.
Make projection rebuilding safe and ensure a stale projection cannot hide a
canonical correction.

### BP-006 — Seeded discovery vertical slice

Use a fixed, representative fixture set to demonstrate source -> evidence ->
candidate -> eligible discovery -> explanation. This validates the trust layer
before autonomous retrieval or additional infrastructure.

### BP-007 — Project decision memory

Represent architecture decisions as versioned, append-only Vault records. A
decision must cite an existing human-approved candidate and governance decision;
supersession retains the former decision and serves the current one by default.

## Deferred work

The following are important, but not prerequisites for the first slice:

- autonomous stocking/research missions and model-routing optimization;
- distributed queues, graph databases, vector stores, and benchmark scale-out;
- build packages, implementation ledgers, and architecture-drift detection;
- cross-product integrations with Axiom, Noesis, Market Signal, and Headline
  Flow;
- autonomous canonical promotion.

Each later capability must enter through the same authority flow and inherit the
invariants above.

## First acceptance gate

The baseline is implemented only when automated tests demonstrate all of the
following:

- an evidence-backed candidate can become a governed canonical record;
- an agent cannot directly write or promote canonical knowledge;
- incomplete provenance, insufficient evidence, conflict, and missing approval
  fail closed with an audit trail;
- a supersession preserves both versions and defaults retrieval to the current
  version;
- a retrieval projection can be rebuilt from canonical records; and
- the seeded discovery flow produces an explanation tied to retained evidence,
  without treating model interpretation as source fact.

## Explicit decision needed

Before BP-001 starts, the product owner must confirm this boundary:

> Nuru V1 remains a personal discovery product. The Vault roadmap is implemented
> first as its trust layer; project-memory features are a later, separately
> scoped namespace.

If instead Nuru is to become a general knowledge platform first, the active
personal-discovery roadmap, V1 promise, release gates, and UI direction require
an explicit revision rather than silent divergence.
