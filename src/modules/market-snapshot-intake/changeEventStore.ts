import { createHash } from "crypto";
import type {
  ChangeEventConflictRecord,
  ChangeEventCorrectionRecord,
  ChangeEventRecord,
  ChangeEventStoreInput,
  ChangeEventStoreLifecycleEvent,
  ChangeEventStoreRejectedReason,
  ChangeEventStoreResult,
  SnapshotRecord,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function isKnownEventType(eventType: string): boolean {
  return [
    "SPREAD_MOVEMENT",
    "TOTALS_MOVEMENT",
    "MONEYLINE_MOVEMENT",
    "PLAYER_PROP_MOVEMENT",
    "ODDS_SHIFT",
    "MOVEMENT_VELOCITY",
  ].includes(eventType);
}

function isVelocityEvent(input: ChangeEventStoreInput): boolean {
  return input.event_type === "MOVEMENT_VELOCITY";
}

function createLifecycleEvent(input: {
  change_event_id: string | null;
  event_type: ChangeEventStoreLifecycleEvent["event_type"];
  market_id: string;
  source_id: string;
  reason: string;
  timestamp: string;
}): ChangeEventStoreLifecycleEvent {
  return Object.freeze({
    event_id: `change_store_event_${hashDeterministically([
      input.event_type,
      input.market_id,
      input.source_id,
      input.change_event_id ?? "none",
      input.timestamp,
    ])}`,
    change_event_id: input.change_event_id,
    event_type: input.event_type,
    market_id: input.market_id,
    source_id: input.source_id,
    reason: input.reason,
    timestamp: input.timestamp,
  });
}

function createRejectedResult(
  input: ChangeEventStoreInput,
  reason: ChangeEventStoreRejectedReason,
  nowIso: string,
): ChangeEventStoreResult {
  const received = createLifecycleEvent({
    change_event_id: null,
    event_type: "CHANGE_EVENT_RECEIVED",
    market_id: input.market_id ?? "unknown_market",
    source_id: input.source_id ?? "unknown_source",
    reason: "Change event received.",
    timestamp: nowIso,
  });
  const rejected = createLifecycleEvent({
    change_event_id: null,
    event_type: "CHANGE_EVENT_REJECTED",
    market_id: input.market_id ?? "unknown_market",
    source_id: input.source_id ?? "unknown_source",
    reason,
    timestamp: nowIso,
  });
  return {
    status: "REJECTED",
    reason,
    lifecycle_events: [clone(received), clone(rejected)],
  };
}

export interface ChangeEventStore {
  registerSnapshot(snapshot: SnapshotRecord): void;
  registerSnapshots(snapshots: SnapshotRecord[]): void;
  storeEvent(input: ChangeEventStoreInput): ChangeEventStoreResult;
  storeCorrection(input: {
    corrected_change_event_id: string;
    correction_reason: string;
    correction_payload: Record<string, unknown>;
  }): ChangeEventCorrectionRecord | undefined;
  getChangeEventById(changeEventId: string): ChangeEventRecord | undefined;
  listChangeEvents(): ChangeEventRecord[];
  listConflicts(): ChangeEventConflictRecord[];
  listCorrections(): ChangeEventCorrectionRecord[];
  listLifecycleEvents(): ChangeEventStoreLifecycleEvent[];
  replayByMarket(marketId: string): ChangeEventRecord[];
  replayBySource(sourceId: string): ChangeEventRecord[];
}

export function createChangeEventStore(
  options: { now?: () => Date } = {},
): ChangeEventStore {
  const now = options.now ?? (() => new Date());
  const snapshots = new Map<string, SnapshotRecord>();
  const changeEvents: ChangeEventRecord[] = [];
  const conflicts: ChangeEventConflictRecord[] = [];
  const corrections: ChangeEventCorrectionRecord[] = [];
  const lifecycleEvents: ChangeEventStoreLifecycleEvent[] = [];

  function appendLifecycle(events: ChangeEventStoreLifecycleEvent[]): ChangeEventStoreLifecycleEvent[] {
    lifecycleEvents.push(...events);
    return events.map((event) => clone(event));
  }

  function generatePayloadHash(payload: Record<string, unknown>): string {
    return `payload_${hashDeterministically([stableStringify(payload)])}`;
  }

  function generateChangeEventId(input: ChangeEventStoreInput): string {
    if (isVelocityEvent(input)) {
      return `change_event_${hashDeterministically([
        "MOVEMENT_VELOCITY",
        input.source_id,
        input.market_id,
        input.first_seen_at ?? "",
        input.last_seen_at ?? "",
        input.movement_count ?? "",
      ])}`;
    }

    return `change_event_${hashDeterministically([
      input.event_type,
      input.source_id,
      input.market_id,
      input.previous_snapshot_id ?? "",
      input.new_snapshot_id ?? "",
      input.timestamp,
    ])}`;
  }

  function validateLinkage(input: ChangeEventStoreInput): ChangeEventStoreRejectedReason | null {
    if (isVelocityEvent(input)) {
      if (!input.event_ids || input.event_ids.length === 0) {
        return "VELOCITY_EVENT_IDS_MISSING";
      }
      const missingLinkedEvents = input.event_ids.some((eventId) => !changeEvents.find((record) => record.change_event_id === eventId));
      return missingLinkedEvents ? "VELOCITY_EVENT_LINKAGE_INVALID" : null;
    }

    if (!input.previous_snapshot_id) {
      return "PREVIOUS_SNAPSHOT_ID_MISSING";
    }
    if (!input.new_snapshot_id) {
      return "NEW_SNAPSHOT_ID_MISSING";
    }
    if (input.previous_snapshot_id === input.new_snapshot_id) {
      return "SNAPSHOT_LINKAGE_INVALID";
    }
    if (!snapshots.has(input.previous_snapshot_id) || !snapshots.has(input.new_snapshot_id)) {
      return "SNAPSHOT_LINKAGE_INVALID";
    }
    return null;
  }

  function sortRecords(records: ChangeEventRecord[]): ChangeEventRecord[] {
    return records
      .slice()
      .sort((left, right) => {
        const timestampDelta = Date.parse(left.timestamp) - Date.parse(right.timestamp);
        if (timestampDelta !== 0) return timestampDelta;
        const detectedDelta = Date.parse(left.detected_at) - Date.parse(right.detected_at);
        if (detectedDelta !== 0) return detectedDelta;
        return left.change_event_id.localeCompare(right.change_event_id);
      });
  }

  return {
    registerSnapshot(snapshot) {
      snapshots.set(snapshot.snapshot_id, clone(snapshot));
    },
    registerSnapshots(inputSnapshots) {
      inputSnapshots.forEach((snapshot) => {
        snapshots.set(snapshot.snapshot_id, clone(snapshot));
      });
    },
    storeEvent(input) {
      const nowIso = now().toISOString();
      if (!input.event_type) return createRejectedResult(input, "EVENT_TYPE_MISSING", nowIso);
      if (!isKnownEventType(input.event_type)) return createRejectedResult(input, "EVENT_TYPE_UNKNOWN", nowIso);
      if (!input.market_id) return createRejectedResult(input, "MARKET_ID_MISSING", nowIso);
      if (!input.source_id) return createRejectedResult(input, "SOURCE_ID_MISSING", nowIso);
      if (!input.timestamp) return createRejectedResult(input, "TIMESTAMP_MISSING", nowIso);
      if (!input.detected_at) return createRejectedResult(input, "DETECTED_AT_MISSING", nowIso);
      if (!input.schema_version) return createRejectedResult(input, "SCHEMA_VERSION_MISSING", nowIso);
      if (!input.payload) return createRejectedResult(input, "PAYLOAD_MISSING", nowIso);

      const linkageFailure = validateLinkage(input);
      if (linkageFailure) return createRejectedResult(input, linkageFailure, nowIso);

      const payloadHash = generatePayloadHash(input.payload);
      const changeEventId = generateChangeEventId(input);
      const received = createLifecycleEvent({
        change_event_id: changeEventId,
        event_type: "CHANGE_EVENT_RECEIVED",
        market_id: input.market_id,
        source_id: input.source_id,
        reason: "Change event received.",
        timestamp: nowIso,
      });
      const validated = createLifecycleEvent({
        change_event_id: changeEventId,
        event_type: "CHANGE_EVENT_VALIDATED",
        market_id: input.market_id,
        source_id: input.source_id,
        reason: "Change event validated.",
        timestamp: nowIso,
      });

      const existing = changeEvents.find((record) => record.change_event_id === changeEventId);
      if (existing) {
        if (existing.payload_hash === payloadHash) {
          const duplicateEvent = createLifecycleEvent({
            change_event_id: changeEventId,
            event_type: "CHANGE_EVENT_DUPLICATE",
            market_id: input.market_id,
            source_id: input.source_id,
            reason: "Duplicate change event resolved idempotently.",
            timestamp: nowIso,
          });
          return {
            status: "DUPLICATE",
            record: clone(existing),
            duplicate: true,
            lifecycle_events: appendLifecycle([received, validated, duplicateEvent]),
          };
        }

        const conflict: ChangeEventConflictRecord = Object.freeze({
          conflict_id: `change_event_conflict_${hashDeterministically([
            changeEventId,
            existing.payload_hash,
            payloadHash,
            nowIso,
          ])}`,
          change_event_id: changeEventId,
          existing_payload_hash: existing.payload_hash,
          incoming_payload_hash: payloadHash,
          source_id: input.source_id,
          market_id: input.market_id,
          detected_at: input.detected_at,
          created_at: nowIso,
        });
        conflicts.push(conflict);
        const conflictEvent = createLifecycleEvent({
          change_event_id: changeEventId,
          event_type: "CHANGE_EVENT_CONFLICT",
          market_id: input.market_id,
          source_id: input.source_id,
          reason: "Conflicting duplicate change event detected.",
          timestamp: nowIso,
        });
        return {
          status: "CONFLICT",
          conflict: clone(conflict),
          existing_record: clone(existing),
          lifecycle_events: appendLifecycle([received, validated, conflictEvent]),
        };
      }

      const record: ChangeEventRecord = Object.freeze({
        change_event_id: changeEventId,
        event_type: input.event_type as ChangeEventRecord["event_type"],
        market_id: input.market_id,
        source_id: input.source_id,
        previous_snapshot_id: input.previous_snapshot_id ?? null,
        new_snapshot_id: input.new_snapshot_id ?? null,
        previous_value: input.previous_value ?? null,
        new_value: input.new_value ?? null,
        movement_size: input.movement_size ?? null,
        movement_direction: input.movement_direction ?? null,
        velocity_state: input.velocity_state ?? null,
        timestamp: input.timestamp,
        detected_at: input.detected_at,
        schema_version: input.schema_version,
        payload: clone(input.payload),
        payload_hash: payloadHash,
        created_at: nowIso,
      });
      changeEvents.push(record);
      const stored = createLifecycleEvent({
        change_event_id: changeEventId,
        event_type: "CHANGE_EVENT_STORED",
        market_id: input.market_id,
        source_id: input.source_id,
        reason: "Change event stored append-only.",
        timestamp: nowIso,
      });
      return {
        status: "STORED",
        record: clone(record),
        duplicate: false,
        lifecycle_events: appendLifecycle([received, validated, stored]),
      };
    },
    storeCorrection(input) {
      const existing = changeEvents.find((record) => record.change_event_id === input.corrected_change_event_id);
      if (!existing) {
        return undefined;
      }
      const nowIso = now().toISOString();
      const correction: ChangeEventCorrectionRecord = Object.freeze({
        correction_event_id: `change_event_correction_${hashDeterministically([
          input.corrected_change_event_id,
          input.correction_reason,
          stableStringify(input.correction_payload),
          nowIso,
        ])}`,
        corrected_change_event_id: input.corrected_change_event_id,
        correction_reason: input.correction_reason,
        correction_payload: clone(input.correction_payload),
        created_at: nowIso,
      });
      corrections.push(correction);
      lifecycleEvents.push(createLifecycleEvent({
        change_event_id: input.corrected_change_event_id,
        event_type: "CHANGE_EVENT_CORRECTION_STORED",
        market_id: existing.market_id,
        source_id: existing.source_id,
        reason: "Correction stored append-only.",
        timestamp: nowIso,
      }));
      return clone(correction);
    },
    getChangeEventById(changeEventId) {
      const record = changeEvents.find((entry) => entry.change_event_id === changeEventId);
      return record ? clone(record) : undefined;
    },
    listChangeEvents() {
      return changeEvents.map((record) => clone(record));
    },
    listConflicts() {
      return conflicts.map((record) => clone(record));
    },
    listCorrections() {
      return corrections.map((record) => clone(record));
    },
    listLifecycleEvents() {
      return lifecycleEvents.map((event) => clone(event));
    },
    replayByMarket(marketId) {
      return sortRecords(changeEvents.filter((record) => record.market_id === marketId)).map((record) => clone(record));
    },
    replayBySource(sourceId) {
      return sortRecords(changeEvents.filter((record) => record.source_id === sourceId)).map((record) => clone(record));
    },
  };
}
