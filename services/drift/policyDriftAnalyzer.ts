import type { DriftRecord } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function analyzePolicyDrift(input: {
  proposalId: string;
  readinessPolicyView: readonly string[];
  createdAt: string;
}): readonly DriftRecord[] {
  const reviewRequired = input.readinessPolicyView.some((item) => /review|invalid|restricted/i.test(item));
  if (!reviewRequired) {
    return Object.freeze([]);
  }

  return Object.freeze([
    Object.freeze({
      driftId: hashFreshnessValue("policy-drift-id", input),
      driftType: "policy" as const,
      severity: "high" as const,
      detectedAt: input.createdAt,
      affectedProposalIds: Object.freeze([input.proposalId]),
      requiresEscalation: true,
      freezeRequired: false,
      replaySafe: true,
    }),
  ]);
}
