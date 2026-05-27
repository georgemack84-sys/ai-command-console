# Registry Rules

1. Registry authority is canonical.
2. Runtime overrides are forbidden.
3. Adapters cannot define governance.
4. Replay requires deterministic metadata.
5. Rollback requires rollback metadata and rollback policy support.
6. Unknown or ambiguous permissions are denied.
7. Runtime behavior may not exceed published runtime capability contracts.
8. Replay bindings must include exact `registryHash` and `capabilityHash`.
9. Published capability changes require a new tool version.
10. Execution enforcement must derive trust, sandbox, and containment from registry capability authority.
11. Replay containment must reconstruct the original runtime authority envelope.
12. Governance attribution is secondary evidence only and cannot widen runtime authority.
13. Governance hashes must bind to capability, sandbox, trust, replay, and authority-lock hashes.
