import type { NormalizePlanInput, NormalizationEvidence, NormalizationEvent } from "../normalization-types";
import { appendNormalizationAuditLog } from "./normalization-audit-log";
import { createNormalizationEvidencePayload, createNormalizationRunId, orderNormalizationEvents } from "../normalize-evidence";

export function createNormalizationEvidence(input: {
  normalizedPlan: {
    planId: string;
    schemaVersion: string;
  };
  normalizationVersion: string;
  orderedEvents: NormalizationEvent[];
  hashes: {
    graphHash: string;
    validationHash: string;
    normalizationHash: string;
    replayHash: string;
  };
  normalizeInput: NormalizePlanInput;
}): NormalizationEvidence {
  const payload = createNormalizationEvidencePayload({
    validationRunId: createNormalizationRunId({
      planId: input.normalizedPlan.planId,
      graphHash: input.hashes.graphHash,
      validationHash: input.hashes.validationHash,
      normalizationVersion: input.normalizationVersion,
    }),
    schemaVersion: input.normalizedPlan.schemaVersion,
    normalizationVersion: input.normalizationVersion,
    graphHash: input.hashes.graphHash,
    validationHash: input.hashes.validationHash,
    normalizationHash: input.hashes.normalizationHash,
    replayHash: input.hashes.replayHash,
    orderedEvents: orderNormalizationEvents(input.orderedEvents),
    replaySnapshot: input.normalizeInput.replaySnapshot,
    sourceValidationMetadata: input.normalizeInput.validationResult.evidence,
  });

  const audit = appendNormalizationAuditLog(payload);

  return {
    ...payload,
    immutableAuditLedgerId: audit.ledgerId,
  };
}

