import type { ReplayConfidence, ReplayDivergence } from "../contracts/replay/replayTypes";

export function computeReplayConfidence({
  deterministic,
  missingEvidence = [],
  divergences = [],
  continuityRiskScore = 0,
  staleLeaseDetected = false,
  verifiedEvidence = [],
}: {
  deterministic: boolean;
  missingEvidence?: string[];
  divergences?: Array<Pick<ReplayDivergence, "category" | "severity" | "requiresEscalation">>;
  continuityRiskScore?: number;
  staleLeaseDetected?: boolean;
  verifiedEvidence?: string[];
}): ReplayConfidence {
  const warnings: string[] = [];
  let score = 100;

  if (!deterministic) {
    score -= 30;
    warnings.push("replay:non_deterministic");
  }
  score -= Math.min(40, missingEvidence.length * 15);
  score -= Math.min(40, divergences.length * 18);
  score -= Math.min(25, Math.round(continuityRiskScore * 0.2));
  if (staleLeaseDetected) {
    score -= 10;
    warnings.push("lease:stale");
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const confidenceLevel =
    normalizedScore >= 90 ? "VERIFIED"
      : normalizedScore >= 75 ? "STABLE"
        : normalizedScore >= 55 ? "MONITORED"
          : normalizedScore >= 35 ? "DEGRADED"
            : normalizedScore >= 20 ? "DISPUTED"
              : "UNTRUSTED";

  return {
    score: normalizedScore,
    deterministic,
    confidenceLevel,
    riskFactors: [
      ...missingEvidence,
      ...divergences.map((divergence) => divergence.category),
    ],
    verifiedEvidence: [...verifiedEvidence],
    warnings,
  };
}
