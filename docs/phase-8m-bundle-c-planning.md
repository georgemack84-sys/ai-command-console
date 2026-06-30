# Phase 8M Bundle C Planning

Status: prepared, not staged

Bundle C covers source changes that may affect runtime behavior, app presentation, build configuration, service exports, or shared type contracts.

## Initial Candidate Paths

```text
app/globals.css
app/layout.tsx
next.config.ts
services/recommendation-constraint/index.ts
services/simulation-engine/index.ts
services/simulation-engine/types.ts
app/api/v1/runtime/health/route.ts
modified service exports
modified shared types
```

## Review Questions

- Does the change alter production behavior?
- Does the change affect build/runtime configuration?
- Does the change alter public service exports?
- Does the change affect replay, governance, tenant isolation, or advisory-only guarantees?
- Is there a targeted test proving the contract?

## Required Bundle C Evidence

- File-by-file diff review.
- Runtime and build impact assessment.
- Typecheck and lint evidence.
- Targeted unit tests for changed contracts.
- Production build proof before release eligibility.

## Bundle C Entry Criteria

- Bundle A is isolated.
- Bundle B generated expansion is not staged with source changes.
- Every source change has an owner and rationale.

## Bundle C Exit Criteria

- Accepted source changes are committed in a narrow review bundle.
- Deferred source changes are documented.
- Production build and relevant tests pass.
- Certification assessment is updated with the runtime impact.
