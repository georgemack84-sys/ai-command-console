import { createHash } from "crypto";
import type {
  MoneylineMovementDetectionResult,
  MoneylineMovementDirection,
  MoneylineMovementRecord,
  SnapshotRecord,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function normalizeValue(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim().toLowerCase();
}

function isNumericValue(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidAmericanOdds(value: number | null): value is number {
  if (!isNumericValue(value)) {
    return false;
  }
  return value >= 100 || value <= -100;
}

function isMoneyline(record: SnapshotRecord): boolean {
  return normalizeValue(record.snapshot_payload.market_type) === "moneyline";
}

function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function classifyMovementDirection(previousOdds: number, newOdds: number): MoneylineMovementDirection {
  if (Math.sign(previousOdds) !== Math.sign(newOdds)) {
    return "CROSS_ZERO_TRANSITION";
  }
  if (previousOdds < 0 && newOdds < previousOdds) {
    return "FAVORITE_SHORTENED";
  }
  if (previousOdds < 0 && newOdds > previousOdds) {
    return "FAVORITE_DRIFTED";
  }
  if (previousOdds > 0 && newOdds < previousOdds) {
    return "UNDERDOG_SHORTENED";
  }
  if (previousOdds > 0 && newOdds > previousOdds) {
    return "UNDERDOG_DRIFTED";
  }
  return "UNKNOWN";
}

export interface MoneylineMovementDetector {
  detectMovement(previousSnapshot: SnapshotRecord | null | undefined, newSnapshot: SnapshotRecord): MoneylineMovementDetectionResult;
  getEventById(eventId: string): MoneylineMovementRecord | undefined;
  listEvents(): MoneylineMovementRecord[];
}

export function createMoneylineMovementDetector(
  options: { now?: () => Date } = {},
): MoneylineMovementDetector {
  const now = options.now ?? (() => new Date());
  const eventStore: MoneylineMovementRecord[] = [];

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
      if (normalizeValue(previousSnapshot.snapshot_payload.market_type) !== normalizeValue(newSnapshot.snapshot_payload.market_type)) {
        return { status: "BLOCKED", reason: "MARKET_TYPE_MISMATCH" };
      }
      if (!isMoneyline(previousSnapshot) || !isMoneyline(newSnapshot)) {
        return { status: "BLOCKED", reason: "MARKET_NOT_MONEYLINE" };
      }
      if (!previousSnapshot.snapshot_payload.timestamp || !newSnapshot.snapshot_payload.timestamp) {
        return { status: "BLOCKED", reason: "MISSING_TIMESTAMP" };
      }

      const previousOdds = previousSnapshot.snapshot_payload.odds_value;
      const newOdds = newSnapshot.snapshot_payload.odds_value;
      if (!isValidAmericanOdds(previousOdds)) {
        return { status: "BLOCKED", reason: "PREVIOUS_ODDS_INVALID" };
      }
      if (!isValidAmericanOdds(newOdds)) {
        return { status: "BLOCKED", reason: "NEW_ODDS_INVALID" };
      }
      if (previousOdds === newOdds) {
        return {
          status: "NO_MOVEMENT",
          previous_snapshot_id: previousSnapshot.snapshot_id,
          new_snapshot_id: newSnapshot.snapshot_id,
          price_delta: 0,
        };
      }

      const eventId = `moneyline_movement_${hashDeterministically([
        "MONEYLINE_MOVEMENT",
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

      const impliedPrevious = calculateImpliedProbability(previousOdds);
      const impliedNew = calculateImpliedProbability(newOdds);
      const event: MoneylineMovementRecord = Object.freeze({
        event_id: eventId,
        event_type: "MONEYLINE_MOVEMENT",
        previous_snapshot_id: previousSnapshot.snapshot_id,
        new_snapshot_id: newSnapshot.snapshot_id,
        previous_odds: previousOdds,
        new_odds: newOdds,
        price_delta: newOdds - previousOdds,
        implied_probability_previous: impliedPrevious,
        implied_probability_new: impliedNew,
        implied_probability_delta: impliedNew - impliedPrevious,
        movement_direction: classifyMovementDirection(previousOdds, newOdds),
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
