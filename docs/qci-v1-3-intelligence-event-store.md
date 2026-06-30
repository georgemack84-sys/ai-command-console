# QuantEdge Competitive Intelligence V1.3 Intelligence Event Store

Status: intelligence event store

Next phase: [QCI V1.4 Change Detection Layer](./qci-v1-4-change-detection-layer.md)

## PURPOSE

QCI V1.3 creates the permanent historical memory layer for QuantEdge Competitive Intelligence. The Intelligence Event Store is the authoritative event history, immutable intelligence ledger, replay engine foundation, audit trail source, lineage preservation layer, and ownership preservation layer.

The event store is the source of truth. If an event is not stored, it did not happen.

The event store exists to preserve intelligence history, evidence, ownership, lineage, replayability, audits, and deterministic timeline reconstruction. It does not exist to mutate history, overwrite records, silently remove events, create hidden state, or rewrite ownership.

## ARCHITECTURE

V1.3 stores intelligence history as append-only events. Every event is validated, ownership-bound, duplicate-checked, deterministically identified, indexed, and preserved before it can support replay or audit.

```text
INTELLIGENCE_GENERATED
  -> VALIDATE_EVENT
  -> CHECK_DUPLICATES
  -> VALIDATE_OWNERSHIP
  -> GENERATE_EVENT_ID
  -> APPEND_EVENT
  -> INDEX_EVENT
  -> EMIT_STORE_EVENT
```

Architectural invariants:

- Processing is deterministic.
- Writes are append-only.
- Storage is immutable.
- Failures are observable.
- Ownership is mandatory.
- Timestamps are mandatory.
- Schema versions are mandatory.
- Replay reconstructs history from stored events, not mutable snapshots.

## DATA CONTRACTS

### intelligence_event

```text
intelligence_event_id
event_type
source_id
raw_reference
normalized_reference
ownership_hash
timestamp
detected_at
schema_version
```

Rules:

- Ownership is mandatory.
- Timestamps are mandatory.
- Schema version is mandatory.
- Events are append-only.

### intelligence_event_record

```text
intelligence_event_id
source_id
tenant_id
owner_id
event_type
raw_reference
normalized_reference
lineage_reference
ownership_hash
event_hash
timestamp
detected_at
collection_sequence
event_status
schema_version
event_version
```

Rules:

- Event records are immutable.
- Ownership is immutable.
- References are immutable.
- Tenant and owner identity are mandatory.

### event_id_generation_model

```text
event_id = HASH(
  event_type +
  source_id +
  normalized_reference +
  timestamp +
  schema_version
)
```

Rules:

- Identical canonical inputs produce identical event IDs.
- Manual event IDs are prohibited.
- Collisions are blocked.
- Replay produces the same event IDs.

### event_type

Allowed event types:

- `SOURCE_EVENT`
- `COLLECTION_EVENT`
- `VALIDATION_EVENT`
- `NORMALIZATION_EVENT`
- `ANALYSIS_EVENT`
- `SIGNAL_EVENT`
- `OWNERSHIP_EVENT`
- `STATUS_EVENT`
- `TRUST_EVENT`
- `LINEAGE_EVENT`
- `AUDIT_EVENT`

Rules:

- Unknown event types are invalid.
- Event type is immutable.
- Event types are versioned.

### event_reference

Reference types:

- `raw_reference`: connects the event to original evidence.
- `normalized_reference`: connects the event to transformed artifacts.
- `lineage_reference`: connects the event to ancestry.

Rules:

- References are immutable.
- References are mandatory when applicable.
- References are replayable.

### event_status

Allowed statuses:

- `RECORDED`
- `LIMITED`
- `INVALID`
- `REPLAYED`
- `SUPERSEDED`

Definitions:

- `RECORDED`: valid event stored.
- `LIMITED`: event stored with restrictions.
- `INVALID`: event failed validation.
- `REPLAYED`: event generated from replay.
- `SUPERSEDED`: event is historical but logically replaced.

### event_hash_model

```text
event_hash = HASH(
  event_id +
  ownership_hash +
  references +
  timestamp +
  schema_version
)
```

Rules:

- Event hashes are immutable.
- Event hashes are reproducible.
- Event hashes are auditable.

### index_model

Indexes:

- `source_id`
- `event_type`
- `timestamp`
- `ownership_hash`
- `tenant_id`
- `schema_version`
- `event_status`

Purpose:

- Fast replay.
- Fast audits.
- Deterministic retrieval.

### event_store_event

Required event store events:

- `INTELLIGENCE_EVENT_STORED`
- `INTELLIGENCE_EVENT_DUPLICATE_BLOCKED`
- `INTELLIGENCE_EVENT_REPLAYED`
- `INTELLIGENCE_EVENT_INVALID`

Rules:

- Events are append-only.
- Events are ownership-bound.
- Events are timestamped.
- Events are immutable.

## SERVICES

### Intelligence Event Store Service

Validates, appends, and preserves intelligence event records as immutable source-of-truth history.

### Duplicate Detection Service

Compares event type, source, normalized reference, timestamp, and ownership hash to block or link duplicates deterministically.

### Event Index Service

Maintains deterministic retrieval indexes for replay, audit, source history, tenant history, and status views.

### Replay Service

Reconstructs event sequence, ownership history, source history, event ancestry, timeline history, and lineage history from stored events.

### Event Integrity Service

Generates and verifies event IDs and event hashes, detects collisions, and blocks invalid or corrupted records.

### Audit Service

Validates ownership integrity, event integrity, timestamp integrity, lineage continuity, duplicate controls, and append-only compliance.

## RULES

Ownership requirements:

- Every event requires `ownership_hash`.
- Every event requires `owner_id`.
- Every event requires `tenant_id`.
- Ownership is immutable.
- Ownership is replayable.
- Ownership is verifiable.
- Invalid ownership blocks storage.

Append-only storage rules:

- `CREATE` is allowed.
- `APPEND` is allowed.
- `READ` is allowed.
- `REPLAY` is allowed.
- `UPDATE` is blocked.
- `DELETE` is blocked.
- `OVERWRITE` is blocked.
- `MUTATE` is blocked.

Duplicate control compares:

- `event_type`
- `source_id`
- `normalized_reference`
- `timestamp`
- `ownership_hash`

Duplicate rules:

- Duplicate logic is deterministic.
- Duplicates are logged.
- Replay cannot create duplicates.
- Duplicate events are blocked or linked according to explicit policy.

Replay must reconstruct:

- Event sequence.
- Ownership history.
- Source history.
- Event ancestry.
- Timeline history.
- Lineage history.

Replay rules:

- Replay is read-only.
- Replay is deterministic.
- Replay supports historical reconstruction.

Audit must validate:

- Ownership integrity.
- Event integrity.
- Timestamp integrity.
- Lineage continuity.
- Duplicate controls.
- Append-only compliance.

Audit states:

- `VALID`
- `LIMITED`
- `INVALID`
- `FREEZE_REQUIRED`

## FAILURE MODES

| Failure | Required response |
| --- | --- |
| `DUPLICATE_EVENT` | Block or link, log, audit, and return reason |
| `EVENT_COLLISION` | Block, log, audit, and return reason |
| `INVALID_SCHEMA` | Block, log, audit, and return reason |
| `MISSING_OWNERSHIP` | Block, log, audit, and return reason |
| `UNKNOWN_SOURCE` | Block, log, audit, and return reason |
| `INVALID_TIMESTAMP` | Block, log, audit, and return reason |
| `MISSING_REFERENCE` | Block, log, audit, and return reason |
| `TENANT_MISMATCH` | Block, log, audit, and return reason |

## TEST STRATEGY

V1.3 tests must verify:

- Events are immutable.
- Duplicate detection works deterministically.
- Event replay is deterministic.
- Ownership is enforced.
- Timestamps are preserved.
- Event history is reconstructable.
- Append-only behavior is enforced.
- Event IDs are reproducible.
- Event integrity hashes are valid.
- Unknown sources are blocked.
- Tenant mismatches are blocked.
- Replay cannot create duplicate events.

## EXIT CRITERIA

V1.3 is complete only when:

- All intelligence events are preserved.
- Event history is replayable.
- Ownership is enforced.
- Duplicate control is operational.
- Append-only storage is guaranteed.
- Historical reconstruction is possible.
- Event integrity is verifiable.
- Audit trail is complete.
- Lineage is preserved.
- Event retrieval indexes support deterministic replay and audit.
