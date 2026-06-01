# ADR-0002: Require Verification Before Review

Status: Accepted

## Context

Portable evidence artifacts can be tampered with, malformed, or produced by an older policy version. Review UI must not inspect raw export artifacts directly when a verification layer exists.

## Decision

Review UI consumes verification result objects. It does not consume raw export bundles, call builders, call verifiers, import hash utilities, or recompute hashes.

## Alternatives Considered

- Let review UI perform verification inline.
- Let review UI inspect export artifacts directly.
- Let review UI call verifier services during render.

These alternatives were rejected because they mix generation, verification, and inspection in one layer.

## Consequences

- Verification logic remains testable as a pure service.
- UI remains display-only.
- Boundary tests can scan UI source for forbidden imports and calls.

## Related Seal Commits

- `0749f4d` Advisory evidence lifecycle bundle review UI
- `1fc193f` Advisory evidence lifecycle completion bundle review UI
- `3674ed5` Seal advisory evidence lifecycle completion bundle chain
