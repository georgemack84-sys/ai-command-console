# Canonical Authority Taxonomy — Phase 6, Part II

- Version: 6.2
- Status: Canonical vocabulary

The authority taxonomy identifies the semantic kind of authority asserted for
information. It is not a universal strongest-to-weakest list. Any future
precedence decision must account for scope, delegation, approval, effective
time, and the relationship between records.

| Type | Meaning | Does not imply |
| --- | --- | --- |
| `HUMAN_DIRECTIVE` | Explicit scoped human instruction | truth or execution permission |
| `HUMAN_DECISION` | Deliberate scoped selection | a general directive |
| `HUMAN_CORRECTION` | Explicit correction of prior information | deleting historical information |
| `HUMAN_PREFERENCE` | Scoped recommendation influence | a hard constraint or directive |
| `APPROVED_POLICY` | Formally adopted scoped rule | unlimited scope |
| `APPROVED_REFERENCE` | Designated source for a subject | universal authority |
| `VERIFIED_EXTERNAL_INFORMATION` | Supported external information | project decision rights |
| `AGENT_DERIVED` | Result derived from established information | human establishment |
| `AGENT_INFERRED` | Agent conclusion not explicitly established | human preference or decision |
| `AGENT_HYPOTHESIS` | Provisional proposition for investigation | established knowledge or promotion |

All types remain separate from confidence, evidence, and execution permission.
The authority record, resolver, precedence matrix, conflict outcomes, and gate
are intentionally out of scope for this part.
