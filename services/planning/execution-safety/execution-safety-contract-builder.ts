import { validateExecutionTruth } from "../execution-truth";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";
import { enforceApprovalSafety } from "./approval-enforcement-engine";
import { enforceAutonomyBoundary } from "./autonomy-boundary-enforcer";
import { determineExecutionEscalationLevel } from "./execution-escalation-engine";
import { determineExecutionFreezeReasons } from "./execution-freeze-engine";
import { enforceGovernanceSafety } from "./governance-enforcement-engine";
import { createExecutionSafetyViolation } from "./execution-safety-errors";
import { resolvePolicyLocks } from "./execution-policy-registry";
import { enforceRollbackSafety } from "./rollback-enforcement-engine";
import type { ExecutionSafetyBuildInput, ExecutionSafetyContract, ExecutionSafetyState, ExecutionSafetyViolation } from "./execution-safety-types";

function classifyState(contract: Omit<ExecutionSafetyContract, "executionSafetyHash">): ExecutionSafetyState {
  if (contract.freezeReasons.length > 0) {
    return "FROZEN";
  }
  if (contract.governance.blockedReasons.length > 0) {
    return "BLOCKED";
  }
  if (contract.rollback.required && (contract.rollback.rollbackCapability === "none" || contract.rollback.rollbackCapability === "unknown")) {
    return "ROLLBACK_REQUIRED";
  }
  if (contract.approvals.some((approval) => approval.required)) {
    return "APPROVAL_REQUIRED";
  }
  if (contract.autonomy.selfElevationBlocked) {
    return "RESTRICTED";
  }
  return "SAFE";
}

export function buildExecutionSafetyContract(input: ExecutionSafetyBuildInput): {
  ok: true;
  contract: Omit<ExecutionSafetyContract, "executionSafetyHash">;
  violations: ExecutionSafetyViolation[];
  executionTruthPackage: ExecutionTruthPackage;
} | {
  ok: false;
  violations: ExecutionSafetyViolation[];
} {
  const truth = input.executionTruthPackage
    ? { ok: true as const, executionTruthPackage: input.executionTruthPackage }
    : validateExecutionTruth({ normalizedPlan: input.normalizedPlan as NormalizedPlan });

  if (!truth.ok) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_TRUTH_REQUIRED", "Execution truth artifact is required before building execution safety.")],
    };
  }

  const executionTruthPackage = truth.executionTruthPackage;
  if (!executionTruthPackage.executionTruthHash) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_TRUTH_HASH_MISSING", "Execution truth hash is required for execution safety.")],
    };
  }
  if (!executionTruthPackage.governanceEnvelope) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_GOVERNANCE_MISSING", "Execution truth governance envelope is required.")],
    };
  }
  if (!executionTruthPackage.riskProfile) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_SAFETY_INPUT_INVALID", "Execution truth risk profile is required.")],
    };
  }
  if (!executionTruthPackage.autonomyEnvelope) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_AUTONOMY_BOUNDARY_VIOLATION", "Execution truth autonomy envelope is required.")],
    };
  }

  const governance = enforceGovernanceSafety(executionTruthPackage);
  const rollback = enforceRollbackSafety(executionTruthPackage);
  const approvals = enforceApprovalSafety(executionTruthPackage);
  const autonomy = enforceAutonomyBoundary(executionTruthPackage);
  const policyLocks = resolvePolicyLocks();
  const containmentZone = governance.containmentZone;

  const provisionalContract = {
    planId: executionTruthPackage.planId,
    executionTruthHash: executionTruthPackage.executionTruthHash,
    dependencyGraphFingerprint: executionTruthPackage.dependencyGraphFingerprint,
    governance,
    rollback,
    approvals,
    autonomy,
    freezeReasons: [] as ExecutionSafetyContract["freezeReasons"],
    escalationLevel: determineExecutionEscalationLevel(executionTruthPackage, rollback),
    containmentZone,
    policyLocks,
    replaySourceHash: executionTruthPackage.replayEnvelope.replayHash,
    executionSafetyState: "SAFE" as ExecutionSafetyState,
  };

  provisionalContract.freezeReasons = determineExecutionFreezeReasons(provisionalContract);
  provisionalContract.executionSafetyState = classifyState(provisionalContract);

  return {
    ok: true,
    contract: provisionalContract,
    violations: [],
    executionTruthPackage,
  };
}
