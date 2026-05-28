import type { DriftRecord, ProposalConfidenceState } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function analyzeTelemetryDrift(input: {
  proposalId: string;
  confidenceScore: number;
  createdAt: string;
}): Readonly<{
  confidenceState: ProposalConfidenceState;
  drifts: readonly DriftRecord[];
}> {
  const confidenceState =
    input.confidenceScore >= 0.8 ? "stable"
    : input.confidenceScore >= 0.5 ? "degrading"
    : input.confidenceScore > 0 ? "unstable"
    : "invalid";

  const drift = confidenceState === "stable"
    ? []
    : [Object.freeze({
      driftId: hashFreshnessValue("telemetry-drift-id", input),
      driftType: "telemetry" as const,
      severity:
        confidenceState === "degrading" ? "moderate" as const
        : confidenceState === "unstable" ? "high" as const
        : "critical" as const,
      detectedAt: input.createdAt,
      affectedProposalIds: Object.freeze([input.proposalId]),
      requiresEscalation: confidenceState !== "degrading",
      freezeRequired: confidenceState === "invalid",
      replaySafe: true,
    })];

  return Object.freeze({
    confidenceState,
    drifts: Object.freeze(drift),
  });
}
