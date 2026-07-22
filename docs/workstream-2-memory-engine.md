# Workstream 2 Memory Engine

Phase W2.9 establishes the CAF Memory Engine as the authoritative, governed, explainable, auditable, and replayable memory subsystem for CAF Legion agents.

## Certified Baseline

- Phase: `memory-engine/w2.9`
- Readiness identifier: `W2.9-MEMORY-ENGINE-READINESS-001`
- Certification gate: `Memory Engine Certification Gate`
- Passing decision: `MEMORY_ENGINE_CERTIFIED`
- Upstream anchors: W2.0 CAF Constitutional Foundation, W2.1 Agent Registry, W2.2 Lifecycle Engine, W2.3 Capability Registry, W2.4 Skill Registry, W2.5 Authority Validator, W2.6 Policy Gate, W2.7 Safety Gate, W2.8 Planning Engine

## Contract Surface

- `types/memory-engine.ts` defines memory decisions, failure modes, memory kinds, working memory, semantic memory, procedural memory, episodic memory, provenance, governance, retrieval, registry, APIs, evidence, readiness, validation, and bundle metadata.
- `services/memory-engine/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/memory-engine/*` exposes authenticated contract, validation, working, semantic, procedural, episodic, provenance, governance, retrieval, registry, APIs, evidence, and readiness slices.

## Governance Guarantees

- Memory operations are authoritative, deterministic, auditable, replayable, tenant-isolated, and constitutionally governed.
- Working memory is scoped, low-latency, automatically expiring, runtime-isolated, and deterministically updated.
- Semantic, procedural, and episodic stores support validated knowledge, reusable procedures, historical retrieval, and replay.
- Every memory has unique identity, ownership, tenant, namespace, provenance, authority, policy classification, evidence, lifecycle state, and version history.
- Memory is immutable by default: updates create new versions, lineage references, and evidence records.
- Retrieval cannot bypass Authority Validator, Policy Gate, or Safety Gate and must include explanation, ranking rationale, provenance chain, confidence, authority evaluation, and policy evaluation.
- Governance enforces ownership, authority, policy, retention, expiration, archival, deletion approval, modification approval, trust validation, replay validation, lifecycle, and tenant isolation.

## Verification

The W2.9 unit suite validates certification, deterministic replay, upstream anchoring, memory kinds, provenance invariants, governance, retrieval gates, tenant isolation, APIs, immutable evidence, conditional degradation, fail-closed behavior, explicit certification failure, and observation/follow-up outcomes.
