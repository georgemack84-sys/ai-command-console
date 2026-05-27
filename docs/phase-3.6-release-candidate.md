# Phase 3.6 Release Candidate Notes

Status: release candidate ready

## Summary

Phase 3.6 hardening is packaged as a non-feature release focused on release-gate reliability, deterministic validation, production startup strictness, standalone deployment clarity, worker attachment verification, and console optimization closure.

No additional console optimization is recommended for this release. Production evidence showed `/console` is stable under standalone runtime, with authenticated load returning 200 and no production hotspot requiring further work.

## Included Hardening

- Partitioned release test gate via `npm run test:release`.
- Vitest release-runner stabilization for large-suite worker pressure and timeout recovery.
- Confidence-engine red-team contract repair preserving fail-closed governance and replay safety.
- Production environment validation consistency for required managed auth secret handling.
- Production continuity validation repair with required startup scopes preserved.
- Health/readiness memory signal correction so runtime reporting reflects live process state.
- Standalone production startup path through `npm run start:standalone`.
- Worker attachment verification under standalone runtime.
- Deployment documentation updates for standalone startup, worker startup, readiness, health, and continuity requirements.
- `/console` optimization closure based on production comparison evidence.

## Governance Summary

- Release-gate stabilization preserves full release coverage through deterministic partitioned execution.
- Fail-closed startup governance remains intact for managed environment validation, auth secret requirements, and continuity validation.
- Continuity startup validation is required before production runtime readiness can be trusted.
- Standalone deployment is certified through `npm run start:standalone`, which preserves guarded preflight and startup-governor checks before launching `.next/standalone/server.js`.
- External worker attachment is verified separately from web startup, with readiness/health requiring a visible worker heartbeat for worker-attached certification.
- Confidence-engine red-team repairs preserve replay-safety and suspicious-evidence rejection behavior.
- Dev-mode memory and route costs are classified as bounded runtime noise unless production evidence proves otherwise.
- `/console` optimization is closed for Phase 3.6 because production runtime evidence does not justify further changes.

## Certification Evidence

- `npm run test:release`: pass, 2517 release files across 173 partitions.
- `npx tsc --noEmit --pretty false`: pass.
- `npm run lint`: pass.
- `npm run build`: pass.
- `npm run test:legacy`: pass.
- Standalone runtime smoke: pass.
- Worker attached during standalone smoke: yes, `activeWorkers >= 1`.
- Readiness: `ready`.
- Health: `ok`.
- Queue: visible and stable.
- `/auth`: 200.
- Authenticated `/console`: 200.

Accepted warnings:

- Known local runtime residue warning may appear during preflight when tracked legacy runtime paths are dirty.
- Missing `AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL` remains an in-app-only alert delivery warning.
- Next.js standalone deployments should use `npm run start:standalone`; `npm run start` is retained for local or legacy start-path checks.

## Deployment Notes

Use the guarded standalone command for production-style startup:

```bash
npm run start:standalone
```

Run the worker as a separate process:

```bash
npm run worker:jobs
```

Verify before routing traffic:

```bash
GET /api/ready
GET /api/health
```

For standalone deployments, prefer absolute SQLite storage paths so the standalone server and external worker share the same runtime store.

## Release Gate

Use `npm run test:release` as the Phase 3.6 release Vitest gate. The monolithic Vitest command remains useful diagnostically, but it is not the release blocker for this repository scale.

## Optional Soak

Before live cutover, a bounded 30-120 minute soak is recommended:

- readiness remains `ready`;
- health remains `ok`;
- worker heartbeat remains visible;
- queue remains stable;
- continuity validation remains valid;
- no restart loop or monotonic memory growth appears.

## Release Candidate

Recommended branch: `release/phase-3.6`

Recommended tag after review/commit: `phase-3.6-rc1`
