# Phase 8ALT.5.3 - Evidence & Policy Reasoning Graph

The Evidence & Policy Reasoning Graph builds deterministic graph artifacts that explain why an autonomous decision exists. Graphs are derived from the Explainability Contract and Decision Narrative Engine, then represented as immutable nodes and relationships with replay, lineage, Truth Ledger references, and integrity hashes.

## Implemented Scope

- Deterministic `ReasoningGraph`, node, edge, and append-only repository contracts.
- Evidence chain, policy influence, constitutional reasoning, authority lineage, unified explanation graph, replay lineage, and Truth Ledger reference graph types.
- Certified graph construction from `ExplanationRecord` plus optional `DecisionNarrative` linkage.
- Query, replay, validation, observability, and authenticated API surfaces.
- Fail-closed validation for missing evidence, unsupported relationships, incomplete policy lineage, missing constitutional references, incomplete authority validation, decision lineage gaps, invalid replay, nondeterministic topology, duplicate nodes, orphaned relationships, cross-tenant relationships, integrity failure, fabricated dependencies, and advisory-only violations.

## API Surface

- `GET /api/evidence-policy-reasoning-graph/contract`
- `POST /api/evidence-policy-reasoning-graph/register-evidence`
- `POST /api/evidence-policy-reasoning-graph/evidence-chain`
- `POST /api/evidence-policy-reasoning-graph/policy-graph`
- `POST /api/evidence-policy-reasoning-graph/authority-graph`
- `POST /api/evidence-policy-reasoning-graph/explanation-graph`
- `POST /api/evidence-policy-reasoning-graph/replay`
- `POST /api/evidence-policy-reasoning-graph/query`
- `POST /api/evidence-policy-reasoning-graph/validate`
- `GET|POST /api/evidence-policy-reasoning-graph/inspect`
