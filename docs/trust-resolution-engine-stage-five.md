# Stage 5 - Trust Resolution Engine

Stage 5 implements the Trust Resolution Engine, the sole constitutional authority for resolving independent trust evidence into one authoritative trust decision.

## Role

- Consumes Stage 1 Trust Foundation, Stage 2 Constitutional Compliance Gate, Stage 3 Trust Registry & Domains, and Stage 4 Independent Trust Evaluation.
- Resolves independent evidence without performing evaluation itself.
- Enforces constitutional precedence, terminal `FAIL_CLOSED`, terminal `DENY`, pending `ESCALATE`, preserved restrictions, and `ALLOW` only when all requirements are satisfied.
- Produces immutable decision records, evidence, lineage, and replay references.

## Service Contract

- `runTrustResolutionEngine(input)` returns resolution rules, decision composition, standing, restrictions, escalation, final outcome, lineage, readiness, replay hash, and integrity hash.
- `validateTrustResolutionEngine(result)` verifies exactly one decision, deterministic ordering, constitutional precedence, no evaluation performed, explainability, replayability, and immutable lineage.
- `replayTrustResolutionEngine(result)` proves deterministic replay.
- `getTrustResolutionEngineBundle()` publishes doctrine, result, and validation envelope.

## API Surface

All routes require an authenticated workspace member.

- `GET /api/trust-resolution-engine/contract`
- `POST /api/trust-resolution-engine/validate`
- `GET|POST /api/trust-resolution-engine/rules`
- `GET|POST /api/trust-resolution-engine/composition`
- `GET|POST /api/trust-resolution-engine/standing`
- `GET|POST /api/trust-resolution-engine/restrictions`
- `GET|POST /api/trust-resolution-engine/escalation`
- `GET|POST /api/trust-resolution-engine/final`
- `GET|POST /api/trust-resolution-engine/lineage`
- `GET|POST /api/trust-resolution-engine/readiness`

## Qualification

Stage 5 qualifies when every trust request resolves to exactly one authoritative decision, constitutional precedence cannot be bypassed, standing/restrictions/escalation are deterministic, lineage is immutable and traceable, and replay reproduces identical decisions.
