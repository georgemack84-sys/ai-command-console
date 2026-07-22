# Workstream 2.16 — Operator Console

The Operator Console is the constitutional human control surface for CAF Legion. It gives authorized operators supervisory visibility into runtime activity, governance decisions, evidence, replay, certification state, approvals, and emergency controls.

## Constitutional Scope

- Owns the operator console, operations dashboard, approval queue, evidence explorer, replay explorer, certification explorer, emergency control panel, governance views, notifications, workspaces, security controls, and operational evidence.
- Depends on W2.0 through W2.15 and cannot bypass the Authority Validator, Policy Gate, Safety Gate, Lifecycle Engine, Runtime Orchestrator, Evidence Engine, Replay Engine, or Certification Engine.
- Produces `OPERATOR_CONSOLE_QUALIFIED`, `CONDITIONALLY_QUALIFIED`, `NOT_QUALIFIED`, or `FAIL_CLOSED`.

## Runtime Contract

- `types/operator-console.ts` defines the typed operator console constitution.
- `services/operator-console/index.ts` implements deterministic assembly, validation, replay hashing, integrity hashing, and bundle publication.
- `app/api/operator-console/*` exposes authenticated route slices for contract, validation, console, dashboard, approvals, evidence, replay, certifications, emergency controls, governance, notifications, workspaces, security, and readiness.

## Control Model

The console is advisory and supervisory. Emergency controls support stop, suspension, isolation, cancellation, delegation revocation, takeover, quarantine, safe shutdown, and recovery initiation, but every action requires authenticated operators, role authorization, constitutional authority, policy validation, safety validation, signatures, immutable audit, and tenant isolation.

## Verification

Run the focused operator console suite:

```powershell
npx vitest run --config vitest.config.mjs tests/unit/operator-console/operatorConsole.test.ts
```

Run a scoped typecheck for the W2.16 type, service, and API routes, then run the cumulative W1/W2 chain through `tests/unit/operator-console/operatorConsole.test.ts`.
