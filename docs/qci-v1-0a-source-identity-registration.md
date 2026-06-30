# QuantEdge Competitive Intelligence V1.0A Source Identity And Registration Foundation

Status: source identity and registration foundation

Next phase: [QCI V1.1 Ownership And Identity Foundation](./qci-v1-1-ownership-identity-foundation.md)

## PURPOSE

QCI V1.0A creates deterministic source identities and immutable source registration infrastructure before collection begins. No source may emit intelligence until it is registered, ownership-bound, validated, status-controlled, and preserved as an append-only registry record.

This phase establishes:

- Source identity generation.
- Source registration contracts.
- Ownership binding.
- Metadata standards.
- Source status management.
- Registration validation.
- Duplicate prevention.
- Immutable registry records.

Source registration exists to identify sources, validate ownership, preserve metadata, control eligibility, preserve source lineage, and prevent anonymous collection. It does not exist to dynamically mutate identity, create hidden registrations, bypass ownership, allow unknown collectors, or silently modify sources.

## ARCHITECTURE

V1.0A sits between the QCI foundation doctrine and the collection engine. It turns submitted source definitions into immutable, governed registry records.

```text
SOURCE_SUBMITTED
  -> NORMALIZE_SOURCE_INPUTS
  -> GENERATE_SOURCE_ID
  -> VALIDATE_OWNERSHIP
  -> CHECK_DUPLICATES
  -> ASSIGN_STATUS
  -> REGISTER_SOURCE
  -> LOCK_RECORD
```

Architectural invariants:

- Every stage is observable, auditable, and deterministic.
- Source identities are derived from canonical source inputs.
- Manual source ID editing is prohibited.
- Ownership is mandatory before registration.
- Duplicate attempts are logged and blocked.
- Registry records are append-only and immutable after registration.
- Collection eligibility is controlled only by source status.

## DATA CONTRACTS

### source_id_formula

```text
source_id = HASH(
  tenant_id +
  owner_id +
  normalized_source_name +
  source_type +
  source_uri +
  schema_version
)
```

Rules:

- Identical canonical inputs create identical source IDs.
- Altered canonical inputs create different source IDs.
- Collisions are blocked.
- Identity generation failure blocks registration.

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
registration_timestamp
registered_by
schema_version
registry_record_hash
```

Rules:

- Registry records are append-only.
- Registry records are immutable after creation.
- Ownership is mandatory.
- Schema version is mandatory.
- `registry_record_hash` is deterministic from the canonical registry record.

### source_metadata

```text
source_name
source_type
source_category
source_uri
description
collection_method
refresh_expectation
reliability_notes
data_scope
jurisdiction
created_at
schema_version
```

Rules:

- Metadata must be structured before registration.
- Missing required metadata blocks registration.
- Metadata revisions are appended as new events or revision records.

### ownership_contract

```text
ownership_hash
source_id
owner_id
tenant_id
created_at
ownership_version
```

Rules:

- Ownership is mandatory.
- Ownership is immutable.
- Ownership is reproducible.
- Ownership is visible.
- Ownership deletion is prohibited.
- Missing owner or tenant blocks registration.

### source_status

Allowed statuses:

- `ACTIVE`
- `LIMITED`
- `DISABLED`
- `RETIRED`
- `INVALID`

Eligibility rules:

- `ACTIVE` allows collection.
- `LIMITED` allows restricted collection only.
- `DISABLED` blocks collection.
- `RETIRED` blocks collection.
- `INVALID` blocks collection.

### source_registry_event

Required events:

- `SOURCE_REGISTERED_EVENT`
- `SOURCE_BLOCKED_EVENT`
- `DUPLICATE_SOURCE_EVENT`
- `STATUS_CHANGED_EVENT`
- `OWNERSHIP_VALIDATED_EVENT`

Rules:

- Events are timestamped.
- Events are ownership-bound.
- Events are append-only.
- Events do not trigger collection automatically.

## SERVICES

### Source Identity Service

Normalizes source identity inputs and generates deterministic `source_id` values from tenant, owner, source name, type, URI, and schema version.

### Source Registry Service

Admits valid source records into the append-only registry and returns existing records for duplicate attempts without creating a second registration.

### Ownership Binding Service

Validates owner and tenant existence, creates reproducible ownership hashes, and binds ownership to the source before registration.

### Status Management Service

Assigns initial source status and evaluates collection eligibility from status without mutating the original registry record.

### Duplicate Detection Service

Compares tenant, owner, normalized source name, source type, and source URI with deterministic ordering.

### Registry Event Store

Appends registration, blocked, duplicate, status, and ownership validation events.

### Metadata Validation Service

Validates source metadata shape, required fields, source URI requirements, and schema version before registration.

## RULES

Supported source types:

- `API`
- `WEBSITE`
- `DOCUMENT`
- `MANUAL_INPUT`
- `PUBLIC_FEED`
- `SOCIAL_SOURCE`
- `INTERNAL_FEED`
- `PARTNER_FEED`
- `CUSTOM_SOURCE`

Validation must confirm:

- `source_name` is present.
- `source_type` is supported.
- Owner exists.
- Tenant exists.
- Schema version exists.
- Ownership hash is valid.
- Duplicate source is not found.
- Source URI is valid when required.
- Metadata is complete.

Duplicate control compares:

- `tenant_id`
- `owner_id`
- `normalized_source_name`
- `source_type`
- `source_uri`

Allowed registry changes:

- Append status events.
- Append metadata revisions.
- Append audit records.

Blocked registry changes:

- Edit `source_id`.
- Delete source record.
- Overwrite ownership.
- Modify registration timestamp.
- Remove ownership hash.
- Silently modify source metadata.
- Create hidden registrations.

## FAILURE MODES

| Failure | Required response |
| --- | --- |
| `MISSING_OWNER` | Block, log, audit, and return failure reason |
| `MISSING_TENANT` | Block, log, audit, and return failure reason |
| `INVALID_SOURCE_TYPE` | Block, log, audit, and return failure reason |
| `SOURCE_COLLISION` | Block, log, audit, and return failure reason |
| `DUPLICATE_SOURCE` | Return existing record, block registration, log duplicate attempt, and audit |
| `MISSING_SCHEMA_VERSION` | Block, log, audit, and return failure reason |
| `OWNERSHIP_FAILURE` | Block, log, audit, and return failure reason |
| `INVALID_STATUS` | Block, log, audit, and return failure reason |
| `MISSING_METADATA` | Block, log, audit, and return failure reason |
| `IDENTITY_GENERATION_FAILURE` | Block, log, audit, and return failure reason |

## TEST STRATEGY

V1.0A tests must verify:

- Source IDs are deterministic for identical canonical inputs.
- Source IDs change when canonical identity inputs change.
- Ownership is mandatory before registration.
- Ownership hashes are reproducible.
- Missing owners and tenants block registration.
- Unsupported source types block registration.
- Duplicate registration returns the existing record and blocks a new record.
- Disabled, retired, and invalid sources are blocked from collection eligibility.
- Limited sources are restricted.
- Metadata validation blocks incomplete records.
- Registry records are immutable.
- Events are append-only.
- Status eligibility is enforced without mutating registration records.

## EXIT CRITERIA

V1.0A is complete only when:

- Every source has a deterministic `source_id`.
- Every source has an owner.
- Ownership is immutable.
- Duplicate registration is blocked.
- Disabled sources are blocked from collection.
- Retired and invalid sources are blocked from collection.
- Limited sources are explicitly restricted.
- Source registration records are immutable.
- The registry is append-only.
- Source metadata is standardized.
- Collection eligibility is status-controlled.
- Source registry events are timestamped, ownership-bound, append-only, and auditable.
