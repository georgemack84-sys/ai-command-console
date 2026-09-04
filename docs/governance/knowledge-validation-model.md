# Knowledge Validation Model

- Phase: Phase 0, Part V
- Status: Implemented boundary
- Constitutional dependency: [Learning Constitution](learning-constitution.md)
- Input dependencies: classification, scope resolution, and conflict detection

## Purpose

Validation decides whether a candidate has satisfied the structural and evidentiary requirements to proceed to a later learning decision. It does not approve, persist, resolve conflicts, grant authority, or execute anything.

```text
Classification != Validation
Scope != Validation
Conflict Detection != Validation
Valid != Approved
```

## Required inputs

The validator receives a candidate ID, classification result, scope-resolution result, conflict-detection result, attributable provenance, evidence, and optional authority-verification evidence. Incomplete upstream pipeline states fail closed.

## Evidence

Evidence is typed as an operator statement, document, repository observation, tool result, execution result, external source, or agent output. Every evidence item contains a stable ID, source reference, observation time, provenance, and whether it supports the candidate.

Agent output does not count as independent supporting evidence. For example, a Fact requires at least one non-agent supporting evidence item before it can be structurally valid.

## Baseline rule matrix

| Classification or condition | Validation outcome |
| --- | --- |
| Ambiguous classification or unresolved scope | `REQUIRES_CLARIFICATION` |
| Missing provenance | `QUARANTINED` |
| Uncertain or direct conflict | `CONFLICT_REVIEW_REQUIRED` |
| Conversation, brainstorming, or suggestion | `INVALID` for durable admission |
| User-attributed preference in User scope | `VALID` |
| Fact without independent evidence | `REQUIRES_EVIDENCE` |
| Fact with independent evidence | `VALID` |
| Project Decision in Project scope | `REQUIRES_APPROVAL` |
| Correction or Exception with valid target reference | `REQUIRES_APPROVAL` |
| Authoritative Rule | authority verification and approval required |
| Procedure | `REQUIRES_APPROVAL`; never execution permission |

`VALID` is only readiness for a future learning decision. It is not durable admission.

## Side-effect boundary

Every result reports:

```text
persistenceEffect = NONE
authorityEffect = UNCHANGED
executionPermissionGranted = false
```

The Part V service imports no persistence, memory, Prisma, repository, or authority-management module. Approval, durable state transitions, and authority checks remain later responsibilities.
