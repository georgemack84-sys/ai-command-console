# Noesis Phase 16 — Preference Learning

Preferences are contextual guidance for one owner. They are not facts, principles, directives, or universal rules.

## Safety invariants

- Every preference identifies its owner, scope, evidence, strength, and provenance.
- `MANDATORY` remains scoped; it never implies global applicability.
- Direct human instructions bypass preference resolution.
- Human review is required before candidate preferences become active guidance.
- Reinforcement is append-only and may not expand scope automatically.
- Exceptions, scope narrowing, revocation, and supersession are human lifecycle records.
- Teach-back and corrections are evidence and repair plans only; neither mutates a preference automatically.
- Resolver output is non-executable behavioral guidance.
