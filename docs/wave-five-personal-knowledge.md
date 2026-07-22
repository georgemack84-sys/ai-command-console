# Wave 5.3 Personal Knowledge

Wave 5.3 establishes the canonical Personal Knowledge platform above Unified Personal Context. It turns raw context into governed, trusted, interconnected knowledge that can be retrieved, reviewed, explained, and improved while preserving complete lineage to originating context and evidence.

## Platform Capabilities

- Knowledge Registry for identities, types, metadata, ownership, lifecycle, versioning, lineage, and classification.
- Knowledge Graph for entity, semantic, temporal, causal, behavioral, preference, goal, and context-reference relationships.
- Retrieval Engine for deterministic search, semantic retrieval, context-aware assembly, ranking, multi-hop traversal, query planning, and result explanation.
- Reliability View for scoring, source consistency, freshness, conflict detection, confidence aggregation, trust indicators, verification status, and history.
- Review Queue for low-confidence knowledge, human review, verification, approval, rejection, merge, conflict resolution, decision recording, immutable evidence, and replay.
- Evidence Sync for complete provenance, Unified Context synchronization, review evidence ledger, and replay-identical retrieval and review outcomes.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-critical implementation surfaces degrade to `CONDITIONALLY_QUALIFIED`. Constitutional failures such as unregistered knowledge objects, incomplete lineage, invalid graph relationships, missing context references, nondeterministic or unexplained retrieval, missing provenance-aware retrieval, non-continuous reliability, missing human review, mutable review lineage, invalid context synchronization, or replay divergence produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-five-personal-knowledge/contract`
- `POST /api/wave-five-personal-knowledge/validate`
- Section endpoints: `registry`, `graph`, `retrieval`, `reliability`, `review`, `evidence-sync`, and `readiness`
