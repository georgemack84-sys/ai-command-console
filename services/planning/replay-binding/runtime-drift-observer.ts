import { createReplayBindingFailure } from "./replay-binding-errors";
import type { ReplayBindingBuildInput, RuntimeDriftObservation } from "./replay-binding-types";

export function observeRuntimeDrift(input: ReplayBindingBuildInput): RuntimeDriftObservation {
  const failures = [];

  if (!input.runtimeFingerprintHash) {
    failures.push(createReplayBindingFailure(
      "RUNTIME_BINDING_DIVERGENCE",
      "Runtime fingerprint hash is required for replay binding.",
      "runtimeFingerprintHash",
    ));
  }

  if (
    input.expectedRuntimeFingerprintHash
    && input.expectedRuntimeFingerprintHash !== input.runtimeFingerprintHash
  ) {
    failures.push(createReplayBindingFailure(
      "RUNTIME_BINDING_DIVERGENCE",
      "Runtime fingerprint drift detected during replay binding.",
      "expectedRuntimeFingerprintHash",
    ));
  }

  if (!input.admissionInput.runtimeMetadata.runtimeSnapshotHash) {
    failures.push(createReplayBindingFailure(
      "FORENSIC_REPLAY_INCOMPLETE",
      "Admission runtime snapshot hash is missing.",
      "admissionInput.runtimeMetadata.runtimeSnapshotHash",
    ));
  }

  if (input.admissionInput.runtimeMetadata.mutationAttempted) {
    failures.push(createReplayBindingFailure(
      "RUNTIME_BINDING_DIVERGENCE",
      "Replay binding observed a runtime mutation attempt.",
      "admissionInput.runtimeMetadata.mutationAttempted",
    ));
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}
