# Phase 18 — Skill Registry

## Boundary

A procedure describes a method. A skill is an evidence-backed record of observed capability. Procedure references, principles, and candidate metadata must never be treated as proof that Noesis can execute a task.

Capability, authority, and executability remain separate checks. The registry always returns `executionPermissionGranted: false`; authorization and environment availability are decided by their dedicated controls.

## Immutable evidence model

`NoesisSkillArtifact` stores append-only candidate, evidence, evaluation, and lifecycle records. A repeated artifact ID is accepted only when its workspace, identity, and canonical payload match exactly. A conflicting reuse fails closed.

The read projection rebuilds each skill from this history:

- Candidate evidence is deduplicated by `evidenceId`; duplicate submissions cannot inflate a count or mastery estimate.
- Evaluation history produces the latest observed score. Estimated mastery stays `null` until two evaluations exist.
- A human may promote a skill to `PROVISIONAL` only after two recorded evaluations.
- Revocation is a new immutable lifecycle fact. It removes the evidence from the active projection, preserves it in history, and emits a reassessment request.

## Audit coverage

Candidate creation, evidence attachment, evaluation, human promotion/demotion, evidence revocation, reassessment requests, and capability checks are all Phase 10 ledger events. Audit payloads record that no execution permission was granted.

## Operator surface

`/learning/skills` is the protected registry view. It displays status, active evidence, evaluation count, latest observed score, and estimated mastery while preserving the distinction between an assessment and an authority grant.

`GET /api/learning/skills` returns the same read-only projections. `POST /api/learning/skills/capability-check` requires a stored `skillId`, rather than accepting an untrusted capability object, and writes an audit event for the check.
