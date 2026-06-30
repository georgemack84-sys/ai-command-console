# Phase 8M Bundle B Planning

Status: prepared, not staged

Bundle B covers generated phase expansion only. It must not include Bundle A stabilization files or Bundle C source changes.

## Domain Splits

| Domain | Candidate Scope |
| --- | --- |
| Governance | Governance intelligence, policy, risk, compliance, lineage, replay, integrity, query, and visibility generated families. |
| Autonomy | Autonomy contract, identity, state machine, authority, constitutional constraints, governance interfaces, and final certification generated families. |
| Replay | Replay contract, reconstruction, verification, viewer, historical query, and replay certification generated families. |
| Runtime | Runtime assurance, supervision, observation, drift health, confidence, and stability generated families. |
| Recommendation | Recommendation contract, generation, validation, paths, dependency, resilience, trust, and certification generated families. |
| Mission Control | Mission Control dashboard, graph visualization, investigation workspace, visibility contract, and certification generated families. |
| Truth Ledger | Truth dashboard, ledger explorer, integrity viewer, certification, completion, and visibility generated families. |
| Recovery | Recovery contract, planning, validation, recommendation, replay, intervention, and certification generated families. |
| Planning | Objective decomposition, dependency analysis, planning optimization, alternative planning, contingency planning, and planning confidence generated families. |
| Delegation | Delegation contract, classification, authority validation, routing, orchestration lookup, and certification generated families. |

## Required Bundle B Evidence

- Generated-code ownership map.
- Per-domain file inventory.
- Generated-vs-handwritten lifecycle labels.
- Unit-test coverage statement per domain.
- Build and typecheck impact.
- Replay/governance certification impact.

## Bundle B Entry Criteria

- Bundle A is committed or otherwise isolated.
- Generated files are grouped by domain before staging.
- No unrelated runtime source changes are included.
- Reviewers can accept, defer, or drop each domain independently.

## Bundle B Exit Criteria

- Each generated domain has a named owner.
- Generated modules are covered by tests or explicit certification exceptions.
- Production build and full unit suite are reproven after accepted domains.
- Remaining generated domains are deferred with documented rationale.
