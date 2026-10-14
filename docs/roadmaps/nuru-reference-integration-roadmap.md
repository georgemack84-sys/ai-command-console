# Nuru Reference Integration Roadmap

**Status:** Draft — platform and workflow foundations exist in the working tree,
but are not yet merged or release-qualified.
**Purpose:** Make Nuru the first independently deployable application on the
Proprium application platform without weakening Nuru's ownership of its domain
data or Proprium's authority boundaries.
**Related work:** [Ecosystem Platform Phase 5](./ecosystem-platform-phase-5.md),
[Governed Orchestration Phase 6](./governed-orchestration-phase-6.md),
[application-platform boundary](../architecture/ADR-0012-application-platform-boundary.md),
and [workflow identity boundary](../architecture/ADR-0013-workflow-identity-and-execution-boundary.md).

## Outcome

An authorized workspace can use a Nuru evidence-retrieval capability in a
governed Nuru-to-Headline-Flow workflow. Nuru retains its knowledge records and
domain logic; Proprium records application identity, capability grants,
workflow state, approval evidence, and dispatch receipts. A failed, revoked, or
suspended integration fails closed.

## Delivery rules

- A workflow definition, application registration, or capability declaration
  never grants runtime authority by itself.
- Nuru service credentials are scoped, rotatable, revocable, and never exposed
  to the browser, logs, or workflow snapshots.
- The reference integration starts read-only: Nuru retrieves evidence and does
  not publish, curate, or mutate Nuru records for this workflow.
- Sandbox and staging are separate gates. Production dispatch is out of scope
  until a later explicit policy decision.
- Each track needs automated evidence before it can be marked complete.

## Current baseline

| Area | State | Interpretation |
| --- | --- | --- |
| Nuru domain capabilities | Existing | Nuru already owns knowledge, source, curation, research, and audit behavior. |
| Application Platform 5.0–5.9 | Implemented locally | Registry, identities, capabilities, grants, lifecycle, events, health, and Application Center require review, tests, and a mergeable change set. |
| Workflow foundation 6.0–6.6 | Implemented locally | Typed definitions, simulation, admission, authorization, execution evidence, recovery, and observability require the same qualification. |
| Nuru → Headline Flow template | Implemented locally | Typed `retrieve_evidence` then approval-gated `draft_headline` handoff exists; external endpoints are not activated. |
| External staging dispatch | Not started | Staging URLs, principals, grants, and contract verification are intentionally absent. |

## Work plan

### Track 0 — Stabilize the implementation baseline

**Goal:** Convert the local platform/orchestration work into reviewable,
repeatable increments before it is used as an integration dependency.

1. Split the existing work into reviewable change sets: application platform,
   workflow contracts/authorization, sandbox dispatch, and observability/UI.
2. Apply migrations in an isolated development database and prove clean
   migration from the current schema.
3. Run unit, type, lint, documentation, configuration-contract, legacy-state,
   and production build validation for each change set.
4. Record any required environment variables and migration/rollback steps.

**Exit evidence:** All changes are committed, reviewed, green in required CI,
and deployable without untracked database or configuration changes.

### Track 1 — Define the Nuru integration contract

**Goal:** Publish the smallest stable, independently deployable Nuru endpoint.

1. Specify `POST /v1/workflow/evidence:retrieve` with Bearer authentication,
   correlation ID, idempotency key, a maximum 30-second timeout, and a typed
   `evidence` response.
2. Define the exact allowed operation and resource scopes for evidence
   retrieval; deny all unrecognized scopes.
3. Add contract tests for invalid credentials, revoked credentials, invalid
   scope, malformed requests, correlation mismatch, retryable failures, and
   idempotent replay.
4. Add a health/readiness endpoint that exposes no tenant data or credentials.

**Exit evidence:** An independently runnable Nuru service passes its contract
suite against a fixture client and cannot mutate Nuru domain records through
this interface.

### Track 2 — Enroll and authorize Nuru in Proprium

**Goal:** Establish application identity without allowing self-authorization.

1. Register Nuru once per workspace with a stable slug and versioned contract.
2. Declare the Nuru evidence-retrieval capability; verify declaration alone is
   inert.
3. Issue a Nuru service principal and one-time secret using the approved secret
   manager path.
4. Activate Nuru only after an authorized operator approves its lifecycle
   transition.
5. Create a narrowed, independently approved grant for the workflow resource
   scope; test revocation and suspension immediately deny use.

**Exit evidence:** A credential alone cannot impersonate a user or obtain a
grant, and a granted credential is denied after revocation, expiry, or
suspension.

### Track 3 — Qualify the governed reference workflow

**Goal:** Prove the end-to-end control plane before allowing external egress.

1. Register Headline Flow with its draft-only capability and keep it separate
   from Nuru's domain data.
2. Publish the immutable Nuru-to-Headline-Flow workflow version.
3. Simulate with configured applications and capabilities; confirm simulation
   performs no external call.
4. Admit a test run, record human approval for the handoff, and verify every
   step rechecks credential, lifecycle, grant, dependency, and approval state.
5. Exercise terminal failure, retry-wait, recovery, and audit/observatory
   views.

**Exit evidence:** The workflow runs only after explicit authorization and
approval; every attempt has redacted, append-only evidence and is visible to
authorized operators.

### Track 4 — Sandbox dispatch qualification

**Goal:** Allow controlled egress only to the built-in local fixture.

1. Set `WORKFLOW_DISPATCH_MODE=sandbox` and configure only the local sandbox
   base URL.
2. Run workspace-specific verification for Nuru and Headline Flow endpoints.
3. Require a workspace-owner approval of the exact verified target.
4. Dispatch a successful retrieval and drafting scenario, then repeat the same
   idempotency key and prove no duplicate work.
5. Prove timeout, schema mismatch, wrong credential, revoked grant, missing
   approval, and dependency failure all fail closed.

**Exit evidence:** Dispatch receipts preserve request fingerprints and redacted
response evidence; no raw secret or production mutation is possible.

### Track 5 — Staging integration qualification

**Goal:** Prepare independently deployed Nuru and Headline Flow staging
services without enabling production dispatch.

1. Configure the two staging base URLs through deployment secrets, never
   source control or browser configuration.
2. Deploy Nuru's contract endpoint and verify authentication, scope,
   correlation, idempotency, timeouts, and retry classification.
3. Perform the same verification for Headline Flow's drafting endpoint.
4. Run failure-injection, credential rotation, grant revocation, application
   suspension, and rollback exercises.
5. Capture browser accessibility and operator workflow evidence for Application
   Center and Workflow Observatory.

**Exit evidence:** Security, failure, migration, browser, staging, and rollback
evidence satisfies Platform milestone 5.11. Staging validation does not imply
production dispatch approval.

## Release sequence

1. Merge Track 0 as reviewable foundation increments.
2. Release the Nuru endpoint contract and complete Track 1.
3. Activate only a non-production Nuru application instance under Track 2.
4. Complete Tracks 3 and 4 in the local sandbox.
5. Complete Track 5 in staging and formally decide whether any later production
   dispatch work is warranted.

## Explicit non-goals

- Moving Nuru domain records into Proprium.
- Giving Nuru or Headline Flow credentials user impersonation privileges.
- Automatically approving capability grants or workflow steps.
- Enabling production dispatch as part of this roadmap.
- Expanding the integration to high-risk financial applications before Nuru is
  qualified.

## Decision gates

| Gate | Decision owner | Required evidence |
| --- | --- | --- |
| Foundation merge | Code review owner | Green validation and reversible migrations. |
| Nuru activation | Workspace operator | Scoped principal, explicit lifecycle activation, and approved grant. |
| Sandbox egress | Workspace owner | Successful verification of the exact sandbox target and explicit approval. |
| Staging qualification | Release owner | Contract, failure, browser, migration, and rollback evidence. |
| Production dispatch | Product/security governance | Separate policy decision; not implied by staging success. |
