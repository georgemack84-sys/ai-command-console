# Noesis Phase 15 — Example Library

Phase 15 stores illustrative examples as evidence attached to a principle, procedure, or skill. Examples improve teaching and evaluation coverage; they are never a source of operational authority.

## Safety invariants

- Every example has an explicit parent, compatible scope, provenance, and one of four types: positive, negative, edge case, or counterexample.
- Example text is `ILLUSTRATIVE` or `QUOTED`; it cannot introduce a rule, exception, authority, or execution permission.
- Candidate, validation, review, approval, rejection, invalidation, and supersession are separate immutable artifacts.
- Only a human manager may approve, reject, invalidate, or supersede an example.
- Approval makes an example usable for teaching or evaluation only. It does not alter the parent knowledge record.
- Selection accepts only approved, parent-matched, scope-compatible examples and preserves diversity where possible.
- Coverage counts approval artifacts only; candidates and reviews do not inflate it.
- Invalidation and supersession append lifecycle evidence without editing historical content.

## Manager boundary

The manager page is restricted to workspace managers. Its submission form and review/lifecycle controls call protected APIs; the server establishes actor identity, candidate immutability, timestamps, status, and the execution prohibition.
