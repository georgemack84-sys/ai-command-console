import { createHash } from "crypto";
import type {
  MovementAccelerationState,
  MovementVelocityComputationResult,
  MovementVelocityInputEvent,
  MovementVelocityRecord,
  MovementVelocityState,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function isMovementEventType(eventType: string): boolean {
  return [
    "SPREAD_MOVEMENT",
    "TOTALS_MOVEMENT",
    "MONEYLINE_MOVEMENT",
    "PLAYER_PROP_MOVEMENT",
    "ODDS_SHIFT",
  ].includes(eventType);
}

function isNumericValue(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getMovementMagnitude(event: MovementVelocityInputEvent): number {
  if (isNumericValue(event.movement_size)) {
    return Math.abs(event.movement_size);
  }
  if (isNumericValue(event.price_delta)) {
    return Math.abs(event.price_delta);
  }
  if (isNumericValue(event.implied_probability_delta)) {
    return Math.abs(event.implied_probability_delta);
  }
  return 0;
}

function compareEvents(left: MovementVelocityInputEvent, right: MovementVelocityInputEvent): number {
  const timestampDelta = Date.parse(left.timestamp) - Date.parse(right.timestamp);
  if (timestampDelta !== 0) return timestampDelta;
  return Date.parse(left.detected_at) - Date.parse(right.detected_at);
}

function classifyVelocityState(score: number | null, valid: boolean): MovementVelocityState {
  if (!valid || score === null) {
    return "UNKNOWN";
  }
  if (score > 0 && score < 0.25) {
    return "SLOW";
  }
  if (score >= 0.25 && score < 0.75) {
    return "NORMAL";
  }
  if (score >= 0.75 && score < 1.5) {
    return "FAST";
  }
  return "VOLATILE";
}

function classifyAccelerationState(
  currentScore: number | null,
  priorScore: number | null,
): MovementAccelerationState {
  if (currentScore === null || priorScore === null) {
    return "UNKNOWN";
  }
  if (currentScore > priorScore) {
    return "ACCELERATING";
  }
  if (currentScore < priorScore) {
    return "DECELERATING";
  }
  return "STABLE";
}

type UnknownVelocityReason = Extract<MovementVelocityComputationResult, { status: "UNKNOWN" }>["reason"];
type UnknownVelocityResult = Extract<MovementVelocityComputationResult, { status: "UNKNOWN" }>;

export interface MovementVelocityTracker {
  recordEvent(event: MovementVelocityInputEvent): MovementVelocityComputationResult;
  listVelocityRecords(): MovementVelocityRecord[];
  listEvents(): MovementVelocityInputEvent[];
}

export function createMovementVelocityTracker(
  options: { now?: () => Date; schemaVersion?: string } = {},
): MovementVelocityTracker {
  const now = options.now ?? (() => new Date());
  const schemaVersion = options.schemaVersion ?? "1.1.0";
  const inputEvents: MovementVelocityInputEvent[] = [];
  const velocityRecords: MovementVelocityRecord[] = [];

  function createUnknownRecord(
    event: MovementVelocityInputEvent,
    reason: UnknownVelocityReason,
    duplicate = false,
  ): UnknownVelocityResult {
    const velocityId = `movement_velocity_${hashDeterministically([
      "MOVEMENT_VELOCITY",
      event.source_id ?? "unknown_source",
      event.market_id ?? "unknown_market",
      event.timestamp ?? "unknown_time",
      event.detected_at ?? "unknown_detected",
      1,
    ])}`;
    const record: MovementVelocityRecord = Object.freeze({
      velocity_id: velocityId,
      market_id: event.market_id ?? "unknown_market",
      source_id: event.source_id ?? "unknown_source",
      movement_count: 1,
      total_movement_size: getMovementMagnitude(event),
      average_movement_size: getMovementMagnitude(event),
      time_window_seconds: null,
      average_seconds_between_moves: null,
      velocity_score: null,
      velocity_state: "UNKNOWN",
      acceleration_state: "UNKNOWN",
      first_seen_at: event.timestamp ?? null,
      last_seen_at: event.timestamp ?? null,
      event_ids: event.event_id ? [event.event_id] : [],
      created_at: now().toISOString(),
      schema_version: schemaVersion,
    });
    return {
      status: "UNKNOWN",
      record: clone(record),
      duplicate,
      reason,
    };
  }

  return {
    recordEvent(event) {
      if (!event.event_id) {
        return createUnknownRecord(event, "MISSING_EVENT_ID");
      }
      if (!event.event_type) {
        return createUnknownRecord(event, "MISSING_EVENT_TYPE");
      }
      if (!isMovementEventType(event.event_type)) {
        return createUnknownRecord(event, "NOT_MOVEMENT_EVENT");
      }
      if (!event.market_id) {
        return createUnknownRecord(event, "MISSING_MARKET_ID");
      }
      if (!event.source_id) {
        return createUnknownRecord(event, "MISSING_SOURCE_ID");
      }
      if (!event.timestamp || !event.detected_at) {
        return createUnknownRecord(event, "MISSING_TIMESTAMP");
      }
      if (Number.isNaN(Date.parse(event.timestamp)) || Number.isNaN(Date.parse(event.detected_at))) {
        return createUnknownRecord(event, "INVALID_TIMESTAMP");
      }

      const duplicateInput = inputEvents.find((storedEvent) => storedEvent.event_id === event.event_id);
      if (!duplicateInput) {
        inputEvents.push(clone(event));
      }

      const groupedEvents = inputEvents
        .filter((storedEvent) => storedEvent.market_id === event.market_id && storedEvent.source_id === event.source_id)
        .sort(compareEvents);

      if (groupedEvents.length < 2) {
        const result = createUnknownRecord(event, "INSUFFICIENT_OBSERVATIONS", Boolean(duplicateInput));
        const duplicateRecord = velocityRecords.find((record) => record.velocity_id === result.record.velocity_id);
        if (!duplicateRecord) {
          velocityRecords.push(clone(result.record));
        }
        if (duplicateRecord) {
          return {
            status: "UNKNOWN",
            record: clone(duplicateRecord),
            duplicate: true,
            reason: result.reason,
          };
        }
        return result;
      }

      const firstSeenAt = groupedEvents[0].timestamp;
      const lastSeenAt = groupedEvents[groupedEvents.length - 1].timestamp;
      const firstMillis = Date.parse(firstSeenAt);
      const lastMillis = Date.parse(lastSeenAt);
      if (Number.isNaN(firstMillis) || Number.isNaN(lastMillis)) {
        const result = createUnknownRecord(event, "INVALID_TIMESTAMP", Boolean(duplicateInput));
        const duplicateRecord = velocityRecords.find((record) => record.velocity_id === result.record.velocity_id);
        if (!duplicateRecord) {
          velocityRecords.push(clone(result.record));
        }
        if (duplicateRecord) {
          return {
            status: "UNKNOWN",
            record: clone(duplicateRecord),
            duplicate: true,
            reason: result.reason,
          };
        }
        return result;
      }

      const timeWindowSeconds = Math.max(0, (lastMillis - firstMillis) / 1000);
      const movementCount = groupedEvents.length;
      const totalMovementSize = groupedEvents.reduce((sum, movementEvent) => sum + getMovementMagnitude(movementEvent), 0);
      const averageMovementSize = totalMovementSize / movementCount;
      const averageSecondsBetweenMoves = movementCount >= 2 ? timeWindowSeconds / (movementCount - 1) : null;
      const velocityScore = movementCount * averageMovementSize / Math.max(1, timeWindowSeconds / 60);

      const priorRecord = velocityRecords
        .filter((record) => record.market_id === event.market_id && record.source_id === event.source_id && record.velocity_state !== "UNKNOWN")
        .slice(-1)[0];
      const velocityId = `movement_velocity_${hashDeterministically([
        "MOVEMENT_VELOCITY",
        event.source_id,
        event.market_id,
        firstSeenAt,
        lastSeenAt,
        movementCount,
      ])}`;
      const duplicateRecord = velocityRecords.find((record) => record.velocity_id === velocityId);
      if (duplicateRecord) {
        if (duplicateRecord.velocity_state === "UNKNOWN") {
          return {
            status: "UNKNOWN",
            record: clone(duplicateRecord),
            duplicate: true,
            reason: "INSUFFICIENT_OBSERVATIONS",
          };
        }
        return {
          status: "RECORDED",
          record: clone(duplicateRecord),
          duplicate: true,
        };
      }

      const record: MovementVelocityRecord = Object.freeze({
        velocity_id: velocityId,
        market_id: event.market_id,
        source_id: event.source_id,
        movement_count: movementCount,
        total_movement_size: totalMovementSize,
        average_movement_size: averageMovementSize,
        time_window_seconds: timeWindowSeconds,
        average_seconds_between_moves: averageSecondsBetweenMoves,
        velocity_score: velocityScore,
        velocity_state: classifyVelocityState(velocityScore, true),
        acceleration_state: classifyAccelerationState(velocityScore, priorRecord?.velocity_score ?? null),
        first_seen_at: firstSeenAt,
        last_seen_at: lastSeenAt,
        event_ids: groupedEvents.map((movementEvent) => movementEvent.event_id),
        created_at: now().toISOString(),
        schema_version: schemaVersion,
      });
      velocityRecords.push(record);
      return {
        status: "RECORDED",
        record: clone(record),
        duplicate: Boolean(duplicateInput),
      };
    },
    listVelocityRecords() {
      return velocityRecords.map((record) => clone(record));
    },
    listEvents() {
      return inputEvents.map((event) => clone(event));
    },
  };
}
