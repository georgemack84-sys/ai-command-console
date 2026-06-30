import { createHash } from "crypto";
import type {
  PlayerPropAvailabilityStatus,
  PlayerPropMovementDetectionResult,
  PlayerPropMovementDirection,
  PlayerPropMovementRecord,
  PlayerPropMovementType,
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

function isPlayerProp(record: SnapshotRecord): boolean {
  return normalizeValue(record.snapshot_payload.market_type) === "player_prop";
}

function classifyPriceDirection(previousOdds: number, newOdds: number): PlayerPropMovementDirection {
  if (newOdds < previousOdds) {
    return "PRICE_SHORTENED";
  }
  if (newOdds > previousOdds) {
    return "PRICE_DRIFTED";
  }
  return "UNKNOWN";
}

function classifyAvailabilityDirection(
  previousStatus: PlayerPropAvailabilityStatus,
  newStatus: PlayerPropAvailabilityStatus,
): PlayerPropMovementDirection {
  if ((previousStatus === "AVAILABLE") && (newStatus === "SUSPENDED" || newStatus === "REMOVED")) {
    return "UNAVAILABLE";
  }
  if ((previousStatus === "SUSPENDED" || previousStatus === "REMOVED") && newStatus === "AVAILABLE") {
    return "AVAILABLE";
  }
  return "UNKNOWN";
}

function classifyMovementType(
  availabilityChanged: boolean,
  lineChanged: boolean,
  oddsChanged: boolean,
): PlayerPropMovementType {
  if (availabilityChanged && !lineChanged && !oddsChanged) {
    return "PROP_AVAILABILITY_CHANGE";
  }
  if (lineChanged && oddsChanged) {
    return "PROP_LINE_AND_ODDS_MOVEMENT";
  }
  if (lineChanged) {
    return "PROP_LINE_MOVEMENT";
  }
  return "PROP_ODDS_MOVEMENT";
}

export interface PlayerPropsMovementDetector {
  detectMovement(previousSnapshot: SnapshotRecord | null | undefined, newSnapshot: SnapshotRecord): PlayerPropMovementDetectionResult;
  getEventById(eventId: string): PlayerPropMovementRecord | undefined;
  listEvents(): PlayerPropMovementRecord[];
}

export function createPlayerPropsMovementDetector(
  options: { now?: () => Date } = {},
): PlayerPropsMovementDetector {
  const now = options.now ?? (() => new Date());
  const eventStore: PlayerPropMovementRecord[] = [];

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
      if (!isPlayerProp(previousSnapshot) || !isPlayerProp(newSnapshot)) {
        return { status: "BLOCKED", reason: "MARKET_NOT_PLAYER_PROP" };
      }

      const previousPlayerId = previousSnapshot.snapshot_payload.player_id;
      const newPlayerId = newSnapshot.snapshot_payload.player_id;
      const previousPlayerName = previousSnapshot.snapshot_payload.player_name;
      const newPlayerName = newSnapshot.snapshot_payload.player_name;
      const previousPropType = previousSnapshot.snapshot_payload.prop_type;
      const newPropType = newSnapshot.snapshot_payload.prop_type;

      if (!previousPlayerId || !newPlayerId) {
        return { status: "BLOCKED", reason: "PLAYER_ID_MISSING" };
      }
      if (!previousPlayerName || !newPlayerName) {
        return { status: "BLOCKED", reason: "PLAYER_NAME_MISSING" };
      }
      if (!previousPropType || !newPropType) {
        return { status: "BLOCKED", reason: "PROP_TYPE_MISSING" };
      }
      if (previousPlayerId !== newPlayerId) {
        return { status: "BLOCKED", reason: "PLAYER_ID_MISMATCH" };
      }
      if (previousPropType !== newPropType) {
        return { status: "BLOCKED", reason: "PROP_TYPE_MISMATCH" };
      }
      if (!previousSnapshot.snapshot_payload.timestamp || !newSnapshot.snapshot_payload.timestamp) {
        return { status: "BLOCKED", reason: "MISSING_TIMESTAMP" };
      }

      const previousLine = previousSnapshot.snapshot_payload.line_value;
      const newLine = newSnapshot.snapshot_payload.line_value;
      const previousOdds = previousSnapshot.snapshot_payload.odds_value;
      const newOdds = newSnapshot.snapshot_payload.odds_value;
      const previousAvailability = previousSnapshot.snapshot_payload.availability_status;
      const newAvailability = newSnapshot.snapshot_payload.availability_status;

      const lineChanged = previousLine !== newLine;
      const oddsChanged = previousOdds !== newOdds;
      const availabilityChanged = previousAvailability !== newAvailability;

      if (!lineChanged && !oddsChanged && !availabilityChanged) {
        return {
          status: "NO_MOVEMENT",
          previous_snapshot_id: previousSnapshot.snapshot_id,
          new_snapshot_id: newSnapshot.snapshot_id,
          line_movement_size: 0,
          odds_delta: 0,
        };
      }
      if (lineChanged && (!isNumericValue(previousLine) || !isNumericValue(newLine))) {
        return { status: "BLOCKED", reason: "LINE_VALUE_INVALID" };
      }
      if (oddsChanged && (!isNumericValue(previousOdds) || !isNumericValue(newOdds))) {
        return { status: "BLOCKED", reason: "ODDS_VALUE_INVALID" };
      }

      const eventId = `player_prop_movement_${hashDeterministically([
        "PLAYER_PROP_MOVEMENT",
        newSnapshot.source_id,
        newSnapshot.market_id,
        newPlayerId,
        newPropType,
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

      const lineDelta = lineChanged && isNumericValue(previousLine) && isNumericValue(newLine) ? newLine - previousLine : 0;
      const oddsDelta = oddsChanged && isNumericValue(previousOdds) && isNumericValue(newOdds) ? newOdds - previousOdds : null;
      const movementType = classifyMovementType(availabilityChanged, lineChanged, oddsChanged);

      let movementDirection: PlayerPropMovementDirection = "UNKNOWN";
      if (movementType === "PROP_AVAILABILITY_CHANGE") {
        movementDirection = classifyAvailabilityDirection(previousAvailability, newAvailability);
      } else if (lineChanged) {
        movementDirection = lineDelta > 0 ? "HIGHER" : "LOWER";
      } else if (oddsChanged && isNumericValue(previousOdds) && isNumericValue(newOdds)) {
        movementDirection = classifyPriceDirection(previousOdds, newOdds);
      }

      const event: PlayerPropMovementRecord = Object.freeze({
        event_id: eventId,
        event_type: "PLAYER_PROP_MOVEMENT",
        previous_snapshot_id: previousSnapshot.snapshot_id,
        new_snapshot_id: newSnapshot.snapshot_id,
        player_id: newPlayerId,
        player_name: newPlayerName,
        team: newSnapshot.snapshot_payload.team,
        prop_type: newPropType,
        previous_line: isNumericValue(previousLine) ? previousLine : null,
        new_line: isNumericValue(newLine) ? newLine : null,
        previous_odds: isNumericValue(previousOdds) ? previousOdds : null,
        new_odds: isNumericValue(newOdds) ? newOdds : null,
        line_movement_size: lineChanged ? Math.abs(lineDelta) : 0,
        odds_delta: oddsDelta,
        movement_type: movementType,
        movement_direction: movementDirection,
        availability_previous: previousAvailability,
        availability_new: newAvailability,
        market_id: newSnapshot.market_id,
        market_subtype: newSnapshot.snapshot_payload.market_subtype,
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
