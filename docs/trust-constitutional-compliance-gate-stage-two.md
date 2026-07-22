# Stage 2 - Constitutional Compliance Gate

Stage 2 implements the Constitutional Compliance Gate as the mandatory admission point for every request entering the CATA Trust Framework.

## Role

- Consumes Stage 1 Trust Foundation and the trust constitution, architecture, doctrine, vocabulary, registry contracts, event model, CCI identity/governance/evidence services, and CAF authority model.
- Evaluates constitutional rules before any trust evaluation, risk assessment, confidence analysis, alignment verification, or human oversight component executes.
- Fails closed on all uncertainty, missing evidence, invalid authority, unknown identity, unknown constitution, dependency failure, timeout, exception, or bypass attempt.
- Records immutable constitutional evidence and deterministic replay records for every request.

## Service Contract

- `runConstitutionalComplianceGate(input)` returns the canonical admission decision, rule evaluation, violations, fail-closed state, evidence package, replay record, and decision record.
- `validateConstitutionalComplianceGate(result)` verifies deterministic admission, immutable evidence, no fail-open paths, mandatory gate ordering, and replay equivalence.
- `replayConstitutionalComplianceGate(result)` proves deterministic replay.
- `getConstitutionalComplianceGateBundle()` publishes the Stage 2 doctrine, result, and validation envelope.

## API Surface

All routes require an authenticated workspace member.

- `GET /api/trust-constitutional-compliance-gate/contract`
- `POST /api/trust-constitutional-compliance-gate/validate`
- `GET|POST /api/trust-constitutional-compliance-gate/rules`
- `GET|POST /api/trust-constitutional-compliance-gate/admissibility`
- `GET|POST /api/trust-constitutional-compliance-gate/violations`
- `GET|POST /api/trust-constitutional-compliance-gate/fail-closed`
- `GET|POST /api/trust-constitutional-compliance-gate/evidence`
- `GET|POST /api/trust-constitutional-compliance-gate/replay`
- `GET|POST /api/trust-constitutional-compliance-gate/readiness`

## Qualification

Stage 2 qualifies only when every request is evaluated by the gate first, admissibility is evidence-backed and replayable, violations are classified and immutable, evidence integrity is verified, and no downstream trust component can execute before admission succeeds.
