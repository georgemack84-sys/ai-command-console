# Phase 34 — Noesis Skill Discovery Exit

## Outcome

Phase 34 lets Noesis identify recurring behavior that may deserve representation as a skill while preserving the invariant that discovery is neither competence nor certification.

## Enforced boundaries

- Discovery episodes are immutable, provenance-deduplicated, and safe for discovery.
- A candidate requires at least three episodes, two contexts, and two independent successes.
- Candidate definitions are versioned and include boundaries, non-examples, failure conditions, and evaluation requirements.
- Newly discovered concepts are always `UNTESTED` and `NOT_CERTIFIED`.
- Discovery cannot write to the canonical Skill Registry, modify the Skill Graph, execute learning, or certify a capability.
- Registry/graph overlap can resolve to match, specialization, composition, possible-new-skill, insufficient evidence, or explicit human-boundary-review abstention.
- Human acceptance produces only a governed request for Practice, Evaluation, Adversarial Examination, and Retention.

## Validation

```text
tests/unit/learning-constitution/skillDiscovery.test.ts         8 passed
tests/unit/learning-constitution/phase34Acceptance.test.ts      1 passed
npx tsc --noEmit --pretty false                                 passed
npx prisma migrate status                                       database schema up to date
```

The acceptance lifecycle records diverse observed behavior, creates a candidate concept, compares it against an empty registry, obtains human acceptance for evaluation, creates a governed handoff, and verifies that no certification artifact or registry-write authority is produced.
