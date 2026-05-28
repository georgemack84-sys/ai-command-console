import type { ExecutorConstraints } from "@/types/execution-treaty";
import type { ExecutionTreatyFailure } from "./executionTreatyReplayValidator";

export function validateZeroTrustExecutorReadiness(input: {
  constraints: ExecutorConstraints;
  executionStarted: boolean;
  dispatchPerformed: boolean;
}): {
  valid: boolean;
  failures: readonly ExecutionTreatyFailure[];
} {
  const failures: ExecutionTreatyFailure[] = [];
  if (input.constraints.mayExecute !== false || input.constraints.requiresRevalidation !== true) {
    failures.push({
      code: "HANDOFF_ZERO_TRUST_ATTESTATION_REQUIRED",
      message: "executor constraints do not enforce zero-trust handoff",
      path: "executorConstraints",
    });
  }
  if (input.executionStarted || input.dispatchPerformed) {
    failures.push({
      code: "HANDOFF_EXECUTION_BEHAVIOR_DETECTED",
      message: "execution behavior is forbidden in treaty packaging",
      path: input.executionStarted ? "executionStarted" : "dispatchPerformed",
    });
  }
  return { valid: failures.length === 0, failures };
}
