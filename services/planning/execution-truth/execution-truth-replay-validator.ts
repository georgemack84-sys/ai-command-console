import { validateExecutionTruth } from "./execution-truth-validator";
import { createExecutionTruthError } from "./execution-truth-errors";
import type { ExecutionTruthPackage, ExecutionTruthReplayValidationResult } from "./execution-truth-types";
import type { NormalizedPlan } from "../normalization";

export function validateExecutionTruthReplay(input: {
  normalizedPlan: NormalizedPlan;
  executionTruthPackage: ExecutionTruthPackage;
}): ExecutionTruthReplayValidationResult {
  const recomputed = validateExecutionTruth({
    normalizedPlan: input.normalizedPlan,
  });

  if (!recomputed.ok) {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_REPLAY_MISMATCH",
        "Replay validation failed because execution truth could not be recomputed.",
        { error: recomputed.error },
      ),
    };
  }

  if (recomputed.executionTruthPackage.executionTruthHash !== input.executionTruthPackage.executionTruthHash) {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_EXECUTION_TRUTH_HASH_MISMATCH",
        "Execution truth hash mismatch during replay validation.",
      ),
    };
  }

  return {
    ok: true,
    executionTruthPackage: recomputed.executionTruthPackage,
  };
}
