import type { DeterministicRiskProfile } from "./execution-truth-types";
import { mapScoreToRiskLevel } from "./deterministic-risk-scorer";

export function analyzeRollbackExposure(riskProfile: DeterministicRiskProfile): DeterministicRiskProfile {
  const extraReasons: string[] = [];
  const scores = riskProfile.scores.map((score) => ({ ...score, reasons: [...score.reasons] }));
  const rollbackScore = scores.find((score) => score.category === "rollback_risk");

  for (const signal of riskProfile.stepSignals) {
    if (signal.rollbackBranch && signal.rollbackCapability !== "full") {
      if (rollbackScore) {
        rollbackScore.score += 10;
        rollbackScore.level = mapScoreToRiskLevel(rollbackScore.score);
        rollbackScore.reasons.push(`${signal.stepId}: rollback branch has incomplete recovery coverage`);
      }
      extraReasons.push(`${signal.stepId}: rollback exposure increased due to incomplete rollback coverage`);
    }
  }

  const ordered: DeterministicRiskProfile["overallRisk"][] = ["R0_SAFE", "R1_LOW", "R2_MODERATE", "R3_ELEVATED", "R4_HIGH", "R5_CRITICAL", "R6_FORBIDDEN"];
  const overallRisk = scores.reduce<DeterministicRiskProfile["overallRisk"]>((current, score) =>
    ordered.indexOf(score.level) > ordered.indexOf(current) ? score.level : current, riskProfile.overallRisk);

  return {
    ...riskProfile,
    overallRisk,
    scores,
    reasons: [...riskProfile.reasons, ...extraReasons],
  };
}
