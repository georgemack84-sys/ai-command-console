# Authority Audit Architecture — Phase 6, Part XIII

The authority ledger stores immutable snapshots, so later caller mutations
cannot rewrite history. It records significant authority events, including
assignments, challenges, changes, revocations, conflicts, supersessions, and
promotion outcomes with their prior/new types, authorizer, and evidence IDs.

`LedgerBackedAuthorityExplanationService` is read-only. It can explain an
authority record through its source, scope, provenance, confidence, evidence,
supersession chain, and ledger history. It does not correct, promote, revoke, or
authorize anything while assembling that explanation.
