import { createImmutableFailureSnapshot } from "@/services/failure-orchestration";
import type { FailureOrchestrationResult } from "@/services/failure-orchestration";
import {
  ENFORCEMENT_HARNESS_ERROR_CODES,
  type FailureSnapshotVerificationResult,
} from "./enforcementHarnessTypes";

export function verifyFailureSnapshotIntegrity(
  result: FailureOrchestrationResult,
): FailureSnapshotVerificationResult {
  const reconstructed = createImmutableFailureSnapshot({
    registryHash: result.snapshot.registryHash,
    runtimeMode: result.snapshot.runtimeMode,
    trustState: result.snapshot.trustState,
    failureGraph: result.snapshot.failureGraph,
    activeContainment: result.snapshot.activeContainment,
    timestamp: result.snapshot.timestamp,
  });

  const valid = reconstructed.snapshotHash === result.snapshot.snapshotHash;
  return {
    valid,
    snapshotHash: result.snapshot.snapshotHash,
    errorCode: valid ? undefined : ENFORCEMENT_HARNESS_ERROR_CODES.FAILURE_SNAPSHOT_TAMPERED,
    details: valid
      ? ["snapshot hash matched reconstructed immutable payload"]
      : ["snapshot hash drift detected against reconstructed immutable payload"],
  };
}
