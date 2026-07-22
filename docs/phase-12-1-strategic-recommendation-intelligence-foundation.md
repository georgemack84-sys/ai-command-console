# Phase 12.1 - Strategic Recommendation Intelligence Foundation

Phase 12.1 establishes the deterministic constitutional foundation for Strategic Recommendation Intelligence. It defines bounded vocabularies, artifact identity, canonical registration, immutable origin provenance, lifecycle transitions, source-of-truth enforcement, referential integrity, and certification gates for downstream Phase 12 modules.

## Implemented Surfaces

- `services/strategic-recommendation-intelligence-foundation` provides the foundation runner, validator, replay verifier, registries, and certification report.
- `types/strategic-recommendation-intelligence-foundation.ts` defines the constitutional contract, vocabulary registry, artifact identities, artifact registrations, origin records, source-of-truth records, lifecycle transitions, referential integrity report, certification, and validation models.
- `app/api/strategic-recommendation-intelligence-foundation/*` exposes authenticated endpoints for dashboard execution, contract inspection, validation, vocabulary, identities, origins/source-of-truth, integrity, and certification.
- `tests/unit/strategic-recommendation-intelligence-foundation` verifies deterministic replay, doctrine, bounded vocabularies, artifact family registration, SRC-018 origin provenance, SRI-005 source-of-truth enforcement, lifecycle transitions, referential integrity, and fail-closed scenarios.

## Certification Coverage

The certification suite implements the 15 Phase 12.1 foundation checks: constitutional contract completeness, advisory boundary enforcement, governance supremacy, bounded vocabulary, deterministic identity, duplicate detection, artifact registry completeness, SRC-018, SRI-005, derived view limits, referential integrity, schema integrity, canonical ownership, replay requirements, and tenant isolation.
