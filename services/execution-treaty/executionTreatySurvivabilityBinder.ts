import type { FailureOrchestrationResult } from "@/services/failure-orchestration";
import type { SurvivabilityCertificationResult } from "@/services/production-trust-framework";
import type { ExecutionTreatyFailure } from "./executionTreatyReplayValidator";

export function bindTreatySurvivability(input: {
  failureState: FailureOrchestrationResult;
  survivabilityCertification: SurvivabilityCertificationResult;
}): {
  survivabilityHash: string;
  failureSnapshotHash: string;
  runtimeMode: string;
  trustState: string;
  failures: readonly ExecutionTreatyFailure[];
} {
  const failures: ExecutionTreatyFailure[] = [];
  if (!input.survivabilityCertification.valid) {
    failures.push({
      code: "HANDOFF_REVALIDATION_REQUIRED",
      message: "survivability certification failed",
      path: "survivabilityCertification",
    });
  }
  return {
    survivabilityHash: input.survivabilityCertification.survivabilityHash,
    failureSnapshotHash: input.failureState.snapshot.snapshotHash,
    runtimeMode: input.failureState.runtimeMode,
    trustState: input.failureState.trustState,
    failures,
  };
}
