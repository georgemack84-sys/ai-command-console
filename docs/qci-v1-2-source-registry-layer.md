# QuantEdge Competitive Intelligence V1.2 Source Registry Layer

Status: source registry layer

Next phase: [QCI V1.3 Intelligence Event Store](./qci-v1-3-intelligence-event-store.md)

## PURPOSE

QCI V1.2 transforms source registration into the only authoritative source definition layer. The source registry becomes the governed source-of-truth for source identity, ownership, trust, lifecycle state, policy attachment, and collection eligibility.

If a source is not registered, it does not exist for QCI collection, analysis, replay, or audit.

The registry exists to govern source definitions, preserve ownership, control collection, preserve metadata, manage trust, manage source lifecycle, and preserve history. It does not exist to silently modify sources, bypass ownership, allow anonymous sources, allow hidden collectors, mutate history, or override governance.

## ARCHITECTURE

V1.2 places the registry between all source requests and downstream collection. Collection services must ask the registry whether a source exists, whether ownership is valid, whether policy exists, and whether collection is allowed.

```text
SOURCE_REQUEST
  -> REGISTRY_LOOKUP
  -> VALIDATE_SOURCE
  -> VALIDATE_STATUS
  -> VALIDATE_OWNERSHIP
  -> LOAD_POLICY
  -> AUTHORIZE_SOURCE
  -> EMIT_REGISTRY_EVENT
```

Architectural invariants:

- Registry behavior is deterministic.
- Registry decisions are observable.
- Registry history is append-only.
- Registry records are immutable.
- Ownership is enforced at lookup and authorization.
- Policies are attached before collection eligibility is granted.
- Status controls collection, and policy controls restrictions.
- Replay reconstructs registry history without live source access.

## DATA CONTRACTS

### source_registry_record

```text
source_id
source_name
source_type
source_category
source_uri
owner_id
tenant_id
ownership_hash
trust_level
status
source_policy_id
registration_timestamp
last_status_change
schema_version
registry_version
registry_hash
```

Rules:

- Ownership is mandatory.
- Schema version is mandatory.
- Registry records are append-only.
- Registry records are immutable.
- `registry_hash` is deterministic from the canonical registry record.

### source_category

Allowed categories:

- `SPORTSBOOK`
- `API`
- `WEBSITE`
- `DOCUMENT`
- `PUBLIC_FEED`
- `SOCIAL_SOURCE`
- `MANUAL_INPUT`
- `PARTNER_SOURCE`
- `INTERNAL_SOURCE`
- `DATA_VENDOR`

Rules:

- Unknown categories are invalid.
- Category changes are versioned.
- Category history is preserved.

### source_type

Allowed types:

- `PULL`
- `PUSH`
- `MANUAL`
- `STREAMING`
- `STATIC`
- `SCHEDULED`

Rules:

- Source type is immutable.
- Collection logic is type-driven.
- Type behavior is deterministic.

### trust_model

Allowed trust levels:

- `HIGH`
- `MEDIUM`
- `LOW`
- `LIMITED`
- `UNTRUSTED`

Rules:

- Trust is explicitly assigned.
- Trust is never silently elevated.
- Trust changes are logged.
- Trust impacts collection permissions.
- `UNTRUSTED` sources are restricted.

### status_model

Allowed statuses:

- `ACTIVE`
- `LIMITED`
- `DISABLED`
- `RETIRED`
- `INVALID`

Collection eligibility:

- `ACTIVE` allows collection.
- `LIMITED` restricts collection.
- `DISABLED` blocks collection.
- `RETIRED` blocks collection and preserves historical use only.
- `INVALID` blocks collection.

### source_policy

```text
policy_id
source_id
allowed_collection_types
rate_limits
refresh_rules
retention_rules
restriction_rules
policy_version
```

Rules:

- Policies are append-only.
- Policies are ownership-bound.
- Policies are versioned.
- Policies are replayable.

### lookup_result

```text
source_id
status
trust_level
ownership_hash
collection_allowed
policy_reference
```

Rules:

- Lookup is deterministic.
- Ownership is attached.
- Collection eligibility is explicit.
- Missing source, policy, ownership, status, trust, schema, or tenant validity blocks lookup authorization.

### registry_event

Required events:

- `SOURCE_REGISTERED_EVENT`
- `SOURCE_STATUS_CHANGED_EVENT`
- `SOURCE_TRUST_CHANGED_EVENT`
- `SOURCE_DISABLED_EVENT`
- `SOURCE_POLICY_UPDATED_EVENT`
- `DUPLICATE_SOURCE_BLOCKED_EVENT`

Rules:

- Events are append-only.
- Events are immutable.
- Events are timestamped.
- Events are ownership-bound.

## SERVICES

### Registry Service

Maintains the authoritative source catalog and blocks unregistered, duplicate, invalid, or cross-tenant source requests.

### Source Policy Service

Loads and validates source policies for allowed collection types, rate limits, refresh rules, retention rules, and restrictions.

### Trust Management Service

Assigns, validates, and appends trust changes without silent elevation.

### Status Management Service

Controls status lifecycle and collection eligibility from `ACTIVE`, `LIMITED`, `DISABLED`, `RETIRED`, and `INVALID` states.

### Registry Replay Service

Reconstructs source lifecycle, ownership history, policy changes, trust history, status history, and registration history from append-only records.

### Registry Event Store

Stores registration events, status history, trust history, ownership history, and policy history as immutable replayable events.

### Source Lookup Service

Returns deterministic lookup results with status, trust, ownership, collection eligibility, and policy references.

## RULES

Registry validation must confirm:

- Source exists.
- Ownership is valid.
- Tenant is valid.
- Policy exists.
- Status is valid.
- Trust is defined.
- Schema is valid.
- Collection is allowed.

Registry event store must preserve:

- Registration events.
- Status history.
- Trust history.
- Ownership history.
- Policy history.

Replay must reconstruct:

- Source lifecycle.
- Ownership history.
- Policy changes.
- Trust history.
- Status history.
- Registration history.

Replay rules:

- Replay is read-only.
- Replay is deterministic.
- Replay supports historical reconstruction.

Audit must validate:

- Ownership integrity.
- Policy integrity.
- Trust integrity.
- Status history.
- Registration completeness.
- Lineage continuity.

Audit states:

- `VALID`
- `LIMITED`
- `INVALID`
- `FREEZE_REQUIRED`

## FAILURE MODES

| Failure | Required response |
| --- | --- |
| `UNKNOWN_SOURCE` | Block, log, audit, and return reason |
| `INVALID_STATUS` | Block, log, audit, and return reason |
| `OWNERSHIP_FAILURE` | Block, log, audit, and return reason |
| `POLICY_MISSING` | Block, log, audit, and return reason |
| `TRUST_UNDEFINED` | Block, log, audit, and return reason |
| `DISABLED_COLLECTION_ATTEMPT` | Block, log, audit, and return reason |
| `CROSS_TENANT_ACCESS` | Block, log, audit, and return reason |
| `INVALID_SCHEMA` | Block, log, audit, and return reason |
| `DUPLICATE_SOURCE` | Block, log, audit, and return reason |

## TEST STRATEGY

V1.2 tests must verify:

- Unknown sources are blocked.
- Duplicate sources are blocked.
- Disabled, retired, and invalid sources are blocked.
- Limited sources are restricted.
- Trust rules are enforced.
- Ownership is enforced.
- Status transitions are controlled and evented.
- Registry replay reconstructs source lifecycle.
- Policies are enforced before collection.
- Cross-tenant access is blocked.
- Registry records and events are append-only.
- Registry lookup returns deterministic eligibility results.

## EXIT CRITERIA

V1.2 is complete only when:

- Registry is authoritative.
- All collectible sources are registered.
- Ownership is enforced.
- Trust management is operational.
- Source policies are enforced.
- Status lifecycle is operational.
- Collection eligibility is enforced.
- Registry replay is operational.
- Registry audit is operational.
- Registry records and events are immutable.
