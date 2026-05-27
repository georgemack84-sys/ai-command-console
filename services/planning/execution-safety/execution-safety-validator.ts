import { validateExecutionTruth } from "../execution-truth";
import { buildExecutionSafetyContract } from "./execution-safety-contract-builder";
import { hashExecutionSafetyContract } from "./execution-safety-hasher";
import { replayValidateExecutionSafety } from "./execution-safety-replay-validator";
import { validateExecutionSafetyTransition } from "./execution-safety-state-machine";
import { createExecutionSafetyViolation } from "./execution-safety-errors";
import type { ExecutionSafetyBuildInput, ExecutionSafetyValidationResult } from "./execution-safety-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

export function validateExecutionSafety(input: ExecutionSafetyBuildInput): ExecutionSafetyValidationResult {
  const truth = input.executionTruthPackage
    ? { ok: true as const, executionTruthPackage: input.executionTruthPackage }
    : validateExecutionTruth({ normalizedPlan: input.normalizedPlan });

  if (!truth.ok) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_TRUTH_REQUIRED", "Execution truth is required before execution safety validation.")],
      state: "BLOCKED",
      replayValidated: false,
    };
  }

  const built = buildExecutionSafetyContract({
    normalizedPlan: input.normalizedPlan,
    executionTruthPackage: truth.executionTruthPackage,
  });
  if (!built.ok) {
    return {
      ok: false,
      violations: built.violations,
      state: "BLOCKED",
      replayValidated: false,
    };
  }

  const violations = [...built.violations];
  if (!built.contract.executionTruthHash) {
    violations.push(createExecutionSafetyViolation("EXECUTION_TRUTH_HASH_MISSING", "Execution truth hash is required."));
  }
  if (built.contract.governance.policyLocks.length === 0) {
    violations.push(createExecutionSafetyViolation("EXECUTION_POLICY_LOCK_MISSING", "Execution policy locks are required."));
  }
  if (built.contract.governance.blockedReasons.length > 0) {
    violations.push(createExecutionSafetyViolation("EXECUTION_GOVERNANCE_MISSING", "Governance blocked execution safety contract."));
  }
  if (built.contract.rollback.required && built.contract.rollback.invariants.some((invariant) => !invariant.satisfied)) {
    violations.push(createExecutionSafetyViolation("EXECUTION_ROLLBACK_INVARIANT_MISSING", "Rollback invariants are incomplete or weakened."));
  }
  if (built.contract.approvals.some((approval) => approval.required)) {
    violations.push(createExecutionSafetyViolation("EXECUTION_APPROVAL_REQUIRED", "Execution safety requires explicit approval."));
  }
  if (built.contract.autonomy.selfElevationBlocked && built.contract.autonomy.maxAutonomyLevel === "bounded_autonomous") {
    violations.push(createExecutionSafetyViolation("EXECUTION_AUTONOMY_BOUNDARY_VIOLATION", "Autonomy boundary self-elevation was detected."));
  }
  if (built.contract.containmentZone === "CROSS_TENANT_FORBIDDEN") {
    violations.push(createExecutionSafetyViolation("EXECUTION_CONTAINMENT_VIOLATION", "Containment zone is cross-tenant forbidden."));
  }
  if (built.contract.freezeReasons.length > 0) {
    violations.push(createExecutionSafetyViolation("EXECUTION_FREEZE_REQUIRED", "Execution safety contract requires freeze handling."));
  }

  const hashedContract = {
    ...built.contract,
    executionSafetyHash: hashExecutionSafetyContract({ contract: built.contract }),
  };

  const transition = validateExecutionSafetyTransition("SAFE", hashedContract.executionSafetyState, {
    governanceCleared: false,
    replayValidated: true,
    approvalCleared: false,
  });
  if (!transition.ok) {
    violations.push(transition.violation);
  }

  const replay = replayValidateExecutionSafety({
    normalizedPlan: input.normalizedPlan,
    executionTruthPackage: truth.executionTruthPackage,
    contract: hashedContract,
  });
  if (!replay.ok) {
    violations.push(...replay.violations);
  }

  const frozenContract = deepFreeze(hashedContract);
  if (violations.length > 0) {
    return {
      ok: false,
      contract: frozenContract,
      executionSafetyHash: hashedContract.executionSafetyHash,
      violations,
      state: hashedContract.executionSafetyState,
      replayValidated: false,
    };
  }

  return {
    ok: true,
    contract: frozenContract,
    executionSafetyHash: hashedContract.executionSafetyHash,
    violations: [],
    state: hashedContract.executionSafetyState,
    replayValidated: true,
  };
}
