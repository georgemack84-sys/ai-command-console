import { buildReplayBindingContext } from "./replay-binding-context";
import type { ImmutableReplayBinding, ReplayBindingBuildInput } from "./replay-binding-types";

export function buildImmutableReplayBinding(input: ReplayBindingBuildInput): ImmutableReplayBinding {
  const context = buildReplayBindingContext(input);

  return {
    bindingId: `rb-${input.admissionInput.normalizedPlan.planId}`,
    executionTruthHash: context.executionTruthHash,
    executionCompatibilityHash: context.executionCompatibilityHash,
    replaySnapshotHash: context.replaySnapshotHash,
    ...(context.derivedSimulationHash ? { derivedSimulationHash: context.derivedSimulationHash } : {}),
    governanceHash: context.governanceHash,
    dependencyHash: context.dependencyHash,
    runtimeFingerprintHash: context.runtimeFingerprintHash,
    trustZoneId: context.trustZoneId,
    createdAt: context.requestedAt,
  };
}
