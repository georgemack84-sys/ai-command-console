# Workstream 2.15 — Certification Engine

The Certification Engine is the constitutional qualification authority for CAF Legion. It certifies agents, capabilities, skills, and runtime environments before deployment, renewal, federation, or operational promotion.

## Constitutional Scope

- Owns the certification service, qualification gate, registry, lifecycle manager, evidence links, governance controls, certification APIs, certification view, and qualification reports.
- Consumes W2.1 and W2.3 through W2.14 as upstream prerequisites.
- Produces the `CERTIFICATION_QUALIFIED`, `CONDITIONALLY_QUALIFIED`, `NOT_QUALIFIED`, or `FAIL_CLOSED` decision.
- Maintains immutable lineage across draft, review, qualification, certification, suspension, revocation, expiration, and retirement states.

## Runtime Contract

- `types/certification-engine.ts` defines the typed certification constitution.
- `services/certification-engine/index.ts` implements deterministic certification orchestration, replay hashing, integrity hashing, validation, and bundle publication.
- `app/api/certification-engine/*` exposes authenticated slices for the contract, validation, certification service, agents, capabilities, skills, runtime, qualification, registry, lifecycle, evidence, governance, APIs, views, reports, and readiness.

## Qualification Behavior

The baseline path requires all upstream W2 engines to validate, signed certificates to be enabled, evidence and replay references to be linked, lifecycle enforcement to be present, and governance separation of duties to hold. Recoverable missing-surface failures are conditionally qualified. Dependency, integrity, enforcement, replay, and non-determinism failures fail closed.

## Evidence

The certification bundle links evidence packages, replay reports, decision history, runtime history, authority reports, policy reports, safety reports, and immutable certification evidence references. The readiness record is identified as `W2.15-CERTIFICATION-ENGINE-READINESS-001`.

## Verification

Run the focused certification suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/certification-engine/certificationEngine.test.ts
```

Run the scoped typecheck with a temporary include-only config for certification contracts, service, and API routes. Run the cumulative W1/W2 chain through `tests/unit/certification-engine/certificationEngine.test.ts` before marking W2.15 complete.
