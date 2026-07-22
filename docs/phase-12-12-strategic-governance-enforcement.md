# Phase 12.12 - Governance, Security, and Authority Enforcement

Phase 12.12 adds a deterministic governance enforcement layer over the strategic recommendation intelligence chain. It consumes Phase 12.11 assurance and enforces constitutional compliance, governance approval, advisory-only authority, operator supremacy, evidence and trust qualification, tenant isolation, restricted information controls, security validation, and fail-closed termination.

## Service

`services/strategic-governance-enforcement` exposes:

- `runStrategicGovernanceEnforcement(input?)`
- `validateStrategicGovernanceEnforcement(result?)`
- `replayStrategicGovernanceEnforcement(result?)`
- `getStrategicGovernanceEnforcementContract()`

The service is deterministic and cryptographically hashed. Scenario inputs map to mandatory gate failures such as `CONSTITUTIONAL_FAILURE`, `GOVERNANCE_FAILURE`, `AUTHORITY_FAILURE`, `EVIDENCE_FAILURE`, `TENANT_FAILURE`, `SECURITY_FAILURE`, `REPLAY_FAILURE`, and `INTEGRITY_FAILURE`. Any failure transitions the state machine directly to `FAILED_CLOSED`.

## API

Authenticated workspace members can inspect:

- `GET /api/strategic-governance-enforcement/contract`
- `GET|POST /api/strategic-governance-enforcement/constitutional`
- `GET|POST /api/strategic-governance-enforcement/governance`
- `GET|POST /api/strategic-governance-enforcement/authority`
- `GET|POST /api/strategic-governance-enforcement/operator`
- `GET|POST /api/strategic-governance-enforcement/evidence`
- `GET|POST /api/strategic-governance-enforcement/trust`
- `GET|POST /api/strategic-governance-enforcement/tenant`
- `GET|POST /api/strategic-governance-enforcement/restricted-data`
- `GET|POST /api/strategic-governance-enforcement/security`
- `GET|POST /api/strategic-governance-enforcement/fail-closed`
- `GET|POST /api/strategic-governance-enforcement/ledger`
- `GET|POST /api/strategic-governance-enforcement/certification`
- `POST /api/strategic-governance-enforcement/validate`
- `GET|POST /api/strategic-governance-enforcement/observability`

POST requests may provide either a `result` to validate or an input scenario to exercise a failure path.

## Certification

The certification suite verifies:

- constitutional validation
- governance approvals
- advisory-only authority
- policy binding
- operator supremacy
- evidence qualification
- trust restrictions
- tenant isolation
- restricted information protection
- security validation
- replay integrity
- integrity verification
- immutable governance ledger
- fail-closed behavior
