import type { DeterministicRiskProfile } from "./execution-truth-types";
import type { SequentialDependencyValidationResult } from "../dependencies";
import { mapScoreToRiskLevel } from "./deterministic-risk-scorer";

export function propagateTopologyRisk(
  riskProfile: DeterministicRiskProfile,
  dependencyValidation: SequentialDependencyValidationResult,
): DeterministicRiskProfile {
  if (!dependencyValidation.graph) {
    return {
      ...riskProfile,
      failClosed: true,
      overallRisk: "R6_FORBIDDEN",
      reasons: [...riskProfile.reasons, "Dependency graph missing during topology-aware risk propagation."],
    };
  }

  const highRiskSteps = new Set(
    riskProfile.stepSignals
      .filter((signal) => signal.destructive || signal.externalSideEffect || signal.targetEnvironment === "production")
      .map((signal) => signal.stepId),
  );

  const addedReasons: string[] = [];
  const propagatedScores = riskProfile.scores.map((score) => ({ ...score, reasons: [...score.reasons] }));

  for (const edge of dependencyValidation.graph.edges) {
    if (highRiskSteps.has(edge.from) && edge.edgeType === "depends_on") {
      const dependencyScore = propagatedScores.find((entry) => entry.category === "dependency_risk");
      if (dependencyScore) {
        dependencyScore.score += 10;
        dependencyScore.level = mapScoreToRiskLevel(dependencyScore.score);
        dependencyScore.reasons.push(`${edge.to}: inherited upstream high-risk awareness from ${edge.from}`);
      } else {
        propagatedScores.push({
          category: "dependency_risk",
          score: 10,
          level: "R1_LOW",
          reasons: [`${edge.to}: inherited upstream high-risk awareness from ${edge.from}`],
        });
      }
      addedReasons.push(`${edge.to}: upstream risk propagated from ${edge.from}`);
    }
  }

  const levels: Array<DeterministicRiskProfile["overallRisk"]> = propagatedScores.map((score) => score.level);
  const ordered: DeterministicRiskProfile["overallRisk"][] = ["R0_SAFE", "R1_LOW", "R2_MODERATE", "R3_ELEVATED", "R4_HIGH", "R5_CRITICAL", "R6_FORBIDDEN"];
  const overallRisk = levels.reduce<DeterministicRiskProfile["overallRisk"]>((current, level) =>
    ordered.indexOf(level) > ordered.indexOf(current) ? level : current, riskProfile.overallRisk);

  return {
    ...riskProfile,
    overallRisk,
    scores: propagatedScores,
    reasons: [...riskProfile.reasons, ...addedReasons],
  };
}
