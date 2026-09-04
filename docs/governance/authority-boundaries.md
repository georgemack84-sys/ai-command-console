# Authority Boundaries — Phase 6, Part VII

Every authority record has an explicit scope. The boundary evaluator applies it
only to an exact scope, a subject with an explicit parent-scope link, or a
`GLOBAL` authority record. A different identity is out of scope; a hierarchy
the evaluator cannot prove requires review rather than silent promotion.

Knowledge authority remains separate from execution authority. The learning
subsystem can only return `SEPARATE_ACTION_AUTHORIZATION_REQUIRED`; it cannot
grant a capability, modify a scheduler, or authorize an action.
