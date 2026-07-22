# Mission Control Phase 10.6.3 - Evidence Reliability Recalibrator

## Tightened Implementation Contract

The Evidence Reliability Recalibrator determines whether confidence accuracy problems are attributable to weak, incomplete, stale, contradictory, uncertain, or poorly traced evidence. Despite the phase name, this implementation is strictly observational: it recommends governed follow-up, but never changes evidence records, evidence weights, confidence values, confidence models, or historical decisions.

## Implemented Scope

- Deterministic evidence reliability scoring across source quality, completeness, freshness, conflict, uncertainty, lineage, verification history, and durability.
- Source reliability profiles with historical accuracy, verification success, consistency, trust, durability, and trend.
- Evidence reliability report with explainable analyses, governance findings, and recommended actions.
- Immutable, append-only, tenant-isolated reliability trend registry.
- Replay and integrity verification for records, source profiles, reports, registry, and validation.
- API endpoints for contract, analysis, records, sources, report, registry, completeness, freshness, conflicts, uncertainty, lineage, verification, durability, replay, and inspection.

## Deterministic Rules

- Identical evidence history produces identical reliability scores, report content, replay hashes, and integrity hashes.
- Missing evidence fails closed.
- Broken lineage is an integrity failure.
- Missing verification history reduces reliability and produces a governance warning.
- Missing replay or governance references fails certification.
- Cross-tenant evidence is rejected.
- Registry mutation, score tampering, nondeterminism, evidence mutation, direct confidence recalibration, and fail-open behavior are certification failures.

## Advisory Boundary

The recalibrator produces evidence reliability assessments and future governed adaptation recommendations only. Certified outputs set `advisory_only: true`, `mutates_evidence: false`, `updates_evidence_weights: false`, `updates_confidence_model: false`, and `changes_historical_decisions: false`.
