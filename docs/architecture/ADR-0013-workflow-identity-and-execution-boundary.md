# ADR-0013: Workflow Identity and Execution Boundary

Status: Accepted — Phase 6.0

## Decision

Proprium will model workflows through three distinct identities:

1. `WorkflowDefinition` is a workspace-scoped design handle. It may be edited as a draft, but it has no execution authority.
2. `WorkflowVersion` is an append-only, hash-addressed published snapshot. A version is immutable and is the only workflow artifact a run may cite.
3. `WorkflowRun` and `WorkflowStepRun` are durable execution evidence. A run copies the exact version snapshot and every retry is a separate, immutable attempt row.

The definition snapshot is deliberately opaque JSON in Phase 6.0. Phase 6.1 will replace it with a validated typed graph. This prevents us from treating early persistence structure as a workflow engine.

## Authority boundary

Neither a workflow definition, a published version, nor a run grants authority. Immediately before each external application handoff, the future coordinator must re-evaluate:

- application lifecycle and service-principal credential state;
- active capability grant and narrowed resource/operation scope;
- policy and approval state; and
- step idempotency key and execution correlation.

The resulting authorization evidence belongs in `WorkflowStepRun.authorizationSnapshot`. A revoked or suspended application must fail admission even when the workflow was published or started earlier.

## Existing infrastructure assessment

| Concern | Existing component | Phase 6 treatment |
| --- | --- | --- |
| Governed mutation admission | `runtimeControl` → `executionEngine` → `toolRouter` | Reuse as the step dispatch boundary; do not route directly to applications. |
| Durable background work | `services/jobQueue.js`, `src/server/jobs/background-jobs.ts` | Reuse for wakeups/retries; workflow state remains in dedicated relational records. |
| Audit evidence | `ActivityEvent`, execution-state stores, Noesis append-only artifacts | Correlate workflow events; retain dedicated run and step facts for reconstruction. |
| Application authority | Phase 5 application registry, principals, credentials, capabilities, grants | Re-check at execution time. Registry metadata and workflow references remain inert. |
| Cross-application invocation | `nuru-governed-invocation-service.ts` | Use as the first narrow adapter pattern; no domain logic moves into Proprium. |

## Consequences

- No distributed transaction coordinator is introduced. Each step has an idempotency key, durable attempt evidence, retry policy, and eventually a compensating action where needed.
- Legacy console plans and workflow runs remain separate identities. A plan is execution admission evidence; it is not a published multi-step workflow definition.
- The Phase 6.0 migration adds no worker, scheduler, or execution API. Those begin only after Phase 6.1 graph validation and Phase 6.2 mutation-free simulation.
