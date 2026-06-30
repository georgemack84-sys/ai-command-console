# Phase 8A.4 - Authority Model

## Purpose

The Authority Model establishes explicit, deterministic, constitutional authority boundaries for every Controlled Autonomy capability. Authority is granted, never inferred; validated before every action; replayable; operator-visible; and fail-closed when validation cannot prove permission.

## Implemented Artifacts

- `types/autonomy-authority.ts` defines authority levels, states, assignments, requests, decisions, validation, audit ledger, replay, visibility, and framework types.
- `services/autonomy-authority/index.ts` implements authority assignment, permission evaluation, deterministic decisioning, fail-closed denial handling, audit ledger construction, replay verification, and operator visibility.
- `app/api/autonomy-authority/*` exposes authenticated framework, assign, decide, validate, ledger, replay, and visibility endpoints.
- `tests/unit/autonomy-authority/autonomyAuthority.test.ts` verifies explicit assignment, approval, denial scenarios, fail-closed execution modification, audit history, replay, integrity mismatch detection, and visibility.

## Authority Levels

- Level 0: observation only.
- Level 1: recommendation.
- Level 2: assisted operation requiring approval.
- Level 3: controlled execution within approved limits.
- Level 4: emergency containment, constitutionally bounded and auditable.

## Enforcement Guarantees

The validator rejects self-assigned authority, implicit permission, authority escalation, missing operator approval, governance bypass, expired or violating policy, constitutional violation, unauthorized execution, unauthorized delegation, privilege inheritance, cross-tenant authority, mission scope violations, authority modification during execution, unbounded emergency authority, missing replay references, and integrity mismatch.

## Replay And Visibility

Every decision records authority decision ID, autonomy ID, authority level, requested action, mission, tenant, operator reference, governance profile, policy profile, constitutional profile, approval results, denial reason, replay reference, integrity hash, and timestamp. The visibility surface exposes authority level, status, validation results, denied requests, approval chain, governance and constitutional influence, policy influence, permissions, replay references, and authority history.
