# QuantEdge Competitive Intelligence V1.6 Intelligence Delivery Layer

Status: intelligence delivery layer

Next phase: [QCI V1.7 Governance And Replay Layer](./qci-v1-7-governance-replay-layer.md)

## PURPOSE

QCI V1.6 creates controlled intelligence dissemination infrastructure. The Intelligence Delivery Layer is an intelligence distribution engine, visibility control layer, policy enforcement layer, delivery audit layer, ownership-preserving dissemination framework, and recipient authorization system.

Delivery distributes intelligence. Delivery does not create authority.

Delivery exists to distribute intelligence, preserve evidence visibility, support operators, preserve lineage, preserve audit history, and preserve ownership. It does not exist to automate actions, execute workflows, bypass ownership, create recommendations, silently route intelligence, or override operators.

## ARCHITECTURE

V1.6 receives generated signals, validates delivery rules, checks ownership, recipient authorization, visibility, and policy, then creates immutable delivery records and append-only delivery events.

```text
SIGNAL_GENERATED
  -> VALIDATE_SIGNAL
  -> LOAD_DELIVERY_RULES
  -> VALIDATE_OWNERSHIP
  -> VALIDATE_RECIPIENT
  -> CHECK_VISIBILITY
  -> CHECK_POLICY
  -> BUILD_DELIVERY_OBJECT
  -> DELIVER_OUTPUT
  -> RECORD_DELIVERY_EVENT
```

Architectural invariants:

- Identical inputs produce identical delivery decisions.
- Delivery is observable.
- Delivery is replayable.
- Delivery is ownership-bound.
- Visibility is explicit.
- Permissions are mandatory.
- Delivery remains informational only.
- Delivery actions are reconstructable and policy-controlled.

## DATA CONTRACTS

### delivery_record

```text
delivery_id
signal_id
delivery_type
recipient_reference
ownership_hash
delivery_timestamp
delivery_status
schema_version
```

Rules:

- Ownership is mandatory.
- Recipient reference is mandatory.
- Timestamps are mandatory.
- Schema versions are mandatory.

### expanded_delivery_record

```text
delivery_id
signal_reference
signal_category
delivery_type
recipient_reference
recipient_scope
delivery_channel
delivery_reason
ownership_hash
owner_id
tenant_id
evidence_reference
lineage_reference
delivery_status
created_at
delivery_version
```

Rules:

- Delivery records are immutable.
- Ownership is immutable.
- Visibility is immutable.

### delivery_type

Allowed types:

- `OPERATOR_VIEW`
- `DASHBOARD_FEED`
- `EVENT_STREAM`
- `API_OUTPUT`
- `REPORT_OUTPUT`
- `EXPORT_OUTPUT`
- `ALERT_OUTPUT`
- `REPLAY_OUTPUT`

Rules:

- Delivery types are immutable.
- Unknown types are invalid.
- Delivery types are versioned.

### delivery_channel

Supported channels:

- `WEB_UI`
- `API`
- `EVENT_BUS`
- `EXPORT`
- `REPORT`
- `WEBHOOK`
- `DATA_FEED`

Rules:

- Channels are registered.
- Channels are ownership-bound.
- Channel activity is logged.

### recipient

```text
recipient_id
recipient_type
tenant_id
permissions
delivery_scope
```

Recipient types:

- `USER`
- `TEAM`
- `TENANT`
- `SYSTEM`
- `ROLE_GROUP`

Rules:

- Recipient is required.
- Tenant alignment is mandatory.
- Permission validation is mandatory.

### visibility

Allowed visibility:

- `PUBLIC`
- `LIMITED`
- `PRIVATE`
- `TENANT_ONLY`
- `OWNER_ONLY`

Rules:

- Visibility is explicit.
- Hidden visibility is prohibited.
- Visibility is replayable.
- Visibility is versioned.

### delivery_policy

```text
policy_id
delivery_type
allowed_recipients
allowed_channels
visibility_rules
retention_rules
policy_version
```

Rules:

- Policies are append-only.
- Policies are ownership-bound.
- Policies are versioned.
- Policies are replayable.

### delivery_status

Allowed statuses:

- `DELIVERED`
- `QUEUED`
- `BLOCKED`
- `FAILED`
- `REPLAYED`

Definitions:

- `DELIVERED`: successfully distributed.
- `QUEUED`: awaiting distribution.
- `BLOCKED`: policy prevented delivery.
- `FAILED`: delivery unsuccessful.
- `REPLAYED`: reconstructed during replay.

### delivery_event

Required events:

- `DELIVERY_CREATED_EVENT`
- `DELIVERY_COMPLETED_EVENT`
- `DELIVERY_BLOCKED_EVENT`
- `DELIVERY_FAILED_EVENT`

Rules:

- Events are append-only.
- Events are ownership-bound.
- Events are timestamped.
- Events are immutable.

## SERVICES

### Delivery Engine Service

Builds delivery records, executes eligible delivery through registered channels, and records delivery events.

### Recipient Validation Service

Validates recipient existence, recipient type, tenant alignment, permissions, and delivery scope.

### Delivery Policy Service

Loads and enforces append-only delivery policies, allowed recipients, allowed channels, visibility rules, and retention rules.

### Delivery Replay Service

Reconstructs delivery history, policy decisions, recipient routing, visibility decisions, and delivery outcomes.

### Delivery Audit Service

Validates delivery legitimacy, ownership integrity, visibility compliance, recipient authorization, policy enforcement, and lineage continuity.

### Event Store Integration Service

Persists delivery events into the Intelligence Event Store and links delivery records to signal, evidence, and lineage references.

### Visibility Service

Resolves explicit visibility rules and blocks hidden, conflicting, or cross-tenant visibility decisions.

## RULES

Delivery eligibility must validate:

- Signal is valid.
- Ownership is valid.
- Recipient is valid.
- Tenant is aligned.
- Delivery policy is valid.
- Permissions are sufficient.

Ownership requirements:

- `ownership_hash` is required.
- `owner_id` is required.
- `tenant_id` is required.
- Ownership is immutable.
- Cross-tenant delivery is prohibited.

Lineage requirements:

- Signal ancestry is tracked.
- Recipient history is tracked.
- Delivery history is tracked.
- Policy history is tracked.
- Evidence references are tracked.
- Lineage is immutable.
- Lineage is replayable.
- Lineage is complete.

Replay must reconstruct:

- Delivery history.
- Policy decisions.
- Recipient routing.
- Visibility decisions.
- Delivery outcomes.

Replay rules:

- Replay is read-only.
- Replay is deterministic.
- Same inputs produce same outputs.

Audit must validate:

- Delivery legitimacy.
- Ownership integrity.
- Visibility compliance.
- Recipient authorization.
- Policy enforcement.
- Lineage continuity.

Audit states:

- `VALID`
- `LIMITED`
- `INVALID`
- `FREEZE_REQUIRED`

## FAILURE MODES

| Failure | Required response |
| --- | --- |
| `INVALID_SIGNAL` | Block, log, audit, and return failure |
| `RECIPIENT_INVALID` | Block, log, audit, and return failure |
| `PERMISSION_FAILURE` | Block, log, audit, and return failure |
| `TENANT_MISMATCH` | Block, log, audit, and return failure |
| `POLICY_MISSING` | Block, log, audit, and return failure |
| `CHANNEL_UNAVAILABLE` | Block or queue according to policy, log, audit, and return failure |
| `OWNERSHIP_FAILURE` | Block, log, audit, and return failure |
| `VISIBILITY_CONFLICT` | Block, log, audit, and return failure |

## TEST STRATEGY

V1.6 tests must verify:

- Signals are delivered deterministically.
- Ownership is enforced.
- Permissions are validated.
- Cross-tenant delivery is blocked.
- Delivery replay reconstructs routing and outcomes.
- Visibility is enforced.
- Delivery policies are applied.
- Delivery history is reconstructable.
- Invalid signals are blocked.
- Missing policies block delivery.
- Channel failures are logged and audited.
- Delivery remains informational only.

## EXIT CRITERIA

V1.6 is complete only when:

- Signals are deliverable.
- Ownership is enforced.
- Visibility is controlled.
- Delivery is replayable.
- Audit trail is complete.
- Permissions are operational.
- Deterministic delivery is preserved.
- Cross-tenant isolation is enforced.
- Informational-only delivery is preserved.
