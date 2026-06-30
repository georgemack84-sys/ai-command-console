# Phase 6H.2 Replay Input Reconstruction

Phase 6H.2 builds the deterministic input package that future replay execution phases will consume. It consumes a validated Phase 6H.1 Replay Contract and reconstructs the input side of replay: truth records, events, evidence, lineage, governance, authority, schema context, ordering context, serialization context, completeness, integrity, and stable hashes.

This phase does not execute replay, recompute recommendations, compare outputs, repair missing history, call networks, run tools, mutate truth records, rewrite governance, or perform remediation.

## Replay Input Bundle

The replay input bundle records the contract reference and hash, reconstruction type and scope, all loaded input groups, schema and serialization rules, deterministic ordering, completeness and integrity reports, manifest, input hashes, reconstruction state, certification state, failure reasons, audit events, and immutable storage fields.

## Manifest

The manifest proves what was required, found, missing, restricted, superseded, and included. It lists truth record IDs, event IDs, evidence refs, lineage refs, governance refs, policy refs, authority refs, schema refs, required inputs, optional inputs, missing inputs, restricted inputs, superseded inputs, and a stable manifest hash.

## Completeness And Integrity

Completeness fails closed when required truth records, events, evidence, lineage, governance, authority, or schemas are missing. Partial reconstruction is allowed only when the replay contract explicitly allows partial replay and requires escalation.

Integrity fails closed for hash mismatches, corrupted inputs, unauthorized inputs, broken evidence relationships, broken causal chains, policy substitution, execution authority, authority expansion, unsupported schemas, silent schema migration, non-deterministic ordering, unstable serialization, wall-clock injection, and environment-specific injection.

## Determinism

The builder applies the replay contract ordering rules, canonical stable JSON serialization, stable hashes for each input group, and a full input bundle hash. Same inputs produce the same bundle hash; changed evidence, lineage, governance, authority, schema, or truth records produce different hashes.

## Audit Events

Reconstruction emits structured audit event names for the attempt lifecycle, including contract load, scope verification, manifest creation, source loading, authority verification, schema loading, ordering, canonicalization, integrity verification, bundle creation, failure, and escalation.

## Out Of Scope

Replay execution, result comparison, replay ledger execution records, UI surfaces, dashboards, forensic workflows, external integrations, network fetchers, file-system replay engines, autonomous remediation, and source mutation remain out of scope.
