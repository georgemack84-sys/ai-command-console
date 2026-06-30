# Mission Control Phase 7B.1 - Policy Analysis Contract

## Purpose

Phase 7B.1 defines the canonical `PolicyAnalysis` contract used by Mission Control to analyze policy meaning, scope, lineage, replayability, and Truth Ledger evidence without granting enforcement authority.

The contract is advisory-only. It preserves operator supremacy, constitution supremacy, tenant isolation, deterministic replay, Truth Ledger compatibility, and fail-closed validation.

## Contract Fields

`PolicyAnalysisRecord` is defined in `types/policy-analysis.ts` with these canonical fields:

- `policy_analysis_id`
- `policy_id`
- `tenant_id`
- `policy_version`
- `policy_name`
- `policy_type`
- `authority_scope`
- `governance_scope`
- `constraints`
- `exceptions`
- `permissions`
- `prohibitions`
- `enforcement_boundaries`
- `source_truth_records`
- `lineage_refs`
- `replay_refs`
- `created_timestamp`
- `analysis_state`
- `analysis_hash`

The implementation also carries explicit inheritance and supersession sections so parent/child policy relationships can remain deterministic and auditable.

## Supported Policy Types

The contract accepts only these policy types:

- `GOVERNANCE_POLICY`
- `SECURITY_POLICY`
- `RUNTIME_POLICY`
- `AUTHORITY_POLICY`
- `COMPLIANCE_POLICY`
- `RISK_POLICY`
- `CERTIFICATION_POLICY`
- `TENANT_POLICY`
- `MISSION_POLICY`
- `RECOVERY_POLICY`
- `VISIBILITY_POLICY`
- `SIMULATION_POLICY`

Unknown policy types fail closed with `UNKNOWN_POLICY_TYPE`.

## Analysis States

Supported analysis states are:

- `CREATED`
- `VALIDATED`
- `REPLAYABLE`
- `RESTRICTED`
- `SUPERSEDED`
- `INVALID`
- `ARCHIVED`

Allowed transitions are deterministic:

- `CREATED -> VALIDATED`
- `CREATED -> INVALID`
- `VALIDATED -> REPLAYABLE`
- `VALIDATED -> INVALID`
- `REPLAYABLE -> RESTRICTED`
- `REPLAYABLE -> SUPERSEDED`
- `REPLAYABLE -> ARCHIVED`
- terminal cleanup transitions from `RESTRICTED`, `SUPERSEDED`, and `INVALID` to `ARCHIVED`

Invalid transitions fail closed with `INVALID_STATE_TRANSITION`.

## Validation Rules

Validation rejects missing identity, tenant, version, policy name, policy type, authority scope, governance scope, constraints, enforcement boundaries, Truth Ledger records, lineage references, replay references, and invalid analysis states.

The validator also detects:

- tenant scope mismatch
- Truth Ledger tenant mismatch
- hidden or incomplete exceptions
- unscoped permissions and prohibitions
- permissions that bypass prohibitions
- missing advisory-only enforcement boundaries
- lineage breaks
- circular inheritance
- replay output mismatch
- immutable identity mutation
- uncertified 7A foundation dependency

Validation output is deterministic, replayable when replay evidence is complete, tenant-scoped, and advisory-only.

## API Surface

Phase 7B.1 exposes:

- `GET /api/policy-analysis/contract`
- `POST /api/policy-analysis/validate`
- `POST /api/policy-analysis/hash`
- `POST /api/policy-analysis/transition`
- `POST /api/policy-analysis/replay`
- `GET|POST /api/policy-analysis/inspect`

All routes require an authenticated workspace member and return deterministic contract, validation, hash, transition, replay, or observability payloads.

## Certification Posture

7B.1 depends on the certified 7A Governance Intelligence foundation. The policy analysis layer does not execute, approve, mutate, bypass, or enforce runtime behavior. It only analyzes policy contracts and produces operator-visible evidence for governance intelligence workflows.
