import type { MarketObservation } from "../../markets";
import type { OwnershipContract } from "../../ownership";
import type { SourceRegistryStore } from "../../sources";
import { createVerificationEvent, type VerificationEvent } from "../events/verificationEvents";
import type { VerificationFailureRecord } from "../records/verificationFailureRecord";
import type { StageVerificationResult, VerificationResult, VerificationStage } from "../records/verificationResult";
import { createDuplicateController } from "../validators/duplicateControl";
import { verifyObservationOwnership } from "../validators/ownershipVerification";
import { verifyRequiredFields } from "../validators/requiredFieldVerification";
import { verifyMarketSchema } from "../validators/schemaVerification";
import { verifySourceRegistration } from "../validators/sourceVerification";
import { verifyObservationTimestamps } from "../validators/timestampVerification";
import { authorizeVerifiedObservationForStore } from "../guards/storeAuthorizationGuard";

export interface ObservationVerificationEngine {
  verifyObservation(input: {
    observation: Partial<MarketObservation> & Record<string, unknown>;
    ownership?: Partial<OwnershipContract> & Record<string, unknown>;
  }): { result: VerificationResult; failureRecord?: VerificationFailureRecord; events: VerificationEvent[] };
  authorizeForStore(result: VerificationResult | undefined): { status: "AUTHORIZED" } | { status: "DENIED"; reason: string };
  listFailures(): VerificationFailureRecord[];
  listEvents(): VerificationEvent[];
}

function valueOrUnknown(value: unknown): string {
  return typeof value === "string" && value.trim() !== "" ? value : "unknown";
}

function verificationIdFor(observation: Partial<MarketObservation>, version: string): string {
  return `verification_${valueOrUnknown(observation.source_id)}_${valueOrUnknown(observation.market_id)}_${valueOrUnknown(observation.timestamp)}_${version}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function createResult(input: {
  observation: Partial<MarketObservation>;
  status: VerificationResult["status"];
  version: string;
  failedStage?: VerificationStage;
  failureReason?: string;
}): VerificationResult {
  const timestamp = typeof input.observation.timestamp === "string" ? input.observation.timestamp : new Date(0).toISOString();
  return {
    verification_id: verificationIdFor(input.observation, input.version),
    observation_id: valueOrUnknown((input.observation as { observation_id?: unknown }).observation_id),
    market_id: valueOrUnknown(input.observation.market_id),
    source_id: valueOrUnknown(input.observation.source_id),
    ownership_hash: valueOrUnknown(input.observation.ownership_hash),
    status: input.status,
    failure_reason: input.failureReason,
    failed_stage: input.failedStage,
    timestamp,
    version: input.version,
  };
}

function failureRecordFromResult(
  result: VerificationResult,
  observation: Partial<MarketObservation> & Record<string, unknown>,
): VerificationFailureRecord {
  return {
    failure_id: `failure_${result.verification_id}_${result.failed_stage}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    observation_id: result.observation_id,
    source_id: result.source_id,
    market_id: result.market_id,
    failed_stage: result.failed_stage ?? "STORE_AUTHORIZATION",
    failure_reason: result.failure_reason ?? "VERIFICATION_FAILED",
    raw_payload_reference: observation.raw_values && typeof observation.raw_values === "object" ? "raw_values.raw_payload" : "raw_payload_missing",
    timestamp: result.timestamp,
    version: result.version,
  };
}

export function createObservationVerificationEngine(input: {
  sourceRegistry: SourceRegistryStore;
  version?: string;
}): ObservationVerificationEngine {
  const version = input.version ?? "1.5";
  const duplicateController = createDuplicateController();
  const failures: VerificationFailureRecord[] = [];
  const events: VerificationEvent[] = [];

  function recordEvent(event: VerificationEvent) {
    events.push(event);
    return event;
  }

  function fail(
    observation: Partial<MarketObservation> & Record<string, unknown>,
    stageResult: StageVerificationResult,
    eventType: VerificationEvent["event_type"],
  ) {
    const result = createResult({
      observation,
      status: "BLOCKED",
      version,
      failedStage: stageResult.failed_stage,
      failureReason: stageResult.failure_reason,
    });
    const failureRecord = failureRecordFromResult(result, observation);
    failures.push({ ...failureRecord });
    recordEvent(createVerificationEvent({
      verification_id: result.verification_id,
      observation_id: result.observation_id,
      event_type: eventType,
      severity: "WARN",
      reason: result.failure_reason ?? "Verification failed.",
      version,
      timestamp: result.timestamp,
    }));
    recordEvent(createVerificationEvent({
      verification_id: result.verification_id,
      observation_id: result.observation_id,
      event_type: "VERIFICATION_FAILURE_RECORDED",
      severity: "WARN",
      reason: failureRecord.failure_reason,
      version,
      timestamp: result.timestamp,
    }));
    recordEvent(createVerificationEvent({
      verification_id: result.verification_id,
      observation_id: result.observation_id,
      event_type: "OBSERVATION_BLOCKED",
      severity: "WARN",
      reason: result.failure_reason ?? "Observation blocked.",
      version,
      timestamp: result.timestamp,
    }));
    return { result, failureRecord, events: events.map((event) => ({ ...event })) };
  }

  return {
    verifyObservation({ observation, ownership }) {
      const startResult = createResult({ observation, status: "FAILED", version });
      recordEvent(createVerificationEvent({
        verification_id: startResult.verification_id,
        observation_id: startResult.observation_id,
        event_type: "VERIFICATION_STARTED",
        reason: "Verification started.",
        version,
        timestamp: startResult.timestamp,
      }));

      const source = verifySourceRegistration(input.sourceRegistry, observation.source_id);
      if (source.status === "FAILED") return fail(observation, source, "SOURCE_VERIFICATION_FAILED");
      recordEvent(createVerificationEvent({ verification_id: startResult.verification_id, observation_id: startResult.observation_id, event_type: "SOURCE_VERIFIED", reason: "Source valid.", version, timestamp: startResult.timestamp }));

      const schema = verifyMarketSchema(observation);
      if (schema.status === "FAILED") return fail(observation, schema, "SCHEMA_VERIFICATION_FAILED");
      recordEvent(createVerificationEvent({ verification_id: startResult.verification_id, observation_id: startResult.observation_id, event_type: "SCHEMA_VERIFIED", reason: "Schema valid.", version, timestamp: startResult.timestamp }));

      const timestamp = verifyObservationTimestamps(observation);
      if (timestamp.status === "FAILED") return fail(observation, timestamp, "TIMESTAMP_VERIFICATION_FAILED");
      recordEvent(createVerificationEvent({ verification_id: startResult.verification_id, observation_id: startResult.observation_id, event_type: "TIMESTAMP_VERIFIED", reason: "Timestamp valid.", version, timestamp: startResult.timestamp }));

      const ownershipResult = verifyObservationOwnership(observation, ownership);
      if (ownershipResult.status === "FAILED") return fail(observation, ownershipResult, "OWNERSHIP_VERIFICATION_FAILED");
      recordEvent(createVerificationEvent({ verification_id: startResult.verification_id, observation_id: startResult.observation_id, event_type: "OWNERSHIP_VERIFIED", reason: "Ownership valid.", version, timestamp: startResult.timestamp }));

      const required = verifyRequiredFields(observation);
      if (required.status === "FAILED") return fail(observation, required, "SCHEMA_VERIFICATION_FAILED");

      const duplicate = duplicateController.check(observation);
      if (duplicate.status === "FAILED") return fail(observation, duplicate, "DUPLICATE_DETECTED");
      duplicateController.record(observation);

      const result = createResult({ observation, status: "VERIFIED", version });
      recordEvent(createVerificationEvent({ verification_id: result.verification_id, observation_id: result.observation_id, event_type: "OBSERVATION_VERIFIED", reason: "Observation verified.", version, timestamp: result.timestamp }));
      recordEvent(createVerificationEvent({ verification_id: result.verification_id, observation_id: result.observation_id, event_type: "STORE_AUTHORIZATION_GRANTED", reason: "Verified observation may append to raw store.", version, timestamp: result.timestamp }));
      return { result, events: events.map((event) => ({ ...event })) };
    },
    authorizeForStore(result) {
      return authorizeVerifiedObservationForStore(result);
    },
    listFailures() {
      return failures.map((failure) => ({ ...failure }));
    },
    listEvents() {
      return events.map((event) => ({ ...event }));
    },
  };
}
