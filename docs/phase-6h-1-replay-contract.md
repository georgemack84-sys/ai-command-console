# Phase 6H.1 Replay Contract

Phase 6H.1 defines the deterministic replay contract for Mission Control. It is a contract foundation only: it does not execute replay, compare reconstructed outputs, call tools, fetch network resources, mutate source truth records, or expose an operator interface.

Replay is reconstruction-oriented. A valid replay contract must preserve tenant scope, governance context, evidence bindings, lineage bindings, source identity, deterministic ordering, and auditability. The contract grants no execution authority. The only allowed write boundary is no write or replay-audit-only output.

## Contract Schema

The replay contract captures replay identity, tenant and mission scope, replay type, target, requester, source truth records, optional source events, evidence, lineage, policy and prior replay references, deterministic ordering, governance context, authority context, input integrity, deterministic requirements, expected result shape, failure policy, output policy, audit policy, lifecycle state, certification state, and a canonical contract hash.

## Validation

The validator fails closed for missing identity, missing tenant scope, unsupported replay or target types, incompatible replay targets, missing source truth records, missing evidence or lineage when required by replay type, missing governance context for governance-sensitive replay, non-deterministic ordering, authority expansion, source mutation, execution authority, weak audit policy, and invalid lifecycle or certification states.

Partial replay is allowed only as an escalation state. Invalid contracts are rejected before any future execution phase can run.

## Governance And Authority

Replay cannot bypass governance. Governance replay and recommendation replay require policy references or policy context. Enforcing original policy context requires a policy snapshot. Any governance mismatch under fail-closed policy invalidates the contract.

Authority context must use `execution_authority: "NONE"`, must block authority expansion, must verify read authority, and must restrict writes to `NONE` or `REPLAY_AUDIT_ONLY`.

## Determinism And Hashing

Replay contracts require stable JSON serialization, SHA256 hashing, deterministic total ordering, and a stable tie breaker. Wall-clock time, random dependencies, external network access, and uncontrolled tool use are invalid.

The contract hash is generated from governance-meaningful fields only: identity, tenant, mission, replay type, scope, target, source references, ordering, governance context, authority context, deterministic requirements, failure policy, output policy, and audit policy. Mutable metadata such as `updated_at` is excluded.

## Lifecycle And Certification States

Lifecycle transitions are explicitly bounded:

- `REQUESTED -> VALIDATED`
- `REQUESTED -> REJECTED`
- `VALIDATED -> READY`
- `READY -> RUNNING`
- `RUNNING -> COMPLETED | MISMATCH | FAILED`
- `MISMATCH -> ESCALATED`
- `COMPLETED -> CERTIFIED`
- `CERTIFIED -> ARCHIVED`

Certification states are defined for future replay phases: `UNCERTIFIED`, `CONTRACT_VALIDATED`, `REPLAYABLE`, `REPLAY_MATCHED`, `REPLAY_MISMATCHED`, `REPLAY_FAILED`, and `CERTIFIED`.

## Out Of Scope

Phase 6H.1 does not implement replay execution, result comparison, forensic workflows, dashboards, external integrations, network fetchers, file-system replay engines, autonomous remediation, or mutation of historical truth, evidence, lineage, or governance records.
