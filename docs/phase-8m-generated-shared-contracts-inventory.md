# Phase 8M.25 Generated Shared Contracts Inventory

Status: inventoried and validated before staging

## Summary

- Candidate path entries: 16.
- Candidate files: 36.
- API files: 23.
- Service files: 3.
- Unit test files: 3.
- Type files: 3.
- Generated documentation files: 4.

## Included Contract Families

- Compliance contract.
- Escalation contract.
- Prediction contract.

## Included Paths

API roots:

- `app/api/compliance-contract/`
- `app/api/escalation-contract/`
- `app/api/prediction-contract/`

Service roots:

- `services/compliance-contract/`
- `services/escalation-contract/`
- `services/prediction-contract/`

Test roots:

- `tests/unit/compliance-contract/`
- `tests/unit/escalation-contract/`
- `tests/unit/prediction-contract/`

Type files:

- `types/compliance-contract.ts`
- `types/escalation-contract.ts`
- `types/prediction-contract.ts`

Generated docs:

- `docs/phase-7d-1-compliance-contract.md`
- `docs/phase-7f-1-escalation-contract.md`
- `docs/phase-8alt-3-1-prediction-contract.md`
- `docs/phase-8m-generated-shared-contracts-manifest.md`

## Explicit Exclusions

- Remaining non-contract generated artifacts, including decision influence, historical intelligence, risk forecasting, violation patterns, and related services/tests/types/docs.
- Source changes.
- Phase 8M stabilization leftover.
- Unrelated documentation.
- Test repair.
- Archive candidates.
- Experimental files.

## Ownership

Platform contracts owner with review from Certification, Governance, Replay, and Recommendation owners because the contracts define cross-domain validation, replay, governance, and evidence surfaces.

## Dependencies

- Certification generated domain.
- Governance generated domain.
- Replay generated domain.
- Recommendation generated domain.
- Risk and intelligence generated artifacts that remain outside this commit.

## Downstream Consumers

- Compliance certification and evaluation flows.
- Escalation certification, detection, and prioritization flows.
- Prediction, risk forecasting, and historical intelligence flows.
- Replay, validation, evidence, and governance review paths that consume stable DTO and contract surfaces.

## Compatibility Requirements

- Contract schemas must remain deterministic.
- Replay serialization must stay stable.
- Governance and certification evidence fields must remain explicit.
- Cross-domain DTOs must avoid runtime-only coupling.
- Validation contracts must be typecheck-clean before integration.

## Architectural Risk

High. Shared Contracts define cross-domain compatibility and can affect certification, replay fidelity, governance review, evidence generation, and downstream generated services.

## Validation Required

- Shared Contracts Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff allowlist guard.
