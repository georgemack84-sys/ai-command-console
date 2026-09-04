# Authority Precedence — Phase 6, Part V

Precedence is evaluated between two authority records, a scope, time, and an
explicit relationship intent. It is not calculated from a global authority
ranking. An out-of-scope record coexists; it cannot silently replace a record
in another scope.

An explicit, later, same-source correction or supersession can become a
candidate `CORRECT` or `SUPERSEDE` outcome. The evaluator still makes no state
change. Missing supersession lineage, source mismatch, backdating, and every
revocation request fail closed to `REQUIRE_REVIEW`.

Part VI will determine whether the knowledge content actually conflicts. Part
V only determines whether the stated authority relationship is eligible for
that later handling.
