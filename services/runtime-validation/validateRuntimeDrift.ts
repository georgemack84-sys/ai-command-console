import type { RuntimeDriftResult, RuntimeValidationFailure, RuntimeValidationInput, RuntimeTrustState } from "./runtimeValidationTypes";
import { hashRuntimeDrift } from "./runtimeValidationHasher";

function driftState(failures: readonly RuntimeValidationFailure[]): RuntimeTrustState {
  if (!failures.length) return "certified";
  if (failures.some((failure) => failure.code === "RUNTIME_BINDING_INVALIDATED")) return "revoked";
  return "drifted";
}

export function validateRuntimeDrift(input: RuntimeValidationInput): RuntimeDriftResult {
  const failures: RuntimeValidationFailure[] = [];
  const { binding, activeRuntime } = input;

  if (binding.sandboxProfileHash !== activeRuntime.runtime.envelope.sandboxProfileHash) {
    failures.push({
      code: "RUNTIME_SANDBOX_DRIFT",
      message: "sandbox profile drift detected",
      expected: binding.sandboxProfileHash,
      actual: activeRuntime.runtime.envelope.sandboxProfileHash,
    });
  }
  if (binding.runtimeAuthorityLockHash !== activeRuntime.runtime.authorityLock.lockHash) {
    failures.push({
      code: "RUNTIME_AUTHORITY_DRIFT",
      message: "runtime authority lock drift detected",
      expected: binding.runtimeAuthorityLockHash,
      actual: activeRuntime.runtime.authorityLock.lockHash,
    });
  }
  if (binding.replayContainmentHash !== activeRuntime.governance.evidenceBundle.replayContainmentHash) {
    failures.push({
      code: "RUNTIME_REPLAY_CONTAINMENT_DRIFT",
      message: "replay containment drift detected",
      expected: binding.replayContainmentHash,
      actual: activeRuntime.governance.evidenceBundle.replayContainmentHash,
    });
  }
  if (binding.governanceHash !== activeRuntime.governance.attribution.governanceHash) {
    failures.push({
      code: "RUNTIME_GOVERNANCE_DRIFT",
      message: "governance hash drift detected",
      expected: binding.governanceHash,
      actual: activeRuntime.governance.attribution.governanceHash,
    });
  }
  if (binding.lineageHash !== activeRuntime.governance.lineageNode.lineageHash) {
    failures.push({
      code: "RUNTIME_GOVERNANCE_DRIFT",
      message: "lineage hash drift detected",
      expected: binding.lineageHash,
      actual: activeRuntime.governance.lineageNode.lineageHash,
    });
  }
  if (binding.provenanceHash !== activeRuntime.governance.provenanceHash) {
    failures.push({
      code: "RUNTIME_GOVERNANCE_DRIFT",
      message: "provenance hash drift detected",
      expected: binding.provenanceHash,
      actual: activeRuntime.governance.provenanceHash,
    });
  }
  if (binding.evidenceHash !== activeRuntime.governance.evidenceBundle.evidenceHash) {
    failures.push({
      code: "RUNTIME_BINDING_INVALIDATED",
      message: "evidence hash drift detected",
      expected: binding.evidenceHash,
      actual: activeRuntime.governance.evidenceBundle.evidenceHash,
    });
  }

  const trustState = driftState(failures);
  const driftHash = hashRuntimeDrift({
    driftDetected: failures.length > 0,
    trustState,
    driftHash: input.binding.bindingHash,
  });

  return {
    driftDetected: failures.length > 0,
    trustState,
    failures,
    driftHash,
  };
}
