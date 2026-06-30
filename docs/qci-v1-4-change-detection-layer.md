# QuantEdge Competitive Intelligence V1.4 Change Detection Layer

Status: change detection layer

Next phase: [QCI V1.5 Signal Generation Engine](./qci-v1-5-signal-generation-engine.md)

## PURPOSE

QCI V1.4 creates the deterministic intelligence movement engine that detects meaningful competitive changes, suppresses insignificant noise, and emits evidence-backed change events.

The objective is simple: detect signal, ignore noise.

The Change Detection Layer exists to detect competitive movement, preserve evidence, identify trends, identify shifts, and capture movement history. It does not exist to create recommendations, infer unsupported intent, react to insignificant noise, create hidden scoring, or mutate evidence.

## ARCHITECTURE

V1.4 consumes source inputs and historical state, applies deterministic comparison and threshold policies, suppresses noise, and records change events only when movement is meaningful.

```text
SOURCE_INPUT
  -> LOAD_PREVIOUS_STATE
  -> NORMALIZE_INPUT
  -> COMPARE_STATES
  -> CALCULATE_DELTA
  -> APPLY_THRESHOLDS
  -> MEANINGFUL?
       YES -> RECORD_EVENT
       NO  -> WAIT
```

Architectural invariants:

- Identical inputs produce identical detections.
- Threshold decisions are deterministic.
- Decisions are observable.
- Failures are visible.
- Evidence is mandatory.
- Ownership is mandatory.
- Replayability is mandatory.
- Detection records are immutable.

## DATA CONTRACTS

### change_detection_record

```text
change_id
change_type
source_id
previous_reference
current_reference
change_direction
change_magnitude
confidence_inputs
ownership_hash
detected_at
schema_version
```

Rules:

- Ownership is required.
- Previous and current references are required.
- Timestamps are required.
- Records are immutable.

### comparison_result

```text
delta
direction
significance
confidence_inputs
```

Inputs:

- `previous_state`
- `current_state`
- `change_type`
- `threshold_policy`

Rules:

- Comparison is deterministic.
- Historical states are preserved.
- Comparison is replayable.

### change_category

Allowed categories:

- `PRICING_CHANGE`
- `PRODUCT_CHANGE`
- `MARKET_CHANGE`
- `MESSAGING_CHANGE`
- `SENTIMENT_CHANGE`
- `RELEASE_CHANGE`
- `SOURCE_CHANGE`
- `PUBLIC_SIGNAL_CHANGE`

Rules:

- Unknown categories are invalid.
- Category is immutable.
- Category is versioned.

### threshold_policy

```text
threshold_id
change_type
minimum_delta
minimum_frequency
minimum_sources
time_window
threshold_version
```

Rules:

- Thresholds are versioned.
- Thresholds are ownership-bound.
- Thresholds are replayable.
- Thresholds define what constitutes an event.

### evidence_chain

```text
previous_state_reference
current_state_reference
source_reference
threshold_reference
timestamps
```

Rules:

- Evidence is mandatory.
- Evidence is immutable.
- Evidence is replayable.

### change_event

Required events:

- `CHANGE_DETECTED_EVENT`
- `NOISE_SUPPRESSED_EVENT`
- `THRESHOLD_TRIGGERED_EVENT`
- `CHANGE_IGNORED_EVENT`

Rules:

- Events are append-only.
- Events are timestamped.
- Events are ownership-bound.
- Events are immutable.

## SERVICES

### State Comparison Service

Loads previous and current state, computes deltas, determines direction, and produces deterministic comparison results.

### Threshold Service

Loads versioned threshold policies and evaluates minimum delta, frequency, source count, and time window requirements.

### Noise Suppression Service

Suppresses duplicate observations, micro changes, temporary fluctuations, known noise patterns, and unchanged values while logging suppression decisions.

### Evidence Service

Builds immutable evidence chains linking previous state, current state, source references, threshold references, and timestamps.

### Change Event Service

Creates append-only change, threshold, ignored, and suppression events when detection decisions are made.

### Replay Service

Reconstructs historical state, threshold decisions, noise suppression, change history, and evidence chains.

## RULES

Watch domains:

- Pricing changes detect `price_delta`, direction, magnitude, and frequency.
- Product changes detect `product_delta`, scope, and feature count changes.
- Market movement detects movement direction, movement size, and market scope.
- Competitor messaging detects messaging delta, theme shift, and narrative change.
- Sentiment shifts detect sentiment delta, velocity, and direction.
- Release announcements detect release scope, impact level, and announcement type.
- Source status changes detect status transition, trust delta, and policy delta.
- Public signal changes detect signal delta, trend direction, and movement size.

Significance engine measures:

- `change_size`
- `change_frequency`
- `change_velocity`
- `change_scope`
- `source_count`
- `historical_pattern`

Significance outputs:

- `INSIGNIFICANT`
- `MEANINGFUL`
- `HIGH_IMPACT`

Significance rules:

- Significance is reproducible.
- Significance is threshold-driven.
- Significance is observable.

Noise suppression must suppress:

- Duplicate observations.
- Micro changes.
- Temporary fluctuations.
- Known noise patterns.
- Unchanged values.

Noise suppression rules:

- Suppression is observable.
- Suppression is replayable.
- Suppression is logged.

Ownership requirements:

- `ownership_hash` is required.
- `owner_id` is required.
- `tenant_id` is required.
- Ownership is immutable.
- Tenant isolation is enforced.

Replay must reconstruct:

- Historical state.
- Threshold decisions.
- Noise suppression.
- Change history.
- Evidence chains.

Replay rules:

- Replay is read-only.
- Replay is deterministic.
- Same inputs produce same detections.

Audit must validate:

- Evidence completeness.
- Threshold usage.
- Ownership integrity.
- Noise suppression logic.
- Change legitimacy.
- Event generation accuracy.

Audit states:

- `VALID`
- `LIMITED`
- `INVALID`
- `FREEZE_REQUIRED`

## FAILURE MODES

| Failure | Required response |
| --- | --- |
| `MISSING_PREVIOUS_STATE` | Block, log, audit, and return failure |
| `UNKNOWN_CHANGE_TYPE` | Block, log, audit, and return failure |
| `THRESHOLD_MISSING` | Block, log, audit, and return failure |
| `EVIDENCE_MISSING` | Block, log, audit, and return failure |
| `DUPLICATE_DETECTION` | Block or suppress, log, audit, and return failure |
| `OWNERSHIP_FAILURE` | Block, log, audit, and return failure |
| `INVALID_REFERENCE` | Block, log, audit, and return failure |
| `TENANT_MISMATCH` | Block, log, audit, and return failure |

## TEST STRATEGY

V1.4 tests must verify:

- Meaningful changes are detected.
- Insignificant noise is suppressed.
- Thresholds are enforced.
- Ownership is preserved.
- Replay is deterministic.
- Duplicate detections are suppressed.
- Evidence chains are attached.
- Tenant isolation is enforced.
- Unknown change types are blocked.
- Missing thresholds block detection.
- Event generation is reproducible.

## EXIT CRITERIA

V1.4 is complete only when:

- Meaningful changes are detected.
- Insignificant noise is ignored.
- Every change is linked to evidence.
- Thresholds are operational.
- Replay is deterministic.
- Ownership is enforced.
- Event generation is reproducible.
- Noise suppression is working.
- Detection decisions are observable and auditable.
