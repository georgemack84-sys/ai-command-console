# Phase 8I.7 - Lineage Search

## Purpose

Phase 8I.7 provides deterministic, read-only lineage traversal across Controlled Autonomy. It traces how autonomous activity originated, evolved, and influenced later behavior across objectives, plans, executions, delegations, orchestrations, supervision events, interventions, replay verification, integrity validation, governance decisions, and recovery recommendations.

## Implementation

- `types/autonomy-lineage-search.ts` defines lineage records, relationship types, index entries, influence chains, broken-lineage findings, audit records, responses, inputs, and observability surfaces.
- `services/autonomy-lineage-search/index.ts` composes the 8I.6 replay reconstruction timeline into deterministic lineage relationships, append-only index entries, influence chains, and broken-lineage findings.
- `app/api/autonomy-lineage-search/*` exposes contract, search, relationships, reference index, influence chain, broken-lineage, and inspect/validation endpoints.
- `tests/unit/autonomy-lineage-search/autonomyLineageSearch.test.ts` verifies doctrine, deterministic ordering, replay-stable hashes, influence-chain rendering, index generation, broken-lineage detection, and fail-closed error mapping.

## Relationship Types

Lineage relationships are explicitly typed as `DERIVED_FROM`, `DEPENDS_ON`, `BLOCKED_BY`, `AUTHORIZED_BY`, `REJECTED_BY`, `SUPERVISED_BY`, `INTERVENED_BY`, `REPLAYED_BY`, `VERIFIED_BY`, or `SUPERSEDED_BY`.

## Read-Only Guarantees

The lineage search engine may inspect lineage, traverse relationships, reconstruct influence chains, identify missing references, identify broken lineage, and display replay evidence. It may never modify lineage, rewrite relationships, repair historical records, alter replay references, change integrity hashes, or modify governance evidence.

## Deterministic Ordering

Lineage traversal is ordered by:

1. `tenant_id`
2. `mission_id`
3. `timestamp`
4. `autonomy_event_sequence`
5. `lineage_id`

These keys keep traversal reproducible across replay, audit, and certification workflows.
