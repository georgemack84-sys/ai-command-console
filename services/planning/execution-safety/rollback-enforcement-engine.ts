import type { ExecutionTruthPackage } from "../execution-truth";
import { buildAutonomyEnvelope } from "./autonomy-boundary-enforcer";
import { enforceGovernanceSafety } from "./governance-enforcement-engine";
import { validateRollbackCapability } from "./rollback-capability-registry";
import { validateRollbackGovernanceInheritance } from "./rollback-governance-inheritance";
import type { RollbackInvariant, RollbackSafetyContract } from "./execution-safety-types";

export function enforceRollbackSafety(executionTruthPackage: ExecutionTruthPackage): RollbackSafetyContract {
  const signals = executionTruthPackage.riskProfile.stepSignals;
  const required = signals.some((signal) => signal.destructive || signal.externalSideEffect);
  const rollbackCapability = signals.reduce<RollbackSafetyContract["rollbackCapability"]>((current, signal) => {
    if (signal.rollbackCapability === "none" || signal.rollbackCapability === "unknown") {
      return signal.rollbackCapability;
    }
    if (current === "full" && signal.rollbackCapability === "partial") {
      return "partial";
    }
    return current;
  }, "full");

  const fallbackInvariant: RollbackInvariant = {
    code: "ROLLBACK_CAPABILITY_REQUIRED",
    satisfied: !required || validateRollbackCapability(rollbackCapability) && rollbackCapability !== "none" && rollbackCapability !== "unknown",
    reason: "Destructive or side-effecting plans require deterministic rollback capability.",
  };

  const forwardGovernance = enforceGovernanceSafety(executionTruthPackage);
  const rollbackGovernance = {
    ...forwardGovernance,
    requiredApprovals: [...forwardGovernance.requiredApprovals],
  };
  const forwardAutonomy = buildAutonomyEnvelope(executionTruthPackage);
  const rollbackAutonomy = {
    ...forwardAutonomy,
    maxAutonomyLevel: forwardAutonomy.maxAutonomyLevel === "bounded_autonomous"
      ? "supervised"
      : forwardAutonomy.maxAutonomyLevel,
  };
  const inheritance = validateRollbackGovernanceInheritance(
    forwardGovernance,
    rollbackGovernance,
    forwardAutonomy,
    rollbackAutonomy,
  );

  return {
    required,
    rollbackCapability,
    invariants: [fallbackInvariant, ...inheritance.invariants],
    governanceInherited: inheritance.governanceInherited,
  };
}
