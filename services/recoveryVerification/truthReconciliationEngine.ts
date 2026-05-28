import type { TruthReconciliationResult } from "./recoveryVerificationTypes";

export function reconcileRuntimeTruth({
  bundle,
  executionState,
  continuityState,
}: {
  bundle: any;
  executionState: any;
  continuityState?: any;
}): TruthReconciliationResult {
  const disputes: string[] = [];
  if (bundle?.timeline?.meta?.matchesReadModel === false) {
    disputes.push("timeline:disputed");
  }

  const executionStatus = String(bundle?.readModel?.execution?.status || "");
  const persistedExecutionStatus = String(executionState?.execution?.status || "");
  if (executionStatus && persistedExecutionStatus && executionStatus !== persistedExecutionStatus) {
    disputes.push("execution:status_mismatch");
  }

  if (continuityState?.runtimeState === "QUARANTINED" || continuityState?.runtimeState === "FAILED") {
    disputes.push("continuity:unsafe_runtime_state");
  }

  return {
    runtimeIntegrity: disputes.length === 0,
    continuityIntegrity: !disputes.includes("continuity:unsafe_runtime_state"),
    disputes,
    evidence: [...disputes],
  };
}
