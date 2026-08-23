# Conflict Engine Constitution

- Phase: 8, Deliverable 8.1
- Status: Canonical foundation
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- System: Noesis (`agent:noesis`)

## Purpose

The Conflict Engine governs disagreement between candidate knowledge and existing durable knowledge. Its purpose is to ensure that contradictory, overlapping, superseding, or scope-incompatible claims are detected, represented, reasoned about, and resolved explicitly.

Its central invariant is:

> No durable knowledge may silently replace, contradict, weaken, broaden, or override existing durable knowledge.

This is stronger than a sentence-similarity check. A conflict exists when a candidate and existing item cannot both be accepted unchanged in the same applicable scope, or when accepting the candidate would materially change the interpretation, authority, applicability, or validity of the existing item.

## Constitutional boundaries

1. Conflict detection occurs before candidate promotion to durable knowledge.
2. A detected conflict is a first-class, durable, auditable object; it references knowledge and provenance records rather than duplicating or rewriting them.
3. Scope, authority, evidence, confidence, and temporal applicability remain independent comparison dimensions. No aggregate score may silently replace those dimensions.
4. Detection, classification, and a proposed outcome do not authorize a mutation.
5. Authority-changing outcomes, including supersession, exception creation, and rejection of an authoritative candidate, require an explicit authority gate and any required human approval.
6. A correction or resolution creates a successor, relationship, and provenance record. It never edits historical source, interpretation, approval, candidate, or durable knowledge to make history appear consistent.
7. When the evidence is ambiguous or authority is insufficient, Noesis requests clarification or escalates rather than guessing.
8. Conflict processing fails closed: a candidate with an unresolved or unauthorized material conflict is not durable knowledge.

## Relationship to existing controls

The existing conservative conflict detector remains an analytical boundary: it can identify relationships such as contradiction, duplicate, correction, exception, narrowing, or uncertainty, but it cannot persist, resolve, or authorize a change. Phase 8 adds the durable conflict object, comparison model, deterministic resolution policy, impact analysis, and authority gate around that analysis.

Phase 7 provenance remains required for every conflict and its resolution. The Conflict Engine must be able to explain what conflicted, why it was classified as a conflict, the compared scopes and authority, the evidence considered, the proposed action, the authority decision, and every resulting historical change.
