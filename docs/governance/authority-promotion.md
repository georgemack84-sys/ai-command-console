# Authority Promotion — Phase 6, Part XI

Authority promotion is an explicit, append-only event. Evidence-backed,
authorized transitions from `AGENT_HYPOTHESIS` to `AGENT_INFERRED` and from
`AGENT_INFERRED` to `AGENT_DERIVED` may be recorded. The underlying record is
never rewritten by the promotion service.

No agent category can become a human authority category. Attempts to promote an
agent inference into a human preference or decision are rejected and recorded as
`PROMOTION_REJECTED` ledger events. Human authority requires actual human
establishment through the normal resolver and gate flow.
