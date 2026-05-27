import type { ExecutionTruthPackage } from "../execution-truth";
import type { ApprovalSafetyRequirement } from "./execution-safety-types";

export function enforceApprovalSafety(executionTruthPackage: ExecutionTruthPackage): ApprovalSafetyRequirement[] {
  const requirements = executionTruthPackage.governanceEnvelope.requiredApprovals.map((approval) => ({
    required: true,
    approvalTypes: [approval],
    reason: `Approval required for ${approval}.`,
  }));

  if (requirements.length === 0 && executionTruthPackage.riskProfile.overallRisk === "R4_HIGH") {
    requirements.push({
      required: true,
      approvalTypes: ["high_risk"],
      reason: "High-risk plans require explicit approval.",
    });
  }

  return requirements;
}
