import type { DriftRecord } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function evaluateEnvironmentDrift(input: {
  proposalId: string;
  expectedEnvironmentHash: string;
  observedEnvironmentHash?: string;
  createdAt: string;
}): readonly DriftRecord[] {
  if (!input.observedEnvironmentHash || input.observedEnvironmentHash === input.expectedEnvironmentHash) {
    return Object.freeze([]);
  }

  return Object.freeze([
    Object.freeze({
      driftId: hashFreshnessValue("environment-drift-id", input),
      driftType: "environment" as const,
      severity: "moderate" as const,
      detectedAt: input.createdAt,
      affectedProposalIds: Object.freeze([input.proposalId]),
      requiresEscalation: true,
      freezeRequired: false,
      replaySafe: true,
    }),
  ]);
}
