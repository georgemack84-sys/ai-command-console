import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { BlockedSimulationOperation, SimulationFailure, SimulationRisk, SimulationWarning } from "./simulation-types";
import { createSimulationFailure } from "./simulation-errors";

export function buildGovernanceSimulationBridge(
  executionTruthPackage: ExecutionTruthPackage,
  executionCompatibilityContract: ExecutionCompatibilityContract,
): {
  blockedOperations: readonly BlockedSimulationOperation[];
  predictedRisks: readonly SimulationRisk[];
  failures: readonly SimulationFailure[];
  warnings: readonly SimulationWarning[];
} {
  const blockedOperations: BlockedSimulationOperation[] = [];
  const failures: SimulationFailure[] = [];
  const warnings: SimulationWarning[] = [];

  if (!executionTruthPackage.governanceEnvelope.allowed || !executionCompatibilityContract.compatible) {
    const reasons = [
      ...executionTruthPackage.governanceEnvelope.blockedReasons,
      ...executionCompatibilityContract.violations
        .filter((violation) => violation.severity === "BLOCKING")
        .map((violation) => violation.message),
    ];

    failures.push(createSimulationFailure(
      "SIMULATION_GOVERNANCE_BLOCK",
      reasons.join(" ") || "Simulation blocked by upstream governance posture.",
      "governanceEnvelope",
    ));
    blockedOperations.push({
      stepId: executionCompatibilityContract.compatibilitySnapshot.planId,
      toolId: "governance",
      category: "governance-block",
      reason: reasons.join(" ") || "Upstream governance blocked this plan.",
    });
  }

  const predictedRisks: SimulationRisk[] = executionTruthPackage.riskProfile.stepSignals.map((signal) => ({
    stepId: signal.stepId,
    level: executionTruthPackage.riskProfile.overallRisk,
    reasons: executionTruthPackage.riskProfile.reasons,
    source: "execution-truth",
  }));

  if (executionTruthPackage.governanceEnvelope.requiredApprovals.length > 0) {
    warnings.push({
      code: "SIMULATION_GOVERNANCE_WARNING",
      message: `Simulation surfaced required approvals: ${executionTruthPackage.governanceEnvelope.requiredApprovals.join(", ")}.`,
    });
  }

  return {
    blockedOperations,
    predictedRisks,
    failures,
    warnings,
  };
}
