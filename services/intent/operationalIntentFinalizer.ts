import { hashEvidence } from "@/services/audit/evidenceHashing";
import { OPERATIONAL_INTENT_RESOLUTION_VERSION } from "@/types/operationalIntent";

export function finalizeOperationalIntent(input: {
  intentId: string;
  originalInput: string;
  normalizedIntent: {
    action: string;
    target: string;
    parameters: Record<string, unknown>;
  };
  plannerAdmissible: boolean;
  createdAt: number;
}) {
  const finalized = input.plannerAdmissible;
  return {
    finalized,
    operationalIntentHash: hashEvidence({
      intentId: input.intentId,
      originalInput: input.originalInput,
      normalizedIntent: input.normalizedIntent,
      resolutionVersion: OPERATIONAL_INTENT_RESOLUTION_VERSION,
    }),
    finalizedAt: input.createdAt,
  };
}
