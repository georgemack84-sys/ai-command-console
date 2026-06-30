import { createHash } from "crypto";
import type { SnapshotRecord, SpreadEffect, SpreadMovementDetectionResult, SpreadMovementRecord } from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function isSpreadRelated(record: SnapshotRecord): boolean {
  const marketType = record.snapshot_payload.market_type.trim().toLowerCase();
  const marketSubtype = record.snapshot_payload.market_subtype.trim().toLowerCase();
  return marketType === "spread" || marketType === "alternate_spread" || marketSubtype === "alternate_spread";
}

function isNumericLineValue(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function classifySpreadEffect(previousValue: number, newValue: number): SpreadEffect {
  if (previousValue === 0 || newValue === 0 || Math.sign(previousValue) !== Math.sign(newValue)) {
    return "PICKEM_TRANSITION";
  }
  if (previousValue < 0 && newValue < previousValue) {
    return "FAVORITE_BECAME_STRONGER";
  }
  if (previousValue < 0 && newValue > previousValue) {
    return "FAVORITE_BECAME_WEAKER";
  }
  if (previousValue > 0 && newValue > previousValue) {
    return "UNDERDOG_BECAME_WEAKER";
  }
  if (previousValue > 0 && newValue < previousValue) {
    return "UNDERDOG_BECAME_STRONGER";
  }
  return "UNKNOWN";
}

export interface SpreadMovementDetector {
  detectMovement(previousSnapshot: SnapshotRecord | null | undefined, newSnapshot: SnapshotRecord): SpreadMovementDetectionResult;
  getEventById(eventId: string): SpreadMovementRecord | undefined;
  listEvents(): SpreadMovementRecord[];
}

export function createSpreadMovementDetector(
  options: { now?: () => Date } = {},
): SpreadMovementDetector {
  const now = options.now ?? (() => new Date());
  const eventStore: SpreadMovementRecord[] = [];

  return {
    detectMovement(previousSnapshot, newSnapshot) {
      if (!previousSnapshot) {
        return { status: "BLOCKED", reason: "MISSING_PREVIOUS_SNAPSHOT" };
      }
      if (!previousSnapshot.snapshot_id) {
        return { status: "BLOCKED", reason: "MISSING_PREVIOUS_SNAPSHOT_ID" };
      }
      if (!newSnapshot.snapshot_id) {
        return { status: "BLOCKED", reason: "MISSING_NEW_SNAPSHOT_ID" };
      }
      if (previousSnapshot.source_id !== newSnapshot.source_id) {
        return { status: "BLOCKED", reason: "SOURCE_MISMATCH" };
      }
      if (previousSnapshot.market_id !== newSnapshot.market_id) {
        return { status: "BLOCKED", reason: "MARKET_MISMATCH" };
      }
      if (!isSpreadRelated(previousSnapshot) || !isSpreadRelated(newSnapshot)) {
        return { status: "BLOCKED", reason: "MARKET_NOT_SPREAD_RELATED" };
      }

      const previousValue = previousSnapshot.snapshot_payload.line_value;
      const newValue = newSnapshot.snapshot_payload.line_value;

      if (!isNumericLineValue(previousValue)) {
        return { status: "BLOCKED", reason: "PREVIOUS_LINE_VALUE_INVALID" };
      }
      if (!isNumericLineValue(newValue)) {
        return { status: "BLOCKED", reason: "NEW_LINE_VALUE_INVALID" };
      }

      const movementDelta = newValue - previousValue;
      if (movementDelta === 0) {
        return {
          status: "NO_MOVEMENT",
          previous_snapshot_id: previousSnapshot.snapshot_id,
          new_snapshot_id: newSnapshot.snapshot_id,
          movement_size: 0,
        };
      }

      const eventId = `spread_movement_${hashDeterministically([
        "SPREAD_MOVEMENT",
        newSnapshot.source_id,
        newSnapshot.market_id,
        previousSnapshot.snapshot_id,
        newSnapshot.snapshot_id,
      ])}`;
      const existingEvent = eventStore.find((event) => event.event_id === eventId);
      if (existingEvent) {
        return {
          status: "RECORDED",
          event: clone(existingEvent),
          duplicate: true,
        };
      }

      const event: SpreadMovementRecord = Object.freeze({
        event_id: eventId,
        event_type: "SPREAD_MOVEMENT",
        previous_snapshot_id: previousSnapshot.snapshot_id,
        new_snapshot_id: newSnapshot.snapshot_id,
        previous_value: previousValue,
        new_value: newValue,
        movement_size: Math.abs(movementDelta),
        movement_direction: movementDelta > 0 ? "UP" : "DOWN",
        spread_effect: classifySpreadEffect(previousValue, newValue),
        market_id: newSnapshot.market_id,
        source_id: newSnapshot.source_id,
        timestamp: newSnapshot.snapshot_payload.timestamp,
        detected_at: now().toISOString(),
        schema_version: newSnapshot.schema_version,
      });

      eventStore.push(event);
      return {
        status: "RECORDED",
        event: clone(event),
        duplicate: false,
      };
    },
    getEventById(eventId) {
      const event = eventStore.find((entry) => entry.event_id === eventId);
      return event ? clone(event) : undefined;
    },
    listEvents() {
      return eventStore.map((event) => clone(event));
    },
  };
}
