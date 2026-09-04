# Authority Gate — Phase 6, Part XII

`GovernedAuthorityGatedKnowledgeAdmissionService` is the Phase 6 durable-write
boundary. It evaluates the fail-closed authority gate before calling the
existing knowledge-admission service. `DENY` and `REVIEW` stop the flow before
the underlying admission method is invoked; only `ALLOW` forwards the request.

The wrapper preserves the prior knowledge-admission service’s authority-neutral
contract. It adds enforcement at the composition boundary rather than allowing
knowledge admission itself to create or rank authority.
