# Program 3 - CAF Legion Human and Operator Interaction

Status: constitutional interaction baseline

Program: Program 3 - Civitas Agent Framework

Phase: P3.9 - Human and Operator Interaction

Dependencies:

- [Program 3 - CAF Legion Constitutional Foundation](./program-3-caf-legion-constitutional-foundation.md)
- [Program 3 - CAF Legion Governance, Authority and Policy Enforcement](./program-3-caf-legion-governance-authority-policy-enforcement.md)
- [Program 3 - CAF Legion Safety and Behavioral Constraints](./program-3-caf-legion-safety-behavioral-constraints.md)

## Purpose

P3.9 establishes the exclusive constitutional interface between human operators and CAF agents. It presents execution requests, captures operator approvals, collects warning acknowledgements, routes escalations, governs interventions, records approval evidence, and produces execution authorization requests.

P3.9 does not own constitutional authority, policy contracts, or safety contracts. It consumes P3.0, P3.7, and P3.8 outputs and records operator interaction around those decisions.

## Canonical Runtime Sequence

```text
Resolve Authority Matrix approval requirement
  -> P3.9 Operator approval when required
  -> P3.7 Authority Gate
  -> P3.7 Policy Gate
  -> P3.8 Safety Gate
  -> Warning disposition
  -> Execution admission
  -> Authorized execution
```

Any attempt to alter, bypass, parallelize, or reorder this sequence is a constitutional violation and fails closed.

## Implementation Surface

The repository exposes the P3.9 baseline through:

- `types/caf-human-operator-interaction.ts`
- `services/caf-human-operator-interaction/index.ts`
- `app/api/caf-human-operator-interaction/contract`
- `app/api/caf-human-operator-interaction/interaction`
- `app/api/caf-human-operator-interaction/approval`
- `app/api/caf-human-operator-interaction/warnings`
- `app/api/caf-human-operator-interaction/escalation`
- `app/api/caf-human-operator-interaction/intervention`
- `app/api/caf-human-operator-interaction/sequence`
- `app/api/caf-human-operator-interaction/evidence`
- `app/api/caf-human-operator-interaction/certification`
- `app/api/caf-human-operator-interaction/validate`

## Exit Criteria

P3.9 is complete when all operator interactions are governed exclusively by the Interaction Framework, authority-driven approvals are resolved and recorded deterministically, warning dispositions are immutable and replayable, escalation and intervention workflows are governed, admission follows the canonical runtime execution sequence, interaction evidence is complete and auditable, observability is complete, and certification passes with deterministic replay.
