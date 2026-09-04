# Authority Resolver — Phase 6, Part IV

The `ConservativeAuthorityResolver` assigns only a candidate authority type. It
uses the semantic classification and identified source together: a human
instruction can be a `HUMAN_DIRECTIVE`, while a human suggestion remains under
review. Human source alone never inflates a statement into a directive.

Resolved scope and classification are mandatory. Approved policy requires an
approval reference, an approved reference requires explicit designation,
external information requires verification, and agent knowledge requires an
explicit derived/inferred/hypothesis kind. Missing information fails closed to
`REQUIRE_REVIEW`.

Resolution does not create a durable AuthorityRecord, resolve conflicts or
precedence, supersede knowledge, or grant execution permission.
