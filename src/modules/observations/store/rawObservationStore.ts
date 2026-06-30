import { isNonEmptyString, isValidTimestamp, isValidVersion } from "../../../core";
import { createRawObservationStoreEvent, type RawObservationStoreEvent } from "../events/rawObservationStoreEvents";
import { createObservationReplayState, type ObservationReplayState } from "../replay/observationReplay";
import type { OwnershipRecord } from "../records/ownershipRecord";
import type { RawMarketObservation, RawObservationValidationResult } from "../records/rawMarketObservation";
import type { SourceReference } from "../records/sourceReference";
import type { ValidationRecord } from "../records/validationRecord";
import { createAppendOnlyStore } from "./appendOnlyStore";

export type AppendResult<T> =
  | { status: "APPENDED"; record: T; events: RawObservationStoreEvent[] }
  | { status: "REJECTED"; reasons: string[]; events: RawObservationStoreEvent[] };

function hasOwn(value: object, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, field);
}

export function validateRawMarketObservation(
  observation: Partial<RawMarketObservation> & Record<string, unknown>,
): RawObservationValidationResult {
  const reasons: string[] = [];

  for (const field of ["observation_id", "market_id", "source_id", "ownership_hash", "received_at", "schema_version", "storage_version"] as const) {
    if (!isNonEmptyString(observation[field])) reasons.push(`${field} is required`);
  }

  if (!hasOwn(observation, "raw_payload") || observation.raw_payload === undefined) {
    reasons.push("raw_payload is required");
  }

  if (!isValidTimestamp(observation.received_at)) reasons.push("received_at must be valid");
  if (!isValidVersion(observation.schema_version)) reasons.push("schema_version is required and must be valid");
  if (!isValidVersion(observation.storage_version)) reasons.push("storage_version is required and must be valid");

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}

function validateOwnershipRecordAgainstObservation(record: OwnershipRecord, observation?: RawMarketObservation): string[] {
  const reasons: string[] = [];
  if (!isNonEmptyString(record.ownership_hash)) reasons.push("ownership_hash is required");
  if (!isNonEmptyString(record.owner_id)) reasons.push("owner_id is required");
  if (!isNonEmptyString(record.tenant_id)) reasons.push("tenant_id is required");
  if (!isNonEmptyString(record.source_id)) reasons.push("source_id is required");
  if (!isNonEmptyString(record.market_id)) reasons.push("market_id is required");
  if (!isNonEmptyString(record.observation_id)) reasons.push("observation_id is required");
  if (!isValidTimestamp(record.timestamp)) reasons.push("timestamp must be valid");
  if (!isValidVersion(record.version)) reasons.push("version is required and must be valid");

  if (observation) {
    if (record.ownership_hash !== observation.ownership_hash) reasons.push("ownership_hash must match observation ownership_hash");
    if (record.source_id !== observation.source_id) reasons.push("source_id must match observation source_id");
    if (record.market_id !== observation.market_id) reasons.push("market_id must match observation market_id");
    if (record.observation_id !== observation.observation_id) reasons.push("observation_id must match stored observation");
  }

  return reasons;
}

function validateSourceReferenceAgainstObservation(record: SourceReference, observation?: RawMarketObservation): string[] {
  const reasons: string[] = [];
  if (!isNonEmptyString(record.source_id)) reasons.push("source_id is required");
  if (!isNonEmptyString(record.source_name)) reasons.push("source_name is required");
  if (!isNonEmptyString(record.owner_id)) reasons.push("owner_id is required");
  if (!isNonEmptyString(record.tenant_id)) reasons.push("tenant_id is required");
  if (!isValidTimestamp(record.referenced_at)) reasons.push("referenced_at must be valid");
  if (!isValidVersion(record.version)) reasons.push("version is required and must be valid");
  if (record.status === "DISABLED") reasons.push("disabled source reference is invalid unless recorded as blocked validation history");
  if (observation && record.source_id !== observation.source_id) reasons.push("source_id must match observation source_id");
  return reasons;
}

function validateValidationRecordAgainstObservation(record: ValidationRecord, observation?: RawMarketObservation): string[] {
  const reasons: string[] = [];
  if (!isNonEmptyString(record.validation_id)) reasons.push("validation_id is required");
  if (!isNonEmptyString(record.observation_id)) reasons.push("observation_id is required");
  if (!["VALID", "INVALID", "BLOCKED"].includes(record.status)) reasons.push("validation status is invalid");
  if (!isNonEmptyString(record.reason)) reasons.push("reason is required");
  if (!isNonEmptyString(record.validator)) reasons.push("validator is required");
  if (!isValidTimestamp(record.timestamp)) reasons.push("timestamp must be valid");
  if (!isValidVersion(record.version)) reasons.push("version is required and must be valid");
  if (observation && record.observation_id !== observation.observation_id) reasons.push("validation record must reference observation_id");
  return reasons;
}

export function createRawObservationStore() {
  const observations = createAppendOnlyStore<RawMarketObservation>();
  const ownershipRecords = createAppendOnlyStore<OwnershipRecord>();
  const sourceReferences = createAppendOnlyStore<SourceReference>();
  const validationRecords = createAppendOnlyStore<ValidationRecord>();
  const events = createAppendOnlyStore<RawObservationStoreEvent>();

  function recordEvent(event: RawObservationStoreEvent) {
    events.append(event);
    return event;
  }

  function getObservationById(observationId: string): RawMarketObservation | undefined {
    return observations.list().find((observation) => observation.observation_id === observationId);
  }

  return {
    appendRawObservation(observation: RawMarketObservation): AppendResult<RawMarketObservation> {
      const validation = validateRawMarketObservation(observation as Partial<RawMarketObservation> & Record<string, unknown>);
      if (validation.status === "REJECTED") {
        const event = recordEvent(createRawObservationStoreEvent({
          observation_id: observation.observation_id || "unknown_observation",
          event_type: "REPLAY_FAILED",
          severity: "WARN",
          reason: validation.reasons.join("; "),
          storage_version: observation.storage_version || "1.4",
        }));
        return { status: "REJECTED", reasons: validation.reasons, events: [event] };
      }

      const result = observations.append(observation);
      const appended = recordEvent(createRawObservationStoreEvent({
        observation_id: observation.observation_id,
        event_type: "RAW_OBSERVATION_APPENDED",
        reason: "Raw observation stored.",
        storage_version: observation.storage_version,
        timestamp: observation.received_at,
      }));
      const preserved = recordEvent(createRawObservationStoreEvent({
        observation_id: observation.observation_id,
        event_type: "RAW_PAYLOAD_PRESERVED",
        reason: "Raw payload preserved exactly as received.",
        storage_version: observation.storage_version,
        timestamp: observation.received_at,
      }));
      return { status: "APPENDED", record: result.record, events: [appended, preserved] };
    },
    appendOwnershipRecord(record: OwnershipRecord): AppendResult<OwnershipRecord> {
      const observation = getObservationById(record.observation_id);
      const reasons = observation ? validateOwnershipRecordAgainstObservation(record, observation) : ["raw observation is missing"];
      if (reasons.length > 0) {
        const event = recordEvent(createRawObservationStoreEvent({
          observation_id: record.observation_id || "unknown_observation",
          event_type: "REPLAY_FAILED",
          severity: "WARN",
          reason: reasons.join("; "),
          storage_version: record.version || "1.4",
        }));
        return { status: "REJECTED", reasons, events: [event] };
      }
      const result = ownershipRecords.append(record);
      const event = recordEvent(createRawObservationStoreEvent({
        observation_id: record.observation_id,
        event_type: "OWNERSHIP_RECORD_APPENDED",
        reason: "Ownership record attached.",
        storage_version: record.version,
        timestamp: record.timestamp,
      }));
      return { status: "APPENDED", record: result.record, events: [event] };
    },
    appendSourceReference(record: SourceReference, observationId: string): AppendResult<SourceReference> {
      const observation = getObservationById(observationId);
      const reasons = observation ? validateSourceReferenceAgainstObservation(record, observation) : ["raw observation is missing"];
      if (reasons.length > 0) {
        const event = recordEvent(createRawObservationStoreEvent({
          observation_id: observationId || "unknown_observation",
          event_type: "REPLAY_FAILED",
          severity: "WARN",
          reason: reasons.join("; "),
          storage_version: record.version || "1.4",
        }));
        return { status: "REJECTED", reasons, events: [event] };
      }
      const result = sourceReferences.append(record);
      const event = recordEvent(createRawObservationStoreEvent({
        observation_id: observationId,
        event_type: "SOURCE_REFERENCE_APPENDED",
        reason: "Source reference attached.",
        storage_version: record.version,
        timestamp: record.referenced_at,
      }));
      return { status: "APPENDED", record: result.record, events: [event] };
    },
    appendValidationRecord(record: ValidationRecord): AppendResult<ValidationRecord> {
      const observation = getObservationById(record.observation_id);
      const reasons = observation ? validateValidationRecordAgainstObservation(record, observation) : ["raw observation is missing"];
      if (reasons.length > 0) {
        const event = recordEvent(createRawObservationStoreEvent({
          observation_id: record.observation_id || "unknown_observation",
          event_type: "REPLAY_FAILED",
          severity: "WARN",
          reason: reasons.join("; "),
          storage_version: record.version || "1.4",
        }));
        return { status: "REJECTED", reasons, events: [event] };
      }
      const result = validationRecords.append(record);
      const event = recordEvent(createRawObservationStoreEvent({
        observation_id: record.observation_id,
        event_type: "VALIDATION_RECORD_APPENDED",
        reason: "Validation record attached.",
        storage_version: record.version,
        timestamp: record.timestamp,
      }));
      return { status: "APPENDED", record: result.record, events: [event] };
    },
    getObservationById,
    getObservationHistory() {
      return observations.list();
    },
    replayObservation(observationId: string): { status: "REPLAYED"; replay: ObservationReplayState } | { status: "REJECTED"; reasons: string[] } {
      recordEvent(createRawObservationStoreEvent({
        observation_id: observationId,
        event_type: "REPLAY_REQUESTED",
        reason: "Replay requested.",
        storage_version: "1.4",
      }));
      const rawObservation = getObservationById(observationId);
      const ownershipRecord = ownershipRecords.list().find((record) => record.observation_id === observationId);
      const sourceReference = sourceReferences.list().find((record) => rawObservation && record.source_id === rawObservation.source_id);
      const validationRecord = validationRecords.list().find((record) => record.observation_id === observationId);
      const reasons: string[] = [];

      if (!rawObservation) reasons.push("raw observation is missing");
      if (!ownershipRecord) reasons.push("ownership record is missing");
      if (!sourceReference) reasons.push("source reference is missing");
      if (!validationRecord) reasons.push("validation record is missing");

      if (rawObservation && ownershipRecord) reasons.push(...validateOwnershipRecordAgainstObservation(ownershipRecord, rawObservation));
      if (rawObservation && sourceReference) reasons.push(...validateSourceReferenceAgainstObservation(sourceReference, rawObservation));
      if (rawObservation && validationRecord) reasons.push(...validateValidationRecordAgainstObservation(validationRecord, rawObservation));

      if (reasons.length > 0 || !rawObservation || !ownershipRecord || !sourceReference || !validationRecord) {
        recordEvent(createRawObservationStoreEvent({
          observation_id: observationId,
          event_type: "REPLAY_FAILED",
          severity: "WARN",
          reason: reasons.join("; "),
          storage_version: rawObservation?.storage_version ?? "1.4",
        }));
        return { status: "REJECTED", reasons };
      }

      const replay = createObservationReplayState({ rawObservation, ownershipRecord, sourceReference, validationRecord });
      recordEvent(createRawObservationStoreEvent({
        observation_id: observationId,
        event_type: "REPLAY_COMPLETED",
        reason: "Historical observation state reconstructed.",
        storage_version: rawObservation.storage_version,
      }));
      return { status: "REPLAYED", replay };
    },
    listObservationsByMarket(marketId: string) {
      return observations.list().filter((observation) => observation.market_id === marketId);
    },
    listObservationsBySource(sourceId: string) {
      return observations.list().filter((observation) => observation.source_id === sourceId);
    },
    listEvents() {
      return events.list();
    },
  };
}
