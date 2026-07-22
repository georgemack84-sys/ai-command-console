# MC-5 — Replay & Operational Evidence

Replay & Operational Evidence provides deterministic reconstruction of Mission Control activity from the authoritative CCI Event History. Replay is read-only and never alters historical records or operational state.

## Constitutional Scope

- Owns replay reconstruction, replay sessions, timeline reconstruction, mission state reconstruction, operational evidence integration, divergence detection, replay reports, viewer backend, operational evidence index, replay security, and performance qualification.
- Consumes MC-1 through MC-4 plus W2 Replay, W2 Evidence, W2 Operator Console, W1 Registry, and W1 Identity.
- Derives exclusively from CCI Event History. Mission Control does not own an independent replay event stream, does not create synthetic events, and does not infer operational history.

## Runtime Contract

- `types/operational-evidence-replay.ts` defines the MC-5 replay and evidence constitution.
- `services/operational-evidence-replay/index.ts` implements deterministic reconstruction assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/operational-evidence-replay/*` exposes authenticated route slices for contract, validation, reconstruction, sessions, timeline, state, evidence, divergence, reporting, viewer, index, security, performance, and readiness.

## Verification

Run the focused MC-5 suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/operational-evidence-replay/operationalEvidenceReplay.test.ts
```

Run a scoped typecheck for the MC-5 type, service, and API routes, then run the cumulative W1/W2/MC chain through `tests/unit/operational-evidence-replay/operationalEvidenceReplay.test.ts`.
