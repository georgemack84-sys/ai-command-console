import { createHash } from "crypto";
import type {
  OddsShiftDetectionResult,
  OddsShiftRecord,
  OddsShiftType,
  OddsShiftVolatilityState,
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

function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function classifyShiftType(impliedProbabilityDelta: number): OddsShiftType {
  if (impliedProbabilityDelta > 0) {
    return "COMPRESSED";
  }
  if (impliedProbabilityDelta < 0) {
    return "EXPANDED";
  }
  return "UNCHANGED";
}

function classifyVolatilityState(shiftCount: number, timestampsValid: boolean): OddsShiftVolatilityState {
  if (!timestampsValid) {
    return "UNKNOWN";
  }
  if (shiftCount >= 4) {
    return "VOLATILE";
  }
  if (shiftCount >= 2) {
    return "ELEVATED";
  }
  return "NORMAL";
}

export interface OddsShiftMonitor {
  detectShift(previousSnapshot: SnapshotRecord | null | undefined, newSnapshot: SnapshotRecord): OddsShiftDetectionResult;
  getEventById(eventId: string): OddsShiftRecord | undefined;
  listEvents(): OddsShiftRecord[];
}

export function createOddsShiftMonitor(
  options: { now?: () => Date; windowSeconds?: number } = {},
): OddsShiftMonitor {
  const now = options.now ?? (() => new Date());
  const windowSeconds = options.windowSeconds ?? 300;
  const eventStore: OddsShiftRecord[] = [];

  function countShiftsInWindow(eventTimestamp: string, marketId: string, sourceId: string): { shiftCount: number; timestampsValid: boolean } {
    const targetMillis = Date.parse(eventTimestamp);
    if (Number.isNaN(targetMillis)) {
      return { shiftCount: 0, timestampsValid: false };
    }

    const shiftCount = eventStore.filter((event) => {
      if (event.market_id !== marketId || event.source_id !== sourceId) {
        return false;
      }
      const currentMillis = Date.parse(event.timestamp);
      if (Number.isNaN(currentMillis)) {
        return false;
      }
      return Math.abs(targetMillis - currentMillis) <= windowSeconds * 1000;
    }).length + 1;

    return { shiftCount, timestampsValid: true };
  }

  return {
    detectShift(previousSnapshot, newSnapshot) {
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
      if (normalizeValue(previousSnapshot.snapshot_payload.market_subtype) !== normalizeValue(newSnapshot.snapshot_payload.market_subtype)) {
        return { status: "BLOCKED", reason: "MARKET_SUBTYPE_MISMATCH" };
      }

      const previousParticipant = normalizeValue(previousSnapshot.snapshot_payload.participant);
      const newParticipant = normalizeValue(newSnapshot.snapshot_payload.participant);
      if ((previousParticipant ?? newParticipant) !== null && previousParticipant !== newParticipant) {
        return { status: "BLOCKED", reason: "PARTICIPANT_MISMATCH" };
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

      const eventId = `odds_shift_${hashDeterministically([
        "ODDS_SHIFT",
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

      const impliedProbabilityPrevious = calculateImpliedProbability(previousOdds);
      const impliedProbabilityNew = calculateImpliedProbability(newOdds);
      const impliedProbabilityDelta = impliedProbabilityNew - impliedProbabilityPrevious;
      const lineChanged = previousSnapshot.snapshot_payload.line_value !== newSnapshot.snapshot_payload.line_value;
      const { shiftCount, timestampsValid } = countShiftsInWindow(
        newSnapshot.snapshot_payload.timestamp,
        newSnapshot.market_id,
        newSnapshot.source_id,
      );

      const event: OddsShiftRecord = Object.freeze({
        event_id: eventId,
        event_type: "ODDS_SHIFT",
        previous_snapshot_id: previousSnapshot.snapshot_id,
        new_snapshot_id: newSnapshot.snapshot_id,
        previous_odds: previousOdds,
        new_odds: newOdds,
        price_delta: newOdds - previousOdds,
        implied_probability_previous: impliedProbabilityPrevious,
        implied_probability_new: impliedProbabilityNew,
        implied_probability_delta: impliedProbabilityDelta,
        shift_type: classifyShiftType(impliedProbabilityDelta),
        line_changed: lineChanged,
        price_only: !lineChanged,
        silent_market_pressure: !lineChanged,
        volatility_state: classifyVolatilityState(shiftCount, timestampsValid),
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
