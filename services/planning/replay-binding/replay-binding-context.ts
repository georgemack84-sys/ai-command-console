import { hashStableContent } from "../versioning";
import type { ReplayBindingBuildInput, ReplayBindingContext } from "./replay-binding-types";

export function buildReplayBindingContext(input: ReplayBindingBuildInput): ReplayBindingContext {
  const admissionContext = input.admissionReadiness.context;

  return {
    planHash: admissionContext.planHash,
    executionTruthHash: admissionContext.lineage.executionTruthHash,
    executionCompatibilityHash: admissionContext.lineage.executionCompatibilityHash,
    replaySnapshotHash: admissionContext.lineage.replaySnapshotHash,
    ...(admissionContext.lineage.derivedSimulationHash
      ? { derivedSimulationHash: admissionContext.lineage.derivedSimulationHash }
      : {}),
    governanceHash: admissionContext.governanceSnapshotHash,
    dependencyHash: input.admissionInput.executionCompatibilityContract.compatibilitySnapshot.dependencyGraphFingerprint,
    runtimeFingerprintHash: input.runtimeFingerprintHash,
    trustZoneId: input.trustZoneId ?? admissionContext.trustZone,
    admissionDecision: input.admissionReadiness.result.decision,
    requestedAt: admissionContext.requestedAt,
  };
}

export function hashReplayBindingContext(context: ReplayBindingContext): string {
  return hashStableContent("REPLAY_CONTEXT", context);
}
