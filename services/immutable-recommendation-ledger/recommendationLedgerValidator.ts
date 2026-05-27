import { serializeRecommendationLedgerEvent } from "./recommendationLedgerSerializationEngine";
import { validateLedgerTimestamp } from "./recommendationLedgerTimestampAuthority";
import type {
  ImmutableRecommendationLedgerError,
  RecommendationLedgerEvent,
  RecommendationLedgerValidationRecord,
} from "./types/immutableRecommendationLedgerTypes";
import { hashReplayValue } from "@/services/recommendation-replay/replayHashEngine";

export function validateRecommendationLedgerEvent(event: RecommendationLedgerEvent): ImmutableRecommendationLedgerError[] {
  const errors: ImmutableRecommendationLedgerError[] = [];
  errors.push(...validateLedgerTimestamp(event.timestamp, `event.${event.ledgerEventId}.timestamp`));

  const first = serializeRecommendationLedgerEvent(event);
  const second = serializeRecommendationLedgerEvent(event);
  if (first !== second) {
    errors.push({
      code: "LEDGER_SERIALIZATION_DRIFT",
      message: "Ledger event serialization is not deterministic.",
      path: `event.${event.ledgerEventId}.serialization`,
    });
  }

  if (event.metadata.appendOnly !== true || event.metadata.replayCompatible !== true || event.metadata.deterministic !== true || event.metadata.executable !== false) {
    errors.push({
      code: "LEDGER_MUTATION_DETECTED",
      message: "Ledger metadata violates immutable replay-safe invariants.",
      path: `event.${event.ledgerEventId}.metadata`,
    });
  }

  return errors;
}

export function buildRecommendationLedgerValidationRecord(input: {
  replayValidated: boolean;
  deterministicReplayVerified: boolean;
  antiEmergenceValidated: boolean;
  failClosedChecksPassed: boolean;
}): RecommendationLedgerValidationRecord {
  return Object.freeze({
    replayValidated: input.replayValidated,
    deterministicReplayVerified: input.deterministicReplayVerified,
    antiEmergenceValidated: input.antiEmergenceValidated,
    failClosedChecksPassed: input.failClosedChecksPassed,
    validationHash: hashReplayValue("immutable-recommendation-ledger-validation", input),
  });
}
