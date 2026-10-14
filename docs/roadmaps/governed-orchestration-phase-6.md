# Proprium Phase 6 — Governed Orchestration & Cross-Application Workflows

## 6.0 foundation — complete in this slice

- [x] Inventory governed execution, durable job, audit, and application-platform boundaries.
- [x] Establish definition/version/run/step-attempt identities and durable schema.
- [x] Define immutable, hash-addressed version and run snapshots.
- [x] State the execution-time authorization rule: a definition or version never grants authority.
- [x] Preserve emergency grant revocation for suspended and retired applications.

## 6.1 typed workflow contracts — complete in this slice

- [x] Typed DAG definition for capability references, I/O contracts, dependencies, timeouts, failure policies, and approval policies.
- [x] Reject duplicate keys, unknown/self dependencies, cycles, unbound required inputs, invalid output references, incompatible I/O types, and missing approval reasons.
- [x] Preserve the no-authority invariant: a valid definition is still design-time data only.

## 6.2 mutation-free validation and simulation — complete in this slice

- [x] Resolve applications and declared capabilities from an injected registry catalog.
- [x] Emit a deterministic dependency order only when every referenced application is active and every capability is declared.
- [x] Guarantee that simulation dispatches no external call and labels capability-grant/policy checks as execution-time obligations.

## 6.3 coordinator admission — complete in this slice

- [x] Publish append-only, idempotent workflow versions from validated graphs.
- [x] Admit idempotent `READY` runs only from a published snapshot whose current simulation passes.
- [x] Write activity evidence and expose manager-gated publication/run-admission endpoints.
- [x] Guarantee that admission itself dispatches no application step.

## 6.4 per-step authority and policy — complete in this slice

- [x] Fail-closed step authorization verifies an eligible run snapshot, credential, application lifecycle, declared capability, active grant, and narrowed operation/resource scope.
- [x] Approval-required steps are denied until durable approval evidence exists; request payloads cannot self-assert approval.
- [x] Authorization produces evidence only and never dispatches an application call.

## 6.5 durable execution and recovery — complete in this slice

- [x] Persist running step attempts with an immutable input snapshot and authorization evidence.
- [x] Record terminal, completed, and retry-wait outcomes without overwriting earlier attempts.
- [x] Recovery transitions a run back to `READY` but requires fresh authorization and a new idempotency key for the retry.

## 6.6 designer and execution observatory — complete in this slice

- [x] Manager-gated publication/admission APIs provide the initial workflow-library controls.
- [x] Viewer-gated Workflow Observatory lists run lifecycle, attempts, authorization evidence presence, and failures without exposing credentials.

## 6.7 reference workflow and release qualification — in progress

- [x] Nuru → Headline Flow is a typed reference template: Nuru retrieves evidence, Headline Flow owns drafting, and the cross-application handoff requires human approval.
- [x] Added an idempotent Headline Flow reference registration with the `headline.draft` capability; registration remains `DRAFT` and creates no credentials or grants.
- [ ] Explicitly activate Nuru and Headline Flow, issue principals, approve narrowed grants, then publish/simulate against a configured integration environment.
