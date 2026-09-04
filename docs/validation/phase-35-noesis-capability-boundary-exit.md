# Phase 35 — Noesis Capability Boundary Exit

## Outcome

Phase 35 creates a mechanical STOP between learning/competence and executable authority. Certification, retention, adversarial success, skill discovery, and available tools can support a capability request but cannot create, expand, renew, reactivate, or execute a capability grant.

## Enforced invariants

- Capability requests and grants are immutable, workspace-scoped authorization artifacts separate from all learning stores.
- Approval requires a distinct human authorizer and a bounded future expiry.
- Preflight fails closed for no grant, actor/resource/operation/scope mismatch, unsatisfied constraint, suspension, revocation, expiry, and unavailable tools.
- A grant’s lifecycle is append-only; revocation overrides earlier authority.
- Renewal is prohibited as implicit reactivation and requires a new separately authorized request/grant.
- All learning subsystems are mechanically blocked from mutating authorization state.
- Every recorded preflight decision and lifecycle transition is auditable.

## Validation

```text
tests/unit/learning-constitution/capabilityBoundary.test.ts      5 passed
tests/unit/learning-constitution/phase35Acceptance.test.ts      1 passed
npx tsc --noEmit --pretty false                                 passed
npx prisma migrate status                                       database schema up to date
```

The acceptance lifecycle supplies extreme competence evidence (certification, long-term retention, adversarial success, and tool availability), verifies that operation is blocked without a grant, permits the exact scoped operation only after separate human approval, then verifies that the same operation is blocked immediately after revocation.
