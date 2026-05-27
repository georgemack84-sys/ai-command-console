import type { ReadinessDomainScore, ReadinessError, ReadinessRiskProfile } from "@/types/constitutional-readiness";
import { hashReadinessValue } from "./readinessHashEngine";

export function buildConstitutionalRiskProfile(input: {
  readinessId: string;
  scores: readonly ReadinessDomainScore[];
  errors: readonly ReadinessError[];
}): ReadinessRiskProfile {
  const aggregateScore = Number((input.scores.reduce((sum, item) => sum + item.score, 0) / input.scores.length).toFixed(4));
  const riskLevel = input.errors.some((item) =>
    item.code.includes("ISOLATION")
    || item.code.includes("BOUNDARY")
    || item.code.includes("PRIVILEGE")
    || item.code.includes("ANTI_EMERGENCE")
  )
    ? "critical"
    : aggregateScore >= 0.999
      ? "low"
      : aggregateScore >= 0.75
        ? "moderate"
        : aggregateScore >= 0.5
          ? "high"
          : "critical";

  return Object.freeze({
    riskId: hashReadinessValue("constitutional-readiness-risk-id", input.readinessId),
    readinessId: input.readinessId,
    riskLevel,
    aggregateScore,
    scores: Object.freeze([...input.scores]),
    deterministicHash: hashReadinessValue("constitutional-readiness-risk-profile", {
      readinessId: input.readinessId,
      riskLevel,
      aggregateScore,
      scores: input.scores,
      errors: input.errors.map((item) => item.code),
    }),
  });
}
