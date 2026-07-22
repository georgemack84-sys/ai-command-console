# Phase 10.4.3 - Pattern Detection Engine

## Preview

The Pattern Detection Engine transforms validated pattern candidates into deterministic, explainable Pattern Intelligence. It detects recurring historical behavior; it does not predict future behavior, validate actionability, or adapt system logic.

## Tightened Contract

This phase:

- consumes the Phase 10.4.2 Pattern Candidate Builder;
- applies immutable, versioned, governance-approved detection rules;
- classifies candidates deterministically from recurrence, evidence, governance relevance, strategic relevance, confidence, and operational impact;
- creates reproducible detected-pattern identities;
- records explanations, evidence lineage, replay references, governance metadata, and integrity hashes;
- stores detected patterns in an immutable append-only registry;
- fails closed on missing evidence, low recurrence, missing replay, replay divergence, governance failure, constitutional violation, unsupported pattern type, integrity mismatch, tenant leakage, hidden inference, randomness, autonomous learning, or registry mutation.

## Non-Goals

- No prediction.
- No adaptive learning.
- No recommendation, priority, confidence, or governance-policy modification.
- No hidden optimization or heuristic-only inference.
- No pattern validation/scoring; that begins in Phase 10.4.4.

## Implemented Surface

- `GET /pattern-detection-engine/contract`
- `POST /pattern-detection-engine/detect`
- `POST /pattern-detection-engine/rules`
- `POST /pattern-detection-engine/classify`
- `POST /pattern-detection-engine/registry`
- `POST /pattern-detection-engine/replay`
- `POST /pattern-detection-engine/identity`
- `POST /pattern-detection-engine/inspect`

## Exit Criteria

Phase 10.4.3 is complete when detected patterns are deterministic, replayable, explainable, evidence-backed, governance-aware, tenant-isolated, append-only, advisory-only, and ready for Phase 10.4.4 validation.
