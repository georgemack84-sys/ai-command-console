# QuantEdge Competitive Intelligence V1.5 Signal Generation Engine

Status: signal generation engine

Next phase: [QCI V1.6 Intelligence Delivery Layer](./qci-v1-6-intelligence-delivery-layer.md)

## PURPOSE

QCI V1.5 transforms validated change events into explainable intelligence signals. The Signal Generation Engine is an evidence aggregation layer, signal creation engine, confidence input generator, lineage preservation layer, ownership-preserving signal framework, and deterministic observation system.

Signals are observations. Signals are not decisions. Signals are not recommendations.

Signal generation exists to transform evidence into signals, summarize meaningful movement, preserve intelligence observations, connect evidence to outputs, and create replayable intelligence. It does not exist to create recommendations, create autonomous decisions, hide scoring logic, create unsupported conclusions, or bypass evidence requirements.

## ARCHITECTURE

V1.5 receives validated change events, verifies evidence, evaluates replayable signal rules, builds immutable signal objects, attaches ownership and lineage, stores the signal, and emits append-only signal events.

```text
CHANGE_EVENT
  -> VALIDATE_EVIDENCE
  -> LOAD_SIGNAL_RULES
  -> EVALUATE_CONDITIONS
  -> BUILD_SIGNAL_OBJECT
  -> ATTACH_OWNERSHIP
  -> ATTACH_LINEAGE
  -> STORE_SIGNAL
  -> EMIT_SIGNAL_EVENT
```

Architectural invariants:

- Identical inputs produce identical signals.
- Processing is deterministic.
- Failures are observable.
- History is append-only.
- Evidence is mandatory.
- Ownership is mandatory.
- Lineage is mandatory.
- Hidden scoring is prohibited.
- Outputs remain informational only.

Signal generation logic:

```text
CHANGE_EVENT_RECEIVED
  -> EVIDENCE_VALID?
       YES -> RULES_MATCH?
                YES -> CREATE_SIGNAL
                NO  -> WAIT
       NO  -> BLOCK
```

## DATA CONTRACTS

### signal_record

```text
signal_id
signal_type
signal_category
source_count
evidence_chain
confidence_inputs
ownership_hash
lineage_reference
created_at
schema_version
```

Rules:

- Ownership is required.
- Evidence is required.
- Timestamps are required.
- Schema versions are required.

### expanded_signal_record

```text
signal_id
signal_type
signal_category
signal_strength
signal_status
signal_summary
source_count
source_references
ownership_hash
owner_id
tenant_id
evidence_chain
lineage_reference
confidence_inputs
confidence_state
supporting_events
created_at
signal_version
```

Rules:

- Signals are immutable.
- Ownership is immutable.
- Lineage is immutable.

### signal_category

Allowed categories:

- `COMPETITOR_ACTIVITY`
- `PRICING_MOVEMENT`
- `PRODUCT_MOVEMENT`
- `MARKET_MOVEMENT`
- `MESSAGING_MOVEMENT`
- `SENTIMENT_MOVEMENT`
- `RELEASE_ACTIVITY`
- `SOURCE_ACTIVITY`
- `ANOMALY`
- `VOLATILITY`

Rules:

- Categories are immutable.
- Categories are versioned.
- Unknown categories are invalid.

### signal_type

Example signal types:

- `PRICE_INCREASE_DETECTED`
- `MARKET_EXPANSION_SIGNAL`
- `MESSAGE_SHIFT`
- `FEATURE_EXPANSION`
- `SENTIMENT_REVERSAL`
- `RELEASE_ACTIVITY_SPIKE`
- `SOURCE_DEGRADATION`
- `ABNORMAL_ACTIVITY`

Rules:

- Signal types are explicit.
- Signal mapping is deterministic.
- Hidden signal classes are prohibited.

### signal_rule

```text
rule_id
signal_type
required_event_types
required_thresholds
minimum_sources
minimum_confidence_inputs
rule_version
```

Rules:

- Rules are versioned.
- Rules are ownership-bound.
- Rules are replayable.
- Rules are observable.

### evidence_chain

```text
source_references
event_references
threshold_references
change_references
timestamps
```

Rules:

- Evidence is mandatory.
- Evidence is immutable.
- Evidence is replayable.
- Insufficient evidence blocks signal creation.

### confidence_inputs

Purpose: explain signal strength without hidden scoring.

Inputs:

- `source_count`
- `evidence_volume`
- `signal_frequency`
- `change_magnitude`
- `source_trust`
- `historical_pattern`

Output states:

- `LIMITED`
- `SUPPORTED`
- `STRONG`
- `UNVERIFIED`

Rules:

- Confidence is explainable.
- Hidden scoring is prohibited.
- Confidence is reproducible.

### signal_strength

Allowed strengths:

- `LOW`
- `MEDIUM`
- `HIGH`
- `EXTREME`

Derived from:

- Magnitude.
- Frequency.
- Source count.
- Velocity.
- Evidence depth.

Rules:

- Strength is deterministic.
- Strength is reproducible.
- Strength is observable.

### signal_status

Allowed statuses:

- `GENERATED`
- `LIMITED`
- `INVALID`
- `REPLAYED`
- `SUPERSEDED`

Definitions:

- `GENERATED`: valid signal created.
- `LIMITED`: insufficient supporting evidence.
- `INVALID`: validation failure.
- `REPLAYED`: generated during replay.
- `SUPERSEDED`: historical signal retained.

### signal_event

Required events:

- `SIGNAL_GENERATED_EVENT`
- `SIGNAL_BLOCKED_EVENT`
- `SIGNAL_REPLAYED_EVENT`
- `SIGNAL_EVIDENCE_FAILURE_EVENT`

Rules:

- Events are append-only.
- Events are timestamped.
- Events are ownership-bound.
- Events are immutable.

## SERVICES

### Signal Engine Service

Builds immutable signal records from validated change events and rule outcomes.

### Signal Rule Service

Loads, validates, and evaluates versioned signal rules against required event types, thresholds, source counts, and confidence inputs.

### Evidence Service

Validates evidence sufficiency and builds immutable evidence chains from source, event, threshold, change, and timestamp references.

### Confidence Service

Creates explainable confidence inputs and confidence states without opaque scoring.

### Signal Replay Service

Reconstructs signal generation, rule evaluation, confidence inputs, lineage history, and evidence chains from immutable history.

### Signal Audit Service

Validates signal legitimacy, evidence completeness, ownership integrity, rule integrity, confidence explainability, and lineage continuity.

### Lineage Service

Tracks parent events, evidence objects, source artifacts, rule references, and derived outputs.

## RULES

Ownership requirements:

- `ownership_hash` is required.
- `owner_id` is required.
- `tenant_id` is required.
- Ownership is immutable.
- Tenant isolation is enforced.

Lineage requirements:

- Parent events are tracked.
- Evidence objects are tracked.
- Source artifacts are tracked.
- Rule references are tracked.
- Derived outputs are tracked.
- Lineage is immutable.
- Lineage is replayable.
- Lineage is complete.

Replay must reconstruct:

- Signal generation.
- Rule evaluation.
- Confidence inputs.
- Lineage history.
- Evidence chains.

Replay rules:

- Replay is read-only.
- Replay is deterministic.
- Same inputs produce same outputs.

Audit must validate:

- Signal legitimacy.
- Evidence completeness.
- Ownership integrity.
- Rule integrity.
- Confidence explainability.
- Lineage continuity.

Audit states:

- `VALID`
- `LIMITED`
- `INVALID`
- `FREEZE_REQUIRED`

## FAILURE MODES

| Failure | Required response |
| --- | --- |
| `MISSING_EVIDENCE` | Block, log, audit, and return failure |
| `UNKNOWN_SIGNAL_TYPE` | Block, log, audit, and return failure |
| `RULE_MISSING` | Block, log, audit, and return failure |
| `OWNERSHIP_FAILURE` | Block, log, audit, and return failure |
| `CONFIDENCE_FAILURE` | Block, log, audit, and return failure |
| `LINEAGE_MISSING` | Block, log, audit, and return failure |
| `TENANT_MISMATCH` | Block, log, audit, and return failure |
| `INVALID_REFERENCE` | Block, log, audit, and return failure |

## TEST STRATEGY

V1.5 tests must verify:

- Signals are deterministic.
- Ownership is enforced.
- Evidence is required.
- Confidence is explainable.
- Lineage is preserved.
- Replay is deterministic.
- Rule evaluation is reproducible.
- Signal duplication is controlled.
- Unsupported signal types are blocked.
- Missing rules block generation.
- Hidden scoring is prohibited.
- Outputs remain informational only.

## EXIT CRITERIA

V1.5 is complete only when:

- Signals are generated from evidence.
- Ownership is enforced.
- Lineage is preserved.
- Replay is deterministic.
- Confidence is explainable.
- Rules are reproducible.
- Signal history is reconstructable.
- Hidden scoring is prohibited.
- Informational-only outputs are preserved.
