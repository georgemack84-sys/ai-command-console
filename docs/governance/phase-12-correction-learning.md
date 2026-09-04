# Noesis Phase 12 — Correction Learning

Phase 12 treats a human correction as evidence that existing knowledge, interpretation, reasoning, or execution may need repair. It never treats a correction as ordinary teaching.

## Safety invariants

- A correction is immutable and idempotent at intake.
- Unclear targets are `UNRESOLVED_TARGET`; no durable record is changed.
- Dependency analysis labels records `POTENTIALLY_AFFECTED`; it does not invalidate them.
- Corrected knowledge is a candidate with an explicit scope and non-applicability boundary.
- Generalization is discovery-only until every discovered candidate is independently validated.
- Repair plans require the existing Durable Learning Gate. Only a committed gate decision can precede supersession lineage.
- Regression criteria are stored before counterfactual replay.
- Root-cause and recurring-pattern findings are non-mutating engineering signals.

## Durable records

`NoesisCorrection` stores the immutable intake envelope. `NoesisCorrectionEvidence` stores append-only analyses, impact findings, corrected candidates, repair plans, regression cases, retests, and root-cause analyses. PostgreSQL triggers reject updates and deletes on both tables.

Manager inspection is available at `GET /api/learning/corrections/:correctionId` and `/learning/corrections/:correctionId`.
