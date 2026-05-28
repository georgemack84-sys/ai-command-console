import type { DriftRecord, GovernanceCompatibilityState } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function monitorGovernanceDrift(input: {
  proposalId: string;
  proposalGovernanceHash: string;
  lifecycleGovernanceHash: string;
  createdAt: string;
}): Readonly<{
  compatibility: GovernanceCompatibilityState;
  drifts: readonly DriftRecord[];
}> {
  if (input.proposalGovernanceHash === input.lifecycleGovernanceHash) {
    return Object.freeze({
      compatibility: "compatible",
      drifts: Object.freeze([]),
    });
  }

  const drift: DriftRecord = Object.freeze({
    driftId: hashFreshnessValue("governance-drift-id", input),
    driftType: "governance",
    severity: "high",
    detectedAt: input.createdAt,
    affectedProposalIds: Object.freeze([input.proposalId]),
    requiresEscalation: true,
    freezeRequired: false,
    replaySafe: true,
  });

  return Object.freeze({
    compatibility: "review_required",
    drifts: Object.freeze([drift]),
  });
}
