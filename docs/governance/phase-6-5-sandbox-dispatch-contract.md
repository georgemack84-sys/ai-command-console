# Phase 6.5 — Sandbox Dispatch Contract

**Status:** Built-in local sandbox verification, owner approval, and synthetic dispatch available; production dispatch disabled

## Boundary

Workflow authorization, local demonstration outcomes, and outbound dispatch are separate operations.

- A workflow definition never grants application authority.
- Each step must hold a current application credential and active scoped grant.
- Dependent steps require recorded completion of every declared dependency.
- Steps that require human approval must hold an independent durable approval.
- `WORKFLOW_DISPATCH_MODE` defaults to `disabled`.
- Configuring a sandbox URL does not enable dispatch. The built-in local sandbox must first pass health verification and receive explicit workspace-owner approval.

## Required configuration

```dotenv
WORKFLOW_DISPATCH_MODE=sandbox
WORKFLOW_SANDBOX_BASE_URL=http://localhost:5050/api/sandbox/
```

Only the built-in local endpoint is eligible in this release. It is a fixture: it cannot retrieve tenant data or publish externally.

## Required sandbox endpoint contract

Each integration must publish a sandbox endpoint with the following properties before an adapter may be enabled.

| Requirement | Nuru retrieval | Headline Flow drafting |
| --- | --- | --- |
| Endpoint | `POST /v1/workflow/evidence:retrieve` | `POST /v1/workflow/headlines:draft` |
| Credential | Service credential in `Authorization: Bearer` | Service credential in `Authorization: Bearer` |
| Correlation | `X-Workflow-Correlation-Id` | `X-Workflow-Correlation-Id` |
| Idempotency | `Idempotency-Key` | `Idempotency-Key` |
| Timeout | At most 30 seconds | At most 30 seconds |
| Response | JSON object with `evidence` | JSON object with `draft` |

The exact paths may change, but any replacement must preserve the same authentication, correlation, idempotency, bounded-timeout, and response-shape guarantees.

## Local contract fixture

The Console provides deliberately non-production endpoints for adapter development:

`POST /api/sandbox/v1/workflow/evidence/retrieve`

`POST /api/sandbox/v1/workflow/headlines/draft`

`GET /api/sandbox/v1/workflow/health`

They require the same Bearer credential, correlation ID, and idempotency key headers as their eventual independently deployed counterparts. The evidence endpoint verifies the active Nuru credential and grant scope; the drafting endpoint verifies the active Headline Flow credential and grant scope. Both return data marked `sandbox_fixture`. Neither reads Nuru tenant data, calls an external source, nor publishes content.

## Verification gate

Before enabling a dispatch adapter, the sandbox must demonstrate all of the following:

1. Reject an absent, revoked, or incorrect service credential.
2. Echo the supplied correlation and idempotency identifiers in its audit record.
3. Return the same result for a repeated idempotency key without duplicating work.
4. Enforce the supplied resource and operation scope.
5. Respond within the contract timeout or provide a typed retryable failure.
6. Avoid publishing, notifying, or mutating production data.

The verification result is recorded per workspace and sandbox URL. A workspace manager may trigger verification at `POST /api/platform/workflows/dispatch-safety/verify`; a workspace owner must separately approve that exact verified target at `POST /api/platform/workflows/dispatch-safety/approve`.

## Adapter acceptance criteria

The eventual dispatch adapter must:

- Re-run credential, lifecycle, grant, dependency, and approval checks immediately before egress.
- Persist a request fingerprint and redacted response evidence; never persist a raw credential.
- Use one bounded timeout and the workflow step's declared retry policy.
- Fail closed on an unverified endpoint, unexpected response schema, or correlation mismatch.
- Never automatically promote sandbox mode to production mode.

## Built-in dispatcher

`POST /api/platform/workflow-runs/:workflowRunId/steps/:stepKey/dispatch` is limited to `retrieve_evidence` and `draft_headline`. It requires a manager session plus the same one-time service credential and scope checks as step authorization. Before every request it reloads the workspace's sandbox gate, requires a verified owner approval, sends bounded correlated and idempotent requests only to the local fixture, and records the response as the workflow step outcome. It never writes a raw credential to the database.

## Promotion decision

Outbound sandbox dispatch is permitted only after a workspace owner explicitly approves an integration-specific verification result. Production dispatch requires a separate policy decision and is outside Phase 6.5.
