# Stage 6 - Explainability

Stage 6 implements constitutional explainability for every CATA trust decision. Explainability is treated as a constitutional requirement, not a UI feature.

## Role

- Consumes Stages 1 through 5.
- Produces deterministic decision narratives, evidence maps, rule traces, constitutional justifications, restriction explanations, escalation explanations, and complete trust explanation packages.
- Derives every explanation exclusively from immutable evidence and deterministic evaluation/resolution records.
- Prevents unexplained trust decisions from existing.

## Service Contract

- `runTrustExplainabilityStageSix(input)` returns architecture, narrative, evidence map, rule trace, constitutional justification, restriction explanations, escalation explanations, package, APIs, readiness, replay hash, and integrity hash.
- `validateTrustExplainabilityStageSix(result)` verifies evidence-backed explanation completeness, deterministic replay, immutable package assembly, tenant isolation, and no unexplained decisions.
- `replayTrustExplainabilityStageSix(result)` proves deterministic package replay.
- `getTrustExplainabilityStageSixBundle()` publishes doctrine, result, and validation envelope.

## API Surface

All routes require an authenticated workspace member.

- `GET /api/trust-explainability-stage-six/contract`
- `POST /api/trust-explainability-stage-six/validate`
- `GET|POST /api/trust-explainability-stage-six/architecture`
- `GET|POST /api/trust-explainability-stage-six/narrative`
- `GET|POST /api/trust-explainability-stage-six/evidence-map`
- `GET|POST /api/trust-explainability-stage-six/rule-trace`
- `GET|POST /api/trust-explainability-stage-six/constitutional`
- `GET|POST /api/trust-explainability-stage-six/restrictions`
- `GET|POST /api/trust-explainability-stage-six/escalations`
- `GET|POST /api/trust-explainability-stage-six/package`
- `GET|POST /api/trust-explainability-stage-six/apis`
- `GET|POST /api/trust-explainability-stage-six/readiness`

## Qualification

Stage 6 qualifies when every trust decision is fully explained, evidence lineage is complete, rule ordering is deterministic, constitutional reasoning is documented, restriction and escalation explanations are complete, packages are immutable and replayable, and APIs enforce tenant isolation and governance.
