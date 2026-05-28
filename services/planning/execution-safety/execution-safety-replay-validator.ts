import { buildExecutionSafetyContract } from "./execution-safety-contract-builder";
import { hashExecutionSafetyContract } from "./execution-safety-hasher";
import { createExecutionSafetyViolation } from "./execution-safety-errors";
import type { ExecutionSafetyContract, ExecutionSafetyValidationResult } from "./execution-safety-types";
import type { NormalizedPlan } from "../normalization";
import type { ExecutionTruthPackage } from "../execution-truth";

export function replayValidateExecutionSafety(input: {
  normalizedPlan: NormalizedPlan;
  executionTruthPackage: ExecutionTruthPackage;
  contract: ExecutionSafetyContract;
}): ExecutionSafetyValidationResult {
  const rebuilt = buildExecutionSafetyContract({
    normalizedPlan: input.normalizedPlan,
    executionTruthPackage: input.executionTruthPackage,
  });

  if (!rebuilt.ok) {
    return {
      ok: false,
      violations: [createExecutionSafetyViolation("EXECUTION_SAFETY_REPLAY_DIVERGENCE", "Execution safety replay rebuild failed.")],
      state: "BLOCKED",
      replayValidated: false,
    };
  }

  const replayHash = hashExecutionSafetyContract({ contract: rebuilt.contract });
  if (replayHash !== input.contract.executionSafetyHash) {
    return {
      ok: false,
      contract: input.contract,
      executionSafetyHash: input.contract.executionSafetyHash,
      violations: [createExecutionSafetyViolation("EXECUTION_SAFETY_HASH_MISMATCH", "Execution safety replay hash diverged.")],
      state: "BLOCKED",
      replayValidated: false,
    };
  }

  return {
    ok: true,
    contract: input.contract,
    executionSafetyHash: input.contract.executionSafetyHash!,
    violations: [],
    state: input.contract.executionSafetyState,
    replayValidated: true,
  };
}
