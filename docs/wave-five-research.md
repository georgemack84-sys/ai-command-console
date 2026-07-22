# Wave 5.9 Research

Wave 5.9 establishes the constitutional research capability for deterministic collection, evidence organization, citation management, research notes, collaboration, retrieval, and synthesis.

## Constitutional Boundary

Research is evidence-based and advisory. It informs decisions but does not make decisions, supersede constitutional governance, establish unsupported authoritative facts, produce health diagnoses, or execute financial actions.

## Platform Capabilities

- Research Registry for projects, topics, collections, categories, metadata, status, ownership, relationships, tags, and versioning.
- Source Governance for classification, trust ratings, metadata, validation, freshness, version tracking, and duplicate detection.
- Evidence Collection for normalization, metadata, provenance, validation, linking, storage, refresh, and lineage.
- Evidence Matrix for claims, supporting and contradictory evidence, weighting, confidence, coverage, gaps, and relationships.
- Citation Manager and Notebook for validated citations, reusable references, bibliographies, persistent IDs, notes, observations, annotations, bookmarks, versioning, and cross references.
- Synthesis Engine for findings, themes, cross-source comparison, conflict resolution, summaries, narratives, insights, confidence, and recommendation drafts.
- Collaboration, Search, and Governance for shared research, reviews, comments, assignments, approvals, merge support, immutable history, deterministic search, explainable results, policies, audit, certification, compliance, and tenant isolation.

## Qualification Behavior

The default decision is `QUALIFIED`. Missing non-critical surfaces degrade to `CONDITIONALLY_QUALIFIED`. Constitutional failures such as missing provenance, unmapped claims, invalid citations, nondeterministic synthesis or search, unsupported authoritative conclusions, decision-authority bypass, health-diagnosis research output, financial-action research output, incomplete audit/compliance, replay divergence, or tenant-isolation breach produce `NOT_QUALIFIED`.

## Interfaces

- `GET /api/wave-five-research/contract`
- `POST /api/wave-five-research/validate`
- Section endpoints: `registry`, `source-governance`, `evidence`, `matrix`, `citation-notebook`, `synthesis`, `collaboration-search-governance`, and `readiness`
