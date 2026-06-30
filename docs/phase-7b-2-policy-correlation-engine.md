# Mission Control Phase 7B.2 - Policy Correlation Engine

## Purpose

Phase 7B.2 reconstructs how validated `PolicyAnalysis` records influenced historical Mission Control operations.

The engine correlates policies with Truth Ledger records, Recommendation Ledger records, Decision History, Governance Events, Authority Decisions, Violation Records, Replay History, and Certification History. It does not create, modify, rank, approve, or enforce policy. It only emits deterministic, evidence-linked, replayable correlation intelligence.

## Doctrine

The engine is governed by:

- no-assumption influence
- evidence-required correlation
- replay-required correlation
- tenant isolation
- advisory-only behavior
- cross-ledger consistency
- fail-closed validation

Unsupported semantic similarity is not sufficient to create a policy influence claim.

## Contract

The canonical output is `PolicyCorrelation`, defined in `types/policy-correlation.ts`.

Required fields include:

- `policy_correlation_id`
- `tenant_id`
- `policy_analysis_id`
- `policy_id`
- `policy_version`
- `policy_type`
- `correlation_type`
- `relationship_type`
- `source_ledger`
- `source_record_refs`
- `target_ledger`
- `target_record_refs`
- `influence_path`
- `constraints_applied`
- `exceptions_applied`
- `authority_context`
- `governance_context`
- `runtime_context`
- `mission_context`
- `evidence_refs`
- `lineage_refs`
- `replay_refs`
- `correlation_state`
- `correlation_hash`
- `created_timestamp`

## Sources

The approved source registry contains:

- `TRUTH_LEDGER`
- `RECOMMENDATION_LEDGER`
- `DECISION_HISTORY`
- `GOVERNANCE_EVENTS`
- `AUTHORITY_DECISIONS`
- `VIOLATION_RECORDS`
- `REPLAY_HISTORY`
- `CERTIFICATION_HISTORY`

Unknown ledgers fail closed.

## Influence Types

Supported correlation types:

- `DIRECT`
- `INDIRECT`
- `CASCADING`
- `HISTORICAL`
- `CONDITIONAL`

Supported relationship types:

- `POLICY_TO_RECOMMENDATION`
- `POLICY_TO_DECISION`
- `POLICY_TO_RUNTIME`
- `POLICY_TO_VIOLATION`
- `POLICY_TO_OUTCOME`
- `POLICY_TO_AUTHORITY`
- `POLICY_TO_MISSION`
- `POLICY_TO_GOVERNANCE_ACTION`
- `POLICY_TO_CERTIFICATION`
- `POLICY_TO_REPLAY`

## Pipeline

The service implements:

- correlation doctrine
- source registry
- policy identity resolution
- historical record collection
- ledger normalization
- temporal ordering
- evidence matching
- influence classification
- relationship generation
- cross-ledger consistency verification
- replay binding
- historical explanation output
- operator observability

## State Model

Allowed states:

- `CREATED`
- `SOURCE_VALIDATED`
- `CORRELATED`
- `CONSISTENCY_VERIFIED`
- `REPLAYABLE`
- `RESTRICTED`
- `INCONSISTENT`
- `INVALID`
- `ARCHIVED`

Generated correlations default to `REPLAYABLE` only when source records, target records, evidence, lineage, replay references, tenant scope, policy version, and hashes all validate.

## API Surface

Phase 7B.2 exposes:

- `GET /api/policy-correlation/contract`
- `GET /api/policy-correlation/sources`
- `POST /api/policy-correlation/correlate`
- `POST /api/policy-correlation/validate`
- `POST /api/policy-correlation/hash`
- `POST /api/policy-correlation/transition`
- `POST /api/policy-correlation/replay`
- `GET|POST /api/policy-correlation/inspect`

All routes require an authenticated workspace member.

## Certification Posture

The 7B.2 engine depends on the 7B.1 `PolicyAnalysis` contract. Only valid, replayable analysis states can be correlated: `VALIDATED`, `REPLAYABLE`, `RESTRICTED`, and `ARCHIVED`.

The engine fails closed for missing evidence, missing replay references, tenant mismatch, policy version mismatch, future policy influence, broken lineage, inconsistent ledger records, unsupported relationship types, unsupported correlation types, tampered hashes, and enforcement attempts.

The output is ready to feed 7B.3 Policy Dependency Graph construction.
