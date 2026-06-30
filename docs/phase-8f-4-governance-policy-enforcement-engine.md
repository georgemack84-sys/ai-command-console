# Phase 8F.4 - Governance & Policy Enforcement Engine

## Purpose

The Governance & Policy Enforcement Engine deterministically enforces approved governance decisions, organizational policies, regulatory requirements, and constitutional principles before and throughout Controlled Autonomy execution.

## Delivered

- Governance & Policy Enforcement Engine: `services/governance-policy-enforcement-engine`
- Canonical governance enforcement schemas: `types/governance-policy-enforcement-engine.ts`
- Execution Boundary Engine integration
- Governance, policy, constitutional, regulatory, mission, and runtime evaluations
- Enforcement contract, immutable evidence, Truth Ledger entry, replay result, and visibility surface
- API routes under `/api/governance-policy-enforcement-engine`
- Unit coverage in `tests/unit/governance-policy-enforcement-engine/governancePolicyEnforcementEngine.test.ts`

## API Surface

- `GET /api/governance-policy-enforcement-engine/contract`
- `POST /api/governance-policy-enforcement-engine/enforce`
- `POST /api/governance-policy-enforcement-engine/decision`
- `POST /api/governance-policy-enforcement-engine/evidence`
- `POST /api/governance-policy-enforcement-engine/replay`
- `POST /api/governance-policy-enforcement-engine/ledger`
- `GET /api/governance-policy-enforcement-engine/inspect`
- `POST /api/governance-policy-enforcement-engine/inspect`

## Guarantees

- Governance, constitutional, policy, regulatory, mission, and runtime enforcement with deterministic precedence
- No autonomous governance, policy, compliance, or constitutional rule creation or mutation
- Deterministic ALLOW, ALLOW_WITH_RESTRICTIONS, CHECKPOINT, PAUSE, ESCALATE, BLOCK, and FAIL_SAFE decisions
- Fail-closed behavior for missing policy references, replay mismatch, integrity failures, and unauthorized execution boundaries
- Immutable governance evidence, Truth Ledger recording, replay reconstruction, explainability, tenant isolation, and operator visibility
