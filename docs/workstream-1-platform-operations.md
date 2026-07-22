# W1.9 Platform Operations

W1.9 establishes the production operations platform for deploying, operating, maintaining, recovering, scaling, and governing Civitas Core Infrastructure and CAF Legion Runtime.

## Constitutional Scope

- Owns deployment, release, backup, recovery, rollback, scaling, incident, operational dashboard, readiness, qualification, and operational evidence lifecycles.
- Consumes qualified Identity, Storage, Messaging, Registry, Configuration, Observability, Security, and CAF Legion Runtime infrastructure.
- Fails closed for invalid qualified dependencies, nondeterministic deployment, unrestorable backups, rollback that cannot restore qualified state, scaling tenant/governance violations, operator supremacy failure, operational governance failure, tenant isolation failure, mutable evidence, or invalid operational replay.

## Implementation

- Contract: `types/platform-operations.ts`
- Service: `services/platform-operations/index.ts`
- API: `app/api/platform-operations/*`
- Tests: `tests/unit/platform-operations/platformOperations.test.ts`

## Qualification

The qualification suite verifies deterministic deployment, governed release approvals, immutable/restorable backups, deterministic recovery, rollback to prior qualified state, governed scaling, incident traceability, complete operational dashboards, production readiness, immutable replayable evidence, conditional qualification, gate failure, and fail-closed critical operations defects.

The canonical successful readiness decision is `PLATFORM_OPERATIONS_QUALIFIED`.
