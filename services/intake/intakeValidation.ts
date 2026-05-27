import type { NormalizedIntentEnvelope } from "@/types/intent/NormalizedIntentEnvelope";
import type { IntakeFailureType } from "@/types/intent/IntakeFailureType";
import { isAllowedIntakeSource } from "./intakePolicies";

function isSafeMetadataValue(value: unknown) {
  return value === undefined || typeof value === "string";
}

export function validateNormalizedIntentEnvelope(input: {
  source: string;
  receivedAt: number;
  rawInput: unknown;
  normalizedInput: NormalizedIntentEnvelope["normalizedInput"];
  metadata: NormalizedIntentEnvelope["metadata"];
}): { valid: boolean; failureType?: IntakeFailureType; reasons: string[] } {
  const reasons: string[] = [];

  if (!isAllowedIntakeSource(input.source)) {
    reasons.push("invalid_source");
  }
  if (!Number.isFinite(input.receivedAt)) {
    reasons.push("invalid_received_at");
  }
  if (input.rawInput === undefined) {
    reasons.push("raw_input_missing");
  }
  if (!input.normalizedInput.text && !input.normalizedInput.structuredPayload) {
    reasons.push("normalized_input_empty");
  }
  if (!isSafeMetadataValue(input.metadata.sessionId)
    || !isSafeMetadataValue(input.metadata.userId)
    || !isSafeMetadataValue(input.metadata.correlationId)
    || !isSafeMetadataValue(input.metadata.parentRequestId)) {
    reasons.push("metadata_invalid");
  }

  return {
    valid: reasons.length === 0,
    failureType: reasons.length === 0 ? undefined : "VALIDATION_FAILURE",
    reasons,
  };
}
