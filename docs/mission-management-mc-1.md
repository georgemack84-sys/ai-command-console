# MC-1 — Mission Management

Mission Management is the canonical mission model for Mission Control and the Civitas ecosystem. It is the authoritative source for mission definitions, lifecycle state, objectives, assignments, dependencies, timelines, lineage, evidence, governance, and query services.

## Constitutional Scope

- Owns the mission registry, mission lifecycle engine, templates, objectives, assignments, dependencies, timeline, evidence integration, constitutional mission rules, lineage, APIs, observability, and qualification readiness.
- Depends on qualified W1 infrastructure and W2 CAF constitutional runtime services through the Operator Console.
- Enforces one canonical 16-state lifecycle, one 8-phase projection derived only from lifecycle state, and one `MissionLineageStatus` model.
- Rejects alternate lifecycle terminology, mutable identifiers, mutable lineage, non-deterministic transitions, governance bypass, tenant leakage, and replay-incompatible timelines.

## Runtime Contract

- `types/mission-management.ts` defines the MC-1 mission constitution.
- `services/mission-management/index.ts` implements deterministic mission model assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/mission-management/*` exposes authenticated route slices for contract, validation, registry, lifecycle, projection, lineage, templates, objectives, assignments, dependencies, timeline, evidence, rules, APIs, observability, and readiness.

## Verification

Run the focused MC-1 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/mission-management/missionManagement.test.ts
```

Run a scoped typecheck for the MC-1 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/mission-management/missionManagement.test.ts`.
