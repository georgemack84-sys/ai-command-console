import type { ReplayBindingBuildInput, ReplayBindingFailure, ReplayRevocation } from "./replay-binding-types";

export function coordinateReplayRevocation(input: {
  buildInput: ReplayBindingBuildInput;
  failures: readonly ReplayBindingFailure[];
}): ReplayRevocation | undefined {
  const decision = input.buildInput.admissionReadiness.result.decision;
  const bindingId = `rb-${input.buildInput.admissionInput.normalizedPlan.planId}`;

  if (decision === "REVOKED" || decision === "DENIED" || decision === "QUARANTINED") {
    return {
      replayId: bindingId,
      revokedBecause: "ADMISSION_REVOKED",
      escalationRequired: decision === "QUARANTINED",
    };
  }

  if (input.failures.some((failure) => failure.code === "IMMUTABLE_LINEAGE_VIOLATION" || failure.code === "REPLAY_BINDING_DRIFT")) {
    return {
      replayId: bindingId,
      revokedBecause: "LINEAGE_DRIFT",
      escalationRequired: true,
    };
  }
  if (input.failures.some((failure) => failure.code === "TRUST_ZONE_REPLAY_MISMATCH")) {
    return {
      replayId: bindingId,
      revokedBecause: "TRUST_ZONE_VIOLATION",
      escalationRequired: true,
    };
  }
  if (input.failures.some((failure) => failure.code === "RUNTIME_BINDING_DIVERGENCE")) {
    return {
      replayId: bindingId,
      revokedBecause: "RUNTIME_DIVERGENCE",
      escalationRequired: true,
    };
  }
  if (input.failures.some((failure) => failure.code === "REPLAY_EVIDENCE_CORRUPTED" || failure.code === "REPLAY_RECONSTRUCTION_UNSTABLE")) {
    return {
      replayId: bindingId,
      revokedBecause: "REPLAY_CORRUPTION",
      escalationRequired: true,
    };
  }

  return undefined;
}
