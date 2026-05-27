import type { ReadinessClassification, ReadinessRiskProfile } from "@/types/constitutional-readiness";

export function certifyReadinessState(input: {
  errors: readonly { code: string }[];
  inheritedFailClosed: boolean;
  replaySafe: boolean;
  governanceBound: boolean;
  risk: ReadinessRiskProfile;
}): ReadinessClassification {
  if (input.errors.some((item) =>
    item.code.includes("ISOLATION")
    || item.code.includes("PRIVILEGE")
    || item.code.includes("BOUNDARY")
    || item.code.includes("ANTI_EMERGENCE")
  )) {
    return "INVALID";
  }
  if (input.inheritedFailClosed || !input.governanceBound || !input.replaySafe) {
    return "FROZEN";
  }
  if (input.errors.some((item) =>
    item.code.includes("REPLAY")
    || item.code.includes("GOVERNANCE")
    || item.code.includes("APPROVAL")
  )) {
    return "DISPUTED";
  }
  if (input.risk.riskLevel === "critical" || input.risk.aggregateScore < 0.5) {
    return "DEGRADED";
  }
  if (input.errors.length > 0 || input.risk.riskLevel === "moderate" || input.risk.riskLevel === "high") {
    return "CONDITIONAL";
  }
  return "VERIFIED";
}
