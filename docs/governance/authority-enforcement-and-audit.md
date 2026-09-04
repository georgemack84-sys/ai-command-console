# Authority Enforcement & Audit — Phase 6, Part IX

The fail-closed `AuthorityGate` evaluates an assigned authority candidate before
a future governed durable write. It allows only a structurally valid,
source-matched, in-scope, non-conflicting record. Unknown authority, ambiguous
source, invalid delegation, missing approval, out-of-scope authority, unresolved
conflicts, and attempted supersession without lifecycle handling are denied or
routed to review.

The append-only `AuthorityLedger` records authority assignment, changes,
challenges, confirmations, revocations, conflict events, knowledge
supersession, and promotion decisions. The ledger captures history; it neither
resolves conflicts nor grants execution permission.
