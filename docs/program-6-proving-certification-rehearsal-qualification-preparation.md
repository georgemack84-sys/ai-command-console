# Program 6 - P6.12 Certification Rehearsal & Qualification Preparation

P6.12 rehearses certification, qualification, evidence, governance, package validation, assessor readiness, operational readiness, readiness dashboards, and final reporting before formal Program Qualification.

## Scope

- Owns certification rehearsal, qualification rehearsal, evidence rehearsal, and governance rehearsal.
- Consumes P6.11 operational exercise evidence plus prior simulation, replay, adversarial, recovery, performance, integration, and exercise reports.
- Produces rehearsal reports, qualification readiness, certification readiness, dashboard status, final rehearsal reports, and immutable readiness evidence.

## Boundaries

P6.12 verifies readiness. It does not issue certification decisions, application certification, platform certification, program qualification, operational certification, trust certification, or production readiness.

## Readiness Rule

READY is only declared when mandatory rehearsals pass or pass with findings, critical findings are resolved, no fail-closed conditions remain, evidence is complete and deterministic, governance is ready, packages are complete, and boundaries are respected. A conditional pass informs remediation but does not authorize progression to formal Program Qualification.

## API Surface

- `GET /api/proving-certification-rehearsal-qualification-preparation/contract`
- `POST /api/proving-certification-rehearsal-qualification-preparation/validate`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/certification`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/qualification`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/evidence-report`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/governance`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/packages`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/assessors`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/operational`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/dashboard`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/final-report`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/evidence`
- `GET|POST /api/proving-certification-rehearsal-qualification-preparation/readiness`
