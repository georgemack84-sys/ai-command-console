import type { ExecutionSafetyState } from "./execution-safety-types";
import { createExecutionSafetyViolation } from "./execution-safety-errors";

export function validateExecutionSafetyTransition(
  from: ExecutionSafetyState,
  to: ExecutionSafetyState,
  context: {
    governanceCleared?: boolean;
    replayValidated?: boolean;
    approvalCleared?: boolean;
  },
) {
  if (from === to) {
    return { ok: true as const };
  }

  if (from === "BLOCKED" && to === "SAFE") {
    return { ok: false as const, violation: createExecutionSafetyViolation("EXECUTION_SAFETY_STATE_TRANSITION_INVALID", "Blocked state cannot become SAFE inside 4.2F.") };
  }
  if (from === "APPROVAL_REQUIRED" && to === "SAFE" && !context.approvalCleared) {
    return { ok: false as const, violation: createExecutionSafetyViolation("EXECUTION_SAFETY_STATE_TRANSITION_INVALID", "Approval-required state cannot become SAFE without approval clearance.") };
  }
  if (from === "FROZEN" && to === "SAFE" && !context.governanceCleared) {
    return { ok: false as const, violation: createExecutionSafetyViolation("EXECUTION_SAFETY_STATE_TRANSITION_INVALID", "Frozen state cannot become SAFE without governance clearance.") };
  }
  if (from === "DISPUTED" && to === "SAFE" && (!context.governanceCleared || !context.replayValidated)) {
    return { ok: false as const, violation: createExecutionSafetyViolation("EXECUTION_SAFETY_STATE_TRANSITION_INVALID", "Disputed state cannot become SAFE without governance clearance and replay validation.") };
  }

  return { ok: true as const };
}
