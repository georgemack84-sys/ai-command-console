import { createHash } from "crypto";
import { isNonEmptyString, isValidTimestamp, isValidVersion } from "../../core";
import type { SourceRegistryStore } from "../sources";
import type {
  MarketSnapshot,
  MarketSnapshotEvent,
  MarketSnapshotInput,
  MarketSnapshotStatus,
  SnapshotIntakeResult,
  SnapshotRecord,
  SnapshotSourceReference,
  SnapshotValidationError,
  SnapshotValidationRecord,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function hashDeterministically(parts: readonly (string | number | null | undefined)[]): string {
  return createHash("sha256").update(parts.map((part) => String(part ?? "")).join("|")).digest("hex");
}

function normalizeParticipant(
  participant: string | null | undefined,
  marketType: string,
  marketSubtype: string,
): string | null {
  const normalizedMarketType = marketType.trim().toLowerCase();
  const normalizedMarketSubtype = marketSubtype.trim().toLowerCase();
  if (!participant || participant.trim().length === 0) {
    if (normalizedMarketType === "total" || normalizedMarketSubtype.includes("total")) return "game_total";
    return null;
  }

  return participant.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSide(side: string | null | undefined): string | null {
  if (!side || side.trim().length === 0) {
    return null;
  }
  return side.trim().toLowerCase();
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeAvailabilityStatus(value: string | null | undefined): MarketSnapshot["availability_status"] {
  const normalized = normalizeText(value);
  if (normalized === "available") return "AVAILABLE";
  if (normalized === "suspended") return "SUSPENDED";
  if (normalized === "removed") return "REMOVED";
  return "UNKNOWN";
}

function generateMarketId(input: {
  sport: string;
  league: string;
  event_id: string;
  market_type: string;
  market_subtype: string;
  participant: string | null;
  player_id: string | null;
  prop_type: string | null;
  side: string | null;
}): string {
  return `market_${hashDeterministically([
    input.sport.trim().toLowerCase(),
    input.league.trim().toLowerCase(),
    input.event_id.trim(),
    input.market_type.trim().toLowerCase(),
    input.market_subtype.trim().toLowerCase(),
    input.participant ?? "",
    input.player_id ?? "",
    input.prop_type ?? "",
    input.side ?? "",
  ])}`;
}

function generateSnapshotId(sourceId: string, marketId: string, timestamp: string): string {
  return `snapshot_${hashDeterministically([sourceId.trim(), marketId.trim(), timestamp.trim()])}`;
}

function createEvent(input: {
  snapshot_id: string;
  market_id: string;
  source_id: string;
  event_type: MarketSnapshotEvent["event_type"];
  reason: string;
  timestamp: string;
  severity?: MarketSnapshotEvent["severity"];
}): MarketSnapshotEvent {
  return Object.freeze({
    event_id: `snapshot_event_${hashDeterministically([input.snapshot_id, input.event_type, input.timestamp])}`,
    snapshot_id: input.snapshot_id,
    market_id: input.market_id,
    source_id: input.source_id,
    event_type: input.event_type,
    severity: input.severity ?? "INFO",
    reason: input.reason,
    timestamp: input.timestamp,
  });
}

function createValidationError(field: string, code: SnapshotValidationError["code"], message: string): SnapshotValidationError {
  return Object.freeze({ field, code, message });
}

function determineRejectedStatus(errors: readonly SnapshotValidationError[]): MarketSnapshotStatus {
  if (errors.some((error) => error.code === "MISSING_TIMESTAMP")) return "MISSING_TIMESTAMP";
  if (errors.some((error) => error.code === "INVALID_TIMESTAMP")) return "MALFORMED_TIMESTAMP";
  if (errors.some((error) => error.code === "RAW_PAYLOAD_MISSING")) return "RAW_PAYLOAD_MISSING";
  if (errors.some((error) => ["MISSING_SOURCE", "UNKNOWN_SOURCE", "DISABLED_SOURCE"].includes(error.code))) return "INVALID_SOURCE";
  if (errors.some((error) => error.code === "MISSING_MARKET_IDENTITY")) return "MISSING_MARKET_IDENTITY";
  return "MISSING_REQUIRED_FIELDS";
}

function compareSnapshotOrder(left: SnapshotRecord, right: SnapshotRecord): number {
  const timestampDelta = Date.parse(right.snapshot_payload.timestamp) - Date.parse(left.snapshot_payload.timestamp);
  if (timestampDelta !== 0) return timestampDelta;
  return Date.parse(right.snapshot_payload.collected_at) - Date.parse(left.snapshot_payload.collected_at);
}

function isMarketTypeMoneyline(marketType: string): boolean {
  return marketType.trim().toLowerCase() === "moneyline";
}

function isMarketTypeSpread(marketType: string): boolean {
  return marketType.trim().toLowerCase() === "spread";
}

function isMarketTypeTotal(marketType: string, marketSubtype: string): boolean {
  const type = marketType.trim().toLowerCase();
  const subtype = marketSubtype.trim().toLowerCase();
  return type === "total" || subtype.includes("total");
}

function isPlayerProp(marketType: string, marketSubtype: string): boolean {
  const type = marketType.trim().toLowerCase();
  const subtype = marketSubtype.trim().toLowerCase();
  return type === "player_prop" || subtype.startsWith("player_");
}

function validateInputShape(
  input: MarketSnapshotInput,
  normalizedParticipant: string | null,
  normalizedPlayerId: string | null,
  normalizedPlayerName: string | null,
  normalizedPropType: string | null,
): SnapshotValidationError[] {
  const errors: SnapshotValidationError[] = [];

  if (!isNonEmptyString(input.source_id)) {
    errors.push(createValidationError("source_id", "MISSING_SOURCE", "source_id is required"));
  }
  if (!isNonEmptyString(input.event_id)) {
    errors.push(createValidationError("event_id", "MISSING_EVENT_ID", "event_id is required"));
  }
  if (!isNonEmptyString(input.market_type)) {
    errors.push(createValidationError("market_type", "MISSING_MARKET_TYPE", "market_type is required"));
  }
  if (!isNonEmptyString(input.timestamp)) {
    errors.push(createValidationError("timestamp", "MISSING_TIMESTAMP", "timestamp is required"));
  } else if (!isValidTimestamp(input.timestamp)) {
    errors.push(createValidationError("timestamp", "INVALID_TIMESTAMP", "timestamp must be valid"));
  }
  if (!isValidVersion(input.schema_version)) {
    errors.push(createValidationError("schema_version", "SCHEMA_ERROR", "schema_version is required and must be valid"));
  }
  if (input.raw_payload_json === undefined) {
    errors.push(createValidationError("raw_payload_json", "RAW_PAYLOAD_MISSING", "raw_payload_json is required"));
  }
  if (!isNonEmptyString(input.sport)) {
    errors.push(createValidationError("sport", "SCHEMA_ERROR", "sport is required"));
  }
  if (!isNonEmptyString(input.league)) {
    errors.push(createValidationError("league", "SCHEMA_ERROR", "league is required"));
  }
  if (!isNonEmptyString(input.market_subtype)) {
    errors.push(createValidationError("market_subtype", "SCHEMA_ERROR", "market_subtype is required"));
  }

  if (isPlayerProp(input.market_type, input.market_subtype) && !normalizedParticipant) {
    errors.push(createValidationError("participant", "MISSING_MARKET_IDENTITY", "player props require participant identity"));
  }
  if (isPlayerProp(input.market_type, input.market_subtype) && !normalizedPlayerId) {
    errors.push(createValidationError("player_id", "MISSING_MARKET_IDENTITY", "player props require player_id"));
  }
  if (isPlayerProp(input.market_type, input.market_subtype) && !normalizedPlayerName) {
    errors.push(createValidationError("player_name", "MISSING_MARKET_IDENTITY", "player props require player_name"));
  }
  if (isPlayerProp(input.market_type, input.market_subtype) && !normalizedPropType) {
    errors.push(createValidationError("prop_type", "MISSING_MARKET_IDENTITY", "player props require prop_type"));
  }
  if (isMarketTypeSpread(input.market_type) && input.line_value === null || isMarketTypeSpread(input.market_type) && input.line_value === undefined) {
    errors.push(createValidationError("line_value", "MISSING_MARKET_IDENTITY", "spread requires line_value"));
  }
  if (isMarketTypeTotal(input.market_type, input.market_subtype) && (input.line_value === null || input.line_value === undefined)) {
    errors.push(createValidationError("line_value", "MISSING_MARKET_IDENTITY", "totals require line_value"));
  }
  if (isMarketTypeMoneyline(input.market_type) && input.line_value !== null && input.line_value !== undefined) {
    errors.push(createValidationError("line_value", "SCHEMA_ERROR", "moneyline line_value must be null when provided"));
  }

  if (!isMarketTypeMoneyline(input.market_type) && !isPlayerProp(input.market_type, input.market_subtype) && !isMarketTypeSpread(input.market_type) && !isMarketTypeTotal(input.market_type, input.market_subtype)) {
    if (!normalizedParticipant && (input.line_value === null || input.line_value === undefined)) {
      errors.push(createValidationError("market_identity", "MISSING_MARKET_IDENTITY", "market identity could not be resolved"));
    }
  }

  return errors;
}

function createSourceReference(store: SourceRegistryStore, sourceId: string): { reference: SnapshotSourceReference; errors: SnapshotValidationError[] } {
  if (!isNonEmptyString(sourceId)) {
    return {
      reference: Object.freeze({
        source_id: sourceId,
        source_name: "unknown_source",
        source_type: "unknown",
        status: "MISSING_SOURCE",
        version: "1.1.0",
      }),
      errors: [createValidationError("source_id", "MISSING_SOURCE", "source_id is required")],
    };
  }

  const source = store.getSourceById(sourceId);
  if (!source) {
    return {
      reference: Object.freeze({
        source_id: sourceId,
        source_name: "unknown_source",
        source_type: "unknown",
        status: "UNKNOWN_SOURCE",
        version: "1.1.0",
      }),
      errors: [createValidationError("source_id", "UNKNOWN_SOURCE", "source_id is not registered")],
    };
  }

  if (source.status !== "ACTIVE") {
    return {
      reference: Object.freeze({
        source_id: source.source_id,
        source_name: source.source_name,
        source_type: source.source_type,
        status: "DISABLED_SOURCE",
        version: source.version,
      }),
      errors: [createValidationError("source_id", "DISABLED_SOURCE", "source is not active for intake")],
    };
  }

  return {
    reference: Object.freeze({
      source_id: source.source_id,
      source_name: source.source_name,
      source_type: source.source_type,
      status: "VALID_SOURCE",
      version: source.version,
    }),
    errors: [],
  };
}

export interface MarketSnapshotIntakeLayer {
  intakeSnapshot(input: MarketSnapshotInput): SnapshotIntakeResult;
  getSnapshotById(snapshotId: string): SnapshotRecord | undefined;
  listSnapshots(): SnapshotRecord[];
  listValidationAudits(): SnapshotValidationRecord[];
  listEvents(): MarketSnapshotEvent[];
  listSnapshotsByMarket(sourceId: string, marketId: string): SnapshotRecord[];
}

export function createMarketSnapshotIntakeLayer(
  sourceRegistry: SourceRegistryStore,
  options: { now?: () => Date } = {},
): MarketSnapshotIntakeLayer {
  const now = options.now ?? (() => new Date());
  const snapshotStore: SnapshotRecord[] = [];
  const validationAudits: SnapshotValidationRecord[] = [];
  const events: MarketSnapshotEvent[] = [];

  function listSnapshotsByMarket(sourceId: string, marketId: string): SnapshotRecord[] {
    return snapshotStore
      .filter((record) => record.source_id === sourceId && record.market_id === marketId)
      .sort(compareSnapshotOrder)
      .map((record) => clone(record));
  }

  function getPreviousSnapshot(sourceId: string, marketId: string, snapshotId: string): SnapshotRecord | undefined {
    return snapshotStore
      .filter((record) => record.source_id === sourceId && record.market_id === marketId && record.snapshot_id !== snapshotId)
      .sort(compareSnapshotOrder)[0];
  }

  return {
    intakeSnapshot(input) {
      const collectedAt = now().toISOString();
      const normalizedParticipant = normalizeParticipant(input.participant ?? null, input.market_type, input.market_subtype);
      const normalizedPlayerId = normalizeText(input.player_id ?? null);
      const normalizedPlayerName = normalizeText(input.player_name ?? null);
      const normalizedTeam = normalizeText(input.team ?? null);
      const normalizedPropType = normalizeText(input.prop_type ?? null);
      const normalizedAvailabilityStatus = normalizeAvailabilityStatus(input.availability_status ?? null);
      const normalizedSide = normalizeSide(input.side ?? null);
      const marketIdentityBroken = !isNonEmptyString(input.sport)
        || !isNonEmptyString(input.league)
        || !isNonEmptyString(input.event_id)
        || !isNonEmptyString(input.market_type)
        || !isNonEmptyString(input.market_subtype);
      const marketId = marketIdentityBroken
        ? "market_unresolved"
        : generateMarketId({
            sport: input.sport,
            league: input.league,
            event_id: input.event_id,
            market_type: input.market_type,
            market_subtype: input.market_subtype,
            participant: normalizedParticipant,
            player_id: normalizedPlayerId,
            prop_type: normalizedPropType,
            side: normalizedSide,
          });
      const attemptedSnapshotId = generateSnapshotId(input.source_id ?? "unknown_source", marketId, input.timestamp ?? "missing_timestamp");

      const receivedEvent = createEvent({
        snapshot_id: attemptedSnapshotId,
        market_id: marketId,
        source_id: input.source_id ?? "unknown_source",
        event_type: "SNAPSHOT_RECEIVED",
        reason: "Source payload received.",
        timestamp: collectedAt,
      });
      events.push(receivedEvent);

      const { reference: sourceReference, errors: sourceErrors } = createSourceReference(sourceRegistry, input.source_id);
      const validationErrors = [
        ...sourceErrors,
        ...validateInputShape(input, normalizedParticipant, normalizedPlayerId, normalizedPlayerName, normalizedPropType),
      ];

      if (marketIdentityBroken) {
        validationErrors.push(createValidationError("market_id", "MISSING_MARKET_IDENTITY", "market identity could not be resolved"));
      }

      const duplicate = snapshotStore.find((record) => record.snapshot_id === attemptedSnapshotId);
      if (duplicate) {
        const duplicateEvent = createEvent({
          snapshot_id: attemptedSnapshotId,
          market_id: duplicate.market_id,
          source_id: duplicate.source_id,
          event_type: "SNAPSHOT_READY",
          reason: "Duplicate intake resolved idempotently.",
          timestamp: collectedAt,
        });
        events.push(duplicateEvent);
        return {
          status: "ACCEPTED",
          record: clone(duplicate),
          events: [clone(receivedEvent), clone(duplicateEvent)],
          duplicate: true,
        };
      }

      if (validationErrors.length > 0) {
        const rejectedStatus = determineRejectedStatus(validationErrors);
        const auditRecord: SnapshotValidationRecord = Object.freeze({
          attempted_snapshot_id: attemptedSnapshotId,
          source_id: input.source_id ?? "unknown_source",
          validation_errors: validationErrors.map((error) => clone(error)),
          raw_payload_json: clone(input.raw_payload_json),
          rejection_reason: validationErrors.map((error) => error.message).join("; "),
          created_at: collectedAt,
        });
        validationAudits.push(auditRecord);
        const rejectedEvent = createEvent({
          snapshot_id: attemptedSnapshotId,
          market_id: marketId,
          source_id: input.source_id ?? "unknown_source",
          event_type: "SNAPSHOT_REJECTED",
          severity: "WARN",
          reason: auditRecord.rejection_reason,
          timestamp: collectedAt,
        });
        events.push(rejectedEvent);
        return {
          status: "REJECTED",
          attempted_snapshot_id: attemptedSnapshotId,
          snapshot_status: rejectedStatus,
          validation_errors: validationErrors.map((error) => clone(error)),
          audit_record: clone(auditRecord),
          events: [clone(receivedEvent), clone(rejectedEvent)],
        };
      }

      const snapshotPayload: MarketSnapshot = Object.freeze({
        snapshot_id: attemptedSnapshotId,
        source_id: input.source_id,
        sport: input.sport.trim(),
        league: input.league.trim(),
        event_id: input.event_id.trim(),
        market_id: marketId,
        market_type: input.market_type.trim(),
        market_subtype: input.market_subtype.trim(),
        participant: normalizedParticipant,
        player_id: normalizedPlayerId,
        player_name: normalizedPlayerName,
        team: normalizedTeam,
        prop_type: normalizedPropType,
        availability_status: normalizedAvailabilityStatus,
        side: normalizedSide,
        line_value: input.line_value ?? null,
        odds_value: input.odds_value ?? null,
        timestamp: input.timestamp,
        collected_at: collectedAt,
        schema_version: input.schema_version,
      });

      const previousSnapshot = getPreviousSnapshot(snapshotPayload.source_id, snapshotPayload.market_id, snapshotPayload.snapshot_id);
      const previousStateEvent = createEvent({
        snapshot_id: snapshotPayload.snapshot_id,
        market_id: snapshotPayload.market_id,
        source_id: snapshotPayload.source_id,
        event_type: previousSnapshot ? "PREVIOUS_STATE_FOUND" : "PREVIOUS_STATE_NOT_FOUND",
        reason: previousSnapshot ? "Previous snapshot found for source and market." : "Initial observation recorded.",
        timestamp: collectedAt,
      });
      events.push(previousStateEvent);

      const validatedEvent = createEvent({
        snapshot_id: snapshotPayload.snapshot_id,
        market_id: snapshotPayload.market_id,
        source_id: snapshotPayload.source_id,
        event_type: "SNAPSHOT_VALIDATED",
        reason: "Snapshot validated deterministically.",
        timestamp: collectedAt,
      });
      events.push(validatedEvent);

      const record: SnapshotRecord = Object.freeze({
        snapshot_id: snapshotPayload.snapshot_id,
        market_id: snapshotPayload.market_id,
        source_id: snapshotPayload.source_id,
        snapshot_payload: snapshotPayload,
        raw_payload_json: clone(input.raw_payload_json),
        previous_snapshot_id: previousSnapshot?.snapshot_id ?? null,
        validation_errors: [],
        status: "SNAPSHOT_READY",
        created_at: collectedAt,
        schema_version: snapshotPayload.schema_version,
        source_reference: sourceReference,
      });
      snapshotStore.push(record);

      const storedEvent = createEvent({
        snapshot_id: snapshotPayload.snapshot_id,
        market_id: snapshotPayload.market_id,
        source_id: snapshotPayload.source_id,
        event_type: "SNAPSHOT_STORED",
        reason: "Snapshot stored append-only.",
        timestamp: collectedAt,
      });
      const readyEvent = createEvent({
        snapshot_id: snapshotPayload.snapshot_id,
        market_id: snapshotPayload.market_id,
        source_id: snapshotPayload.source_id,
        event_type: "SNAPSHOT_READY",
        reason: "Snapshot ready for later comparison.",
        timestamp: collectedAt,
      });
      events.push(storedEvent, readyEvent);

      return {
        status: "ACCEPTED",
        record: clone(record),
        events: [receivedEvent, previousStateEvent, validatedEvent, storedEvent, readyEvent].map((event) => clone(event)),
        duplicate: false,
      };
    },
    getSnapshotById(snapshotId) {
      const record = snapshotStore.find((entry) => entry.snapshot_id === snapshotId);
      return record ? clone(record) : undefined;
    },
    listSnapshots() {
      return snapshotStore.map((record) => clone(record));
    },
    listValidationAudits() {
      return validationAudits.map((record) => clone(record));
    },
    listEvents() {
      return events.map((event) => clone(event));
    },
    listSnapshotsByMarket,
  };
}
