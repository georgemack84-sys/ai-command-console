import type { ExecutionSafetyContract, ExecutionFreezeReason } from "./execution-safety-types";

export function determineExecutionFreezeReasons(contract: Omit<ExecutionSafetyContract, "executionSafetyHash">): ExecutionFreezeReason[] {
  const reasons: ExecutionFreezeReason[] = [];

  if (contract.governance.blockedReasons.length > 0) {
    reasons.push("GOVERNANCE_BLOCKED");
  }
  if (contract.rollback.required && (contract.rollback.rollbackCapability === "none" || contract.rollback.rollbackCapability === "unknown")) {
    reasons.push("ROLLBACK_MISSING");
  }
  if (contract.policyLocks.length === 0) {
    reasons.push("POLICY_LOCK_MISSING");
  }
  if (contract.containmentZone === "CROSS_TENANT_FORBIDDEN") {
    reasons.push("CONTAINMENT_VIOLATION");
  }

  return reasons;
}
