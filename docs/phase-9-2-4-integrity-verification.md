# Mission Control Phase 9.2.4 - Integrity Verification

## Preview

Phase 9.2.4 verifies that a schema-valid decision candidate is intact, replayable, lineage-complete, evidence-consistent, and governance-linked before intake normalization. It is a fail-fast trust gate: any integrity failure rejects the candidate and blocks downstream forwarding.

## Tightened Scope

- This phase verifies candidate trust only; it does not normalize, score, deduplicate, prioritize, orchestrate, or grant authority.
- Checks execute in fixed order: canonical payload reconstruction, hash verification, replay references, lineage references, evidence consistency, governance references, final decision.
- Candidate references must be deterministic and resolvable within the candidate tenant and mission context.
- Failed candidates emit immutable audit and ledger evidence and cannot proceed to normalization.
- Replay reconstructs the verification result hash, state, and deterministic failure reason.

## Implementation

- `types/decision-candidate-integrity-verification.ts` defines verification states, failure reasons, request/result contracts, hash/replay/lineage/evidence/governance records, audit records, ledger records, replay, intake bridge, and observability.
- `services/decision-candidate-integrity-verification/index.ts` implements canonical candidate hashing, fail-fast integrity verification, schema and intake adaptation, immutable evidence records, replay verification, and metrics.
- `tests/unit/decision-candidate-integrity-verification/decisionCandidateIntegrityVerification.test.ts` covers pass behavior, hash failures, replay failures, lineage failures, evidence failures, governance failures, intake integration, replay, ledger/audit evidence, and observability.

## Public API

- `computeCandidateCanonicalHash`
- `createIntegrityVerificationRequest`
- `verifyDecisionCandidateIntegrity`
- `integrityVerificationRequestFromIntake`
- `verifyIntegrityForIntake`
- `replayIntegrityVerification`
- `buildIntegrityVerificationObservability`
- `getDecisionCandidateIntegrityVerificationEngine`
