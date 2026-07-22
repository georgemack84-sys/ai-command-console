# Mission Control Phase 9.1.6 - Governance & Constitutional Requirements

## Purpose

Phase 9.1.6 establishes the mandatory governance and constitutional compliance layer for every Mission Control decision. It requires governance references, constitutional references, deterministic policy mappings, deterministic constitutional mappings, authority verification, replay evidence, lineage evidence, immutable compliance metadata, and append-only audit records.

This framework consumes approved governance and constitutional artifacts. It does not create or modify policies, constitutional rules, authority boundaries, or runtime behavior.

## Canonical Implementation

- `types/decision-compliance.ts`
- `services/decision-compliance/index.ts`
- `tests/unit/decision-compliance/decisionCompliance.test.ts`

## Contracts

The implementation defines:

- `GovernanceReferenceContract`
- `ConstitutionalReferenceContract`
- `PolicyMappingRecord`
- `ConstitutionalMappingRecord`
- `ComplianceMetadata`
- `ComplianceAuditRecord`
- `ComplianceEvaluation`

Every compliance evaluation is tenant-scoped, mission-scoped, replayable, lineage-bound, advisory-only, immutable, and SHA-256 hashed.

## APIs

- `validateGovernanceCompliance()`
- `validateConstitutionalCompliance()`
- `validateComplianceEvaluation()`
- `resolveApplicablePolicies()`
- `resolveConstitutionalRules()`
- `verifyDecisionAuthority()`
- `replayComplianceEvaluation()`
- `createComplianceEvaluation()`
- `buildComplianceObservability()`
- `getDecisionComplianceFramework()`

## Guarantees

Compliance validation fails closed when governance references are missing, constitutional references are missing, policy versions are unsupported, constitutional versions are unsupported, authority validation fails, replay references are missing, lineage is broken, integrity mismatches are detected, tenant boundaries are violated, governance is bypassed, constitutional validation is bypassed, or evaluation becomes nondeterministic.

Only `COMPLIANT` decisions may proceed automatically. All other compliance states require fail-closed handling.

## Exit Criteria

Phase 9.1.6 is complete when governance and constitutional reference contracts are implemented, mappings are deterministic, authority verification is integrated, compliance metadata and audit records are immutable, replay reconstructs identical outcomes, tenant isolation is enforced, and focused tests cover valid compliance plus fail-closed boundary cases.
