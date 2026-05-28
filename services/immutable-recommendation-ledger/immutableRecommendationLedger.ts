import { appendImmutableLedgerEntry, verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";
import { validateAppendOnlyLedger } from "./recommendationLedgerAppendOnlyGuard";
import { validateRecommendationLedgerAntiEmergence } from "./recommendationLedgerAntiEmergenceValidator";
import { canonicalizeRecommendationLedgerToString } from "./recommendationLedgerCanonicalizer";
import { buildRecommendationLedgerFreezeRecord } from "./recommendationLedgerFailClosedGuard";
import { validateLedgerGovernanceCorrelation } from "./recommendationLedgerGovernanceLinker";
import { hashRecommendationLedgerEvent } from "./recommendationLedgerHashLinker";
import { orderLedgerEventsDeterministically } from "./recommendationLedgerOrderingEngine";
import { deriveEvidenceBundleId, deriveLedgerEventsFromReplay } from "./recommendationLedgerReplayAdapter";
import { serializeRecommendationLedgerEvent } from "./recommendationLedgerSerializationEngine";
import { buildRecommendationLedgerValidationRecord, validateRecommendationLedgerEvent } from "./recommendationLedgerValidator";
import { appendRecommendationLedgerEvents } from "./recommendationLedgerWriter";
import { validateLedgerTimestamp } from "./recommendationLedgerTimestampAuthority";
import type {
  ImmutableRecommendationLedgerAuditEntry,
  ImmutableRecommendationLedgerError,
  ImmutableRecommendationLedgerInput,
  ImmutableRecommendationLedgerResult,
  RecommendationLedgerAuditRecord,
  RecommendationLedgerEvent,
  RecommendationLedgerStageRecord,
} from "./types/immutableRecommendationLedgerTypes";

function buildStages(errors: readonly ImmutableRecommendationLedgerError[]): readonly RecommendationLedgerStageRecord[] {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze([
    "replay_validation",
    "anti_emergence_validation",
    "deterministic_serialization",
    "hash_generation",
    "append_only_validation",
    "ledger_append",
  ].map((stage) => Object.freeze({
    stage,
    passed: errors.length === 0,
    reasons,
    deterministicHash: hashReplayValue("immutable-recommendation-ledger-stage", { stage, reasons }),
  })));
}

function buildAuditRecord(input: {
  ledgerRunId: string;
  recommendationId: string;
  eventType: RecommendationLedgerAuditRecord["eventType"];
  eventHash: string;
  timestamp: string;
  previousEntryHash?: string;
}): RecommendationLedgerAuditRecord {
  const entryHash = hashReplayValue("immutable-recommendation-ledger-audit", {
    ledgerRunId: input.ledgerRunId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    eventHash: input.eventHash,
    timestamp: input.timestamp,
    previousEntryHash: input.previousEntryHash ?? null,
  });
  return Object.freeze({
    auditId: `${input.ledgerRunId}:${input.eventType}`,
    ledgerRunId: input.ledgerRunId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    eventHash: input.eventHash,
    timestamp: input.timestamp,
    previousEntryHash: input.previousEntryHash,
    entryHash,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    operatorReviewRequired: true as const,
  });
}

function appendAuditRecord(
  existing: readonly ImmutableRecommendationLedgerAuditEntry[],
  record: RecommendationLedgerAuditRecord,
): readonly ImmutableRecommendationLedgerAuditEntry[] {
  const previousHash = existing.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(record),
    previousHash,
    scope: "immutable-recommendation-ledger",
  });
  return Object.freeze([...existing, entry]);
}

function validateInput(input: ImmutableRecommendationLedgerInput): ImmutableRecommendationLedgerError[] {
  const errors: ImmutableRecommendationLedgerError[] = [];
  if (!input.ledgerRunId) {
    errors.push({
      code: "LEDGER_REPLAY_INVALID",
      message: "Ledger run ID is required.",
      path: "ledgerRunId",
    });
  }
  if (input.replayResult.status !== "COMPLETED") {
    errors.push({
      code: input.replayResult.status === "FROZEN"
        ? "LEDGER_REPLAY_INVALID"
        : "LEDGER_REPLAY_INVALID",
      message: "Replay validation must complete successfully before ledger append.",
      path: "replayResult.status",
    });
  }
  if (!verifyImmutableLedgerChain([...(input.existingAuditLedger ?? [])])) {
    errors.push({
      code: "LEDGER_APPEND_ONLY_VIOLATION",
      message: "Existing immutable recommendation ledger audit chain is invalid.",
      path: "existingAuditLedger",
    });
  }
  errors.push(...validateLedgerTimestamp(input.ledgerTimestamp, "ledgerTimestamp"));

  const metadataHaystack = JSON.stringify({
    metadata: input.metadata,
    replayMetadata: input.replayInput.metadata,
    prioritizationMetadata: input.replayInput.recommendationPrioritizationInput.metadata,
  }).toLowerCase();
  if (
    metadataHaystack.includes("executionintent")
    || metadataHaystack.includes("dispatchmetadata")
    || metadataHaystack.includes("schedulermetadata")
    || metadataHaystack.includes("orchestrationhints")
    || metadataHaystack.includes("authorityexpansion")
    || metadataHaystack.includes("runtimemutationinstructions")
  ) {
    errors.push({
      code: "LEDGER_REPLAY_INVALID",
      message: "Ledger input metadata contains forbidden execution or orchestration semantics.",
      path: "metadata",
    });
  }
  return errors;
}

function buildLedgerEvents(input: ImmutableRecommendationLedgerInput): readonly RecommendationLedgerEvent[] {
  const replayEpisode = input.replayResult.episodes[0]!;
  const baseGovernanceSnapshotId = replayEpisode.governanceReplay.governanceSnapshotId;
  const baseReplaySnapshotId = input.replayInput.recommendationPrioritizationInput.inputs[0]?.replaySnapshotId
    ?? input.replayInput.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId;
  const evidenceBundleId = deriveEvidenceBundleId(input.replayInput);
  const sourceEvents = deriveLedgerEventsFromReplay({
    replayInput: input.replayInput,
    replayResult: input.replayResult,
  });

  const synthesized = sourceEvents.map((source, index) => {
    const canonicalPayload = canonicalizeRecommendationLedgerToString(source.payload);
    const serializationHash = hashReplayValue("immutable-recommendation-ledger-serialization", canonicalPayload);
    const lineageHash = hashReplayValue("immutable-recommendation-ledger-lineage", {
      recommendationId: input.replayInput.recommendationId,
      eventType: source.eventType,
      parentLineageHash: source.parentLineageHash ?? null,
      payload: source.payload,
    });
    const recommendationHash = hashRecommendationLedgerEvent({
      eventType: source.eventType,
      recommendationId: input.replayInput.recommendationId,
      timestamp: source.timestamp,
      sequenceNumber: index + 1,
      governanceSnapshotId: baseGovernanceSnapshotId,
      replaySnapshotId: baseReplaySnapshotId,
      evidenceBundleId,
      canonicalPayload,
    });

    const event: RecommendationLedgerEvent = {
      ledgerEventId: `${input.ledgerRunId}:${source.eventType}:${index + 1}`,
      recommendationId: input.replayInput.recommendationId,
      eventType: source.eventType,
      eventVersion: "5.1G-v1",
      timestamp: source.timestamp,
      sequenceNumber: index + 1,
      lineageHash,
      parentLineageHash: source.parentLineageHash,
      governanceSnapshotId: baseGovernanceSnapshotId,
      replaySnapshotId: baseReplaySnapshotId,
      evidenceBundleId,
      recommendationHash,
      serializationHash,
      actorType: source.actorType,
      payload: source.payload,
      metadata: {
        deterministic: true,
        appendOnly: true,
        replayCompatible: true,
        executable: false,
      },
    };

    const deterministicSerialization = serializeRecommendationLedgerEvent(event);
    if (hashReplayValue("immutable-recommendation-ledger-serialization-stability", deterministicSerialization) !== serializationHash) {
      return {
        ...event,
        serializationHash: hashReplayValue("immutable-recommendation-ledger-serialization-stability", deterministicSerialization),
      };
    }

    return event;
  });

  return Object.freeze(orderLedgerEventsDeterministically(synthesized));
}

export function buildImmutableRecommendationLedger(
  input: ImmutableRecommendationLedgerInput,
): ImmutableRecommendationLedgerResult {
  const errors: ImmutableRecommendationLedgerError[] = [...validateInput(input)];

  const validation = buildRecommendationLedgerValidationRecord({
    replayValidated: input.replayResult.status === "COMPLETED",
    deterministicReplayVerified: input.replayResult.validationRecords.every((record) => record.deterministicReplayVerified),
    antiEmergenceValidated: input.replayResult.errors.every((error) =>
      error.code !== "RECOMMENDATION_REPLAY_HIDDEN_EXECUTION"
      && error.code !== "RECOMMENDATION_REPLAY_ANTI_EMERGENCE",
    ),
    failClosedChecksPassed: !input.replayResult.freeze.frozen,
  });

  if (!validation.replayValidated || !validation.deterministicReplayVerified || !validation.antiEmergenceValidated || !validation.failClosedChecksPassed) {
    errors.push({
      code: "LEDGER_REPLAY_INVALID",
      message: "Replay validation must succeed before immutable ledger append.",
      path: "validation",
    });
  }

  const replayEpisode = input.replayResult.episodes[0];
  const expectedGovernanceSnapshotId = input.replayInput.recommendationPrioritizationInput.inputs[0]?.governanceSnapshotId
    ?? input.replayInput.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId;
  if (replayEpisode && replayEpisode.governanceReplay.governanceSnapshotId !== expectedGovernanceSnapshotId) {
    errors.push({
      code: "LEDGER_GOVERNANCE_CORRELATION_FAILURE",
      message: "Replay episode governance snapshot diverges from the original bound governance snapshot.",
      path: "replayResult.episodes[0].governanceReplay.governanceSnapshotId",
    });
  }

  const candidateEvents = buildLedgerEvents(input);

  for (const event of candidateEvents) {
    errors.push(
      ...validateRecommendationLedgerEvent(event),
      ...validateRecommendationLedgerAntiEmergence(event),
      ...validateLedgerGovernanceCorrelation({
        event,
        expectedGovernanceSnapshotId: input.replayResult.episodes[0]!.governanceReplay.governanceSnapshotId,
        expectedReplaySnapshotId: input.replayInput.recommendationPrioritizationInput.inputs[0]?.replaySnapshotId
          ?? input.replayInput.recommendationSynthesisInput.deterministicReplayResult.snapshot.snapshotId,
      }),
    );
  }

  errors.push(...validateAppendOnlyLedger({
    existingEvents: input.existingEvents ?? [],
    nextEvents: candidateEvents,
  }));

  const finalEvents = errors.length === 0
    ? appendRecommendationLedgerEvents({
        existingEvents: input.existingEvents ?? [],
        nextEvents: candidateEvents,
      })
    : Object.freeze([...(input.existingEvents ?? [])]);

  const freeze = buildRecommendationLedgerFreezeRecord(errors);
  const status = freeze.failedClosed ? "FAILED_CLOSED" : freeze.frozen ? "FROZEN" : "COMPLETED";

  const telemetry = Object.freeze({
    appendOnlyViolationCount: errors.filter((error) => error.code === "LEDGER_APPEND_ONLY_VIOLATION").length,
    replayDriftCount: errors.filter((error) => error.code === "LEDGER_REPLAY_INVALID").length,
    serializationDriftCount: errors.filter((error) => error.code === "LEDGER_SERIALIZATION_DRIFT").length,
    hashMismatchCount: errors.filter((error) => error.code === "LEDGER_HASH_MISMATCH").length,
    lineageGapCount: errors.filter((error) => error.code === "LEDGER_LINEAGE_GAP_DETECTED").length,
    governanceMismatchCount: errors.filter((error) => error.code === "LEDGER_GOVERNANCE_CORRELATION_FAILURE").length,
    antiEmergenceViolationCount: errors.filter((error) => error.code === "LEDGER_REPLAY_INVALID").length,
    orderingCorruptionCount: errors.filter((error) => error.code === "LEDGER_SEQUENCE_CORRUPTION").length,
    telemetryHash: hashReplayValue("immutable-recommendation-ledger-telemetry", errors.map((error) => error.code)),
  });

  const auditRecord = buildAuditRecord({
    ledgerRunId: input.ledgerRunId,
    recommendationId: input.replayInput.recommendationId,
    eventType: status === "FAILED_CLOSED"
      ? "LEDGER_APPEND_FAILED_CLOSED"
      : status === "FROZEN"
        ? "LEDGER_APPEND_FROZEN"
        : "LEDGER_APPEND_COMPLETED",
    eventHash: hashReplayValue("immutable-recommendation-ledger-event-set", candidateEvents.map((event) => event.recommendationHash)),
    timestamp: input.ledgerTimestamp,
  });
  const auditLedger = appendAuditRecord(input.existingAuditLedger ?? [], auditRecord);

  return Object.freeze({
    status,
    events: finalEvents,
    validation,
    telemetry,
    auditRecords: Object.freeze([auditRecord]),
    auditLedger,
    freeze,
    stages: buildStages(errors),
    errors: Object.freeze(errors),
    warnings: Object.freeze(
      freeze.frozen
        ? ["Immutable recommendation ledger froze or failed closed under replay, governance, or append-only uncertainty."]
        : ["Immutable recommendation ledger appended replay-validated historical events only."],
    ),
    deterministicHash: hashReplayValue("immutable-recommendation-ledger-result", {
      eventHashes: finalEvents.map((event) => event.recommendationHash),
      validationHash: validation.validationHash,
      telemetryHash: telemetry.telemetryHash,
      auditHash: auditRecord.entryHash,
      freezeHash: freeze.freezeHash,
    }),
    derivedOnly: true as const,
  });
}

export const ImmutableRecommendationLedger = buildImmutableRecommendationLedger;
