# Phase 10.8.9 - Governance Explainability & Replay

The Governance Explainability & Replay module is the transparency and reproducibility engine for the Governance-Aware Adaptation Layer. It explains governance outcomes and reconstructs the full validation process with deterministic, byte-identical replay.

## Tightened Prompt

Explain every governance validation outcome with evidence-backed, human-readable reasoning. Attribute policy decisions, constitutional protections, authority boundaries, tenant isolation, evidence, certification readiness, escalation triggers, restrictions, violations, and final validation state to immutable inputs. Reconstruct the complete validation sequence and verify replay with identical inputs, intermediate states, final decisions, evidence attribution, ledger entries, and integrity hashes.

The module must remain constitution-first, deterministic, explainable, replayable, evidence-backed, advisory-only, human-readable, governance-enforced, fail-closed, tenant-isolated, immutable, audit-ready, lineage-preserving, and byte-identical. It never generates new governance decisions; it explains and reproduces decisions already made.

## Implemented Scope

- Typed explainability contract in `types/governance-explainability-replay.ts`.
- Deterministic service in `services/governance-explainability-replay`.
- Required `GovernanceAdaptationValidation` object with governance, constitutional, authority, tenant, replay, evidence, certification, approvals, violations, restrictions, escalations, final state, and integrity hash fields.
- Governance explanation report, decision narrative, policy attribution, constitutional reasoning, authority explanation, evidence attribution graph, restriction explanation, escalation explanation, replay trace, replay verification, replay metadata, and explainability ledger entry.
- Validation chain reconstruction across Modules 10.8.1 through 10.8.8.
- Authenticated APIs under `/api/governance-explainability-replay/*`.

## API Surface

- `GET /api/governance-explainability-replay/contract`
- `POST /api/governance-explainability-replay/explain`
- `POST /api/governance-explainability-replay/validation`
- `POST /api/governance-explainability-replay/policy-attribution`
- `POST /api/governance-explainability-replay/constitutional-reasoning`
- `POST /api/governance-explainability-replay/authority-explanation`
- `POST /api/governance-explainability-replay/evidence-attribution`
- `POST /api/governance-explainability-replay/escalation-restriction`
- `POST /api/governance-explainability-replay/replay-trace`
- `POST /api/governance-explainability-replay/replay-verification`
- `POST /api/governance-explainability-replay/ledger`
- `POST /api/governance-explainability-replay/replay`
- `POST /api/governance-explainability-replay/inspect`

## Validation States

- `APPROVED_FOR_SIMULATION`
- `REQUIRES_OPERATOR_REVIEW`
- `REQUIRES_GOVERNANCE_REVIEW`
- `REQUIRES_CONSTITUTIONAL_REVIEW`
- `RESTRICTED`
- `REJECTED`
- `FAIL_CLOSED`

## Fail-Closed Conditions

- Governance evidence missing
- Unknown constitutional implications
- Missing replay capability
- Unclear authority impact
- Tenant boundary risk
- Prohibited domain impact
- Reduced operator visibility
- Weakened auditability
- Historical truth mutation
- Execution behavior change without approval
- Incomplete governance lineage
- Nondeterministic constitutional validation
- Unresolved approval requirements
- Unavailable rollback path
- Evidence integrity failure
- Governance ledger integrity failure
- Replay divergence
- Unresolved certification dependencies
- Explanation generation failure
- Incomplete evidence attribution
- Inconsistent replay metadata
- Integrity verification failure

## Certification Notes

- Fully explainable results require complete narratives, policy attribution, constitutional reasoning, authority explanations, evidence attribution, escalation/restriction explanations, complete lineage, and replay metadata.
- Replay succeeds only when validation sequence, policy evaluation, rule execution, violations, escalations, restrictions, evidence attribution, final decision, and integrity hashes match.
- The module is explanatory and replay-oriented; it does not create or override governance decisions.
