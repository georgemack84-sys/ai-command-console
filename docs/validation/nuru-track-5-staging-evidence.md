# Nuru Track 5 staging evidence

Track 5 is a staging-only qualification. It does not authorize production dispatch.

## Deployment-owner inputs

- `WORKFLOW_STAGING_NURU_BASE_URL` and `WORKFLOW_STAGING_HEADLINE_FLOW_BASE_URL` are stored in deployment secrets, never browser configuration or source control.
- A scoped Nuru principal, Headline Flow principal, and independently approved grants exist in the target workspace.
- Operators have an approved rollback procedure for both services.

## Required recorded exercises

| Exercise | Required result |
| --- | --- |
| Endpoint contract | Authentication, scope, correlation, idempotency, timeout, and retry classification pass. |
| Credential rotation | The replacement works; the rotated credential is denied. |
| Grant revocation and application suspension | Invocation is immediately denied. |
| Failure injection | Timeout, schema mismatch, dependency failure, and rollback fail closed with redacted evidence. |
| Operator/browser review | Application Center and Workflow Observatory remain accessible to authorized operators. |

Record only endpoint identifiers, timestamps, redacted request fingerprints, outcomes, and rollback evidence. Do not record raw credentials, tenant data, or production targets.
