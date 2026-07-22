# MC-11 — Institutional Memory

Institutional Memory is Mission Control's durable organizational knowledge layer. It transforms validated operational evidence into governed lessons, patterns, lineage, guidance, search, and reports without creating decisions or initiating execution.

## Constitutional Scope

- Owns organizational knowledge capture, institutional repository, knowledge graph, pattern catalog, lineage, validation, learning, search, governance, reports, evidence, and APIs.
- Consumes MC-1 through MC-10, CAF memory/planning, CCI evidence, CCI replay, and CCI immutable event history.
- Rejects unsupported publication, evidence mutation, historical evidence mutation, operational decision creation, execution, autonomous learning, governance bypass, incomplete traceability, and non-deterministic search.

## Runtime Contract

- `types/institutional-memory.ts` defines the MC-11 institutional memory constitution.
- `services/institutional-memory/index.ts` implements deterministic evidence-derived knowledge assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/institutional-memory/*` exposes authenticated route slices for contract, validation, capture, repository, graph, patterns, lineage, validation, learning, search, governance, reports, evidence, APIs, and readiness.

## Verification

Run the focused MC-11 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/institutional-memory/institutionalMemory.test.ts
```

Run a scoped typecheck for the MC-11 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/institutional-memory/institutionalMemory.test.ts`.
