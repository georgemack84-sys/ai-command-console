import type { ExecutionTruthPackage } from "../execution-truth";
import type { ExecutionEscalationLevel, RollbackSafetyContract } from "./execution-safety-types";

export function determineExecutionEscalationLevel(
  executionTruthPackage: ExecutionTruthPackage,
  rollbackSafety: RollbackSafetyContract,
): ExecutionEscalationLevel {
  if (executionTruthPackage.riskProfile.overallRisk === "R6_FORBIDDEN") {
    return "CRITICAL";
  }
  if (executionTruthPackage.riskProfile.overallRisk === "R5_CRITICAL" || rollbackSafety.rollbackCapability === "none") {
    return "HIGH";
  }
  if (executionTruthPackage.riskProfile.overallRisk === "R4_HIGH" || rollbackSafety.rollbackCapability === "unknown") {
    return "MEDIUM";
  }
  if (executionTruthPackage.governanceEnvelope.escalationRequired) {
    return "LOW";
  }
  return "NONE";
}
