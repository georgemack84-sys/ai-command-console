import { createHash } from "crypto";
import type {
  SnapshotRecord,
  TotalsMovementDetectionResult,
  TotalsMovementRecord,
  TotalsPriceSide,
  TotalsScope,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function isNumericValue(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeValue(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim().toLowerCase();
}

function isTotalsRelated(record: SnapshotRecord): boolean {
  const marketType = normalizeValue(record.snapshot_payload.market_type);
  const marketSubtype = normalizeValue(record.snapshot_payload.market_subtype);
  return marketType === "total" || marketType === "team_total" || marketType === "alternate_total" || marketSubtype === "alternate_total";
}

function classifyTotalsScope(record: SnapshotRecord): TotalsScope {
  const marketType = normalizeValue(record.snapshot_payload.market_type);
  const marketSubtype = normalizeValue(record.snapshot_payload.market_subtype);
  if (marketType === "team_total") {
    return "TEAM_TOTAL";
  }
  if (marketType === "alternate_total" || marketSubtype === "alternate_total") {
    return "ALTERNATE_TOTAL";
  }
  return "GAME_TOTAL";
}

function classifyPriceSide(record: SnapshotRecord): TotalsPriceSide {
  const side = normalizeValue(record.snapshot_payload.side);
  if (side === "over") return "OVER";
  if (side === "under") return "UNDER";
  if (side === null) return "UNKNOWN";
  return "NONE";
}

export interface TotalsMovementDetector {
  detectMovement(previousSnapshot: SnapshotRecord | null | undefined, newSnapshot: SnapshotRecord): TotalsMovementDetectionResult;
  getEventById(eventId: string): TotalsMovementRecord | undefined;
  listEvents(): TotalsMovementRecord[];
}

export function createTotalsMovementDetector(
  options: { now?: () => Date } = {},
): TotalsMovementDetector {
  const now = options.now ?? (() => new Date());
  const eventStore: TotalsMovementRecord[] = [];

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
      if (normalizeValue(previousSnapshot.snapshot_payload.market_subtype) !== normalizeValue(newSnapshot.snapshot_payload.market_subtype)) {
        return { status: "BLOCKED", reason: "MARKET_SUBTYPE_MISMATCH" };
      }

      const previousParticipant = normalizeValue(previousSnapshot.snapshot_payload.participant);
      const newParticipant = normalizeValue(newSnapshot.snapshot_payload.participant);
      if ((previousParticipant ?? newParticipant) !== null && previousParticipant !== newParticipant) {
        return { status: "BLOCKED", reason: "PARTICIPANT_MISMATCH" };
      }
      if (!isTotalsRelated(previousSnapshot) || !isTotalsRelated(newSnapshot)) {
        return { status: "BLOCKED", reason: "MARKET_NOT_TOTALS_RELATED" };
      }
      if (!previousSnapshot.snapshot_payload.timestamp || !newSnapshot.snapshot_payload.timestamp) {
        return { status: "BLOCKED", reason: "MISSING_TIMESTAMP" };
      }

      const previousLine = previousSnapshot.snapshot_payload.line_value;
      const newLine = newSnapshot.snapshot_payload.line_value;
      const previousOdds = previousSnapshot.snapshot_payload.odds_value;
      const newOdds = newSnapshot.snapshot_payload.odds_value;

      const lineChanged = previousLine !== newLine;
      const oddsChanged = previousOdds !== newOdds;

      if (!lineChanged && !oddsChanged) {
        return {
          status: "NO_MOVEMENT",
          previous_snapshot_id: previousSnapshot.snapshot_id,
          new_snapshot_id: newSnapshot.snapshot_id,
          movement_size: 0,
          odds_delta: 0,
        };
      }
      if (lineChanged && (!isNumericValue(previousLine) || !isNumericValue(newLine))) {
        return { status: "BLOCKED", reason: "LINE_VALUE_INVALID" };
      }
      if (oddsChanged && (!isNumericValue(previousOdds) || !isNumericValue(newOdds))) {
        return { status: "BLOCKED", reason: "ODDS_VALUE_INVALID" };
      }

      const eventId = `totals_movement_${hashDeterministically([
        "TOTALS_MOVEMENT",
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

      const numericPreviousLine = isNumericValue(previousLine) ? previousLine : null;
      const numericNewLine = isNumericValue(newLine) ? newLine : null;
      const numericPreviousOdds = isNumericValue(previousOdds) ? previousOdds : null;
      const numericNewOdds = isNumericValue(newOdds) ? newOdds : null;
      const movementDelta = lineChanged && numericPreviousLine !== null && numericNewLine !== null
        ? numericNewLine - numericPreviousLine
        : 0;
      const oddsDelta = oddsChanged && numericPreviousOdds !== null && numericNewOdds !== null
        ? numericNewOdds - numericPreviousOdds
        : null;
      const event: TotalsMovementRecord = Object.freeze({
        event_id: eventId,
        event_type: "TOTALS_MOVEMENT",
        previous_snapshot_id: previousSnapshot.snapshot_id,
        new_snapshot_id: newSnapshot.snapshot_id,
        previous_total: numericPreviousLine ?? 0,
        new_total: numericNewLine ?? 0,
        movement_size: lineChanged ? Math.abs(movementDelta) : 0,
        movement_direction: lineChanged ? (movementDelta > 0 ? "HIGHER" : "LOWER") : "PRICE_ONLY",
        totals_scope: classifyTotalsScope(newSnapshot),
        price_side: classifyPriceSide(newSnapshot),
        previous_odds: numericPreviousOdds,
        new_odds: numericNewOdds,
        odds_delta: oddsDelta,
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
