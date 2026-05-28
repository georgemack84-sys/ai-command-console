import type { ImmutableExecutionBinding, ReplayBindingVerificationInput, ResolutionFailure } from "./resolutionTypes";
import { deriveBindingHash, deriveBindingId } from "./executionBindingHasher";

export function enforceReplayBinding(input: ReplayBindingVerificationInput): readonly ResolutionFailure[] {
  const failures: ResolutionFailure[] = [];
  const { binding, runtime, governance } = input;

  if (binding.toolId !== runtime.envelope.toolId || binding.toolVersion !== runtime.envelope.toolVersion) {
    failures.push({
      code: "TOOL_REPLAY_RESOLUTION_MISMATCH",
      message: "replay binding identity does not match original runtime authority identity",
    });
  }

  if (binding.registryHash !== runtime.envelope.registryHash || binding.capabilityHash !== runtime.envelope.capabilityHash) {
    failures.push({
      code: "TOOL_BINDING_MUTATION_DETECTED",
      message: "replay binding registry or capability hash does not match original runtime authority",
    });
  }

  if (binding.sandboxProfileHash !== runtime.envelope.sandboxProfileHash
    || binding.trustZoneHash !== runtime.trustZoneHash
    || binding.runtimeAuthorityLockHash !== runtime.authorityLock.lockHash) {
    failures.push({
      code: "TOOL_SNAPSHOT_INCONSISTENT",
      message: "replay binding runtime containment does not match original runtime authority",
    });
  }

  if (binding.replayContainmentHash !== governance.evidenceBundle.replayContainmentHash) {
    failures.push({
      code: "TOOL_REPLAY_RESOLUTION_MISMATCH",
      message: "replay containment hash does not match original evidence bundle",
    });
  }

  if (
    binding.governanceHash !== governance.attribution.governanceHash
    || binding.lineageHash !== governance.lineageNode.lineageHash
    || binding.provenanceHash !== governance.provenanceHash
    || binding.evidenceHash !== governance.evidenceBundle.evidenceHash
  ) {
    failures.push({
      code: "TOOL_BINDING_MUTATION_DETECTED",
      message: "replay binding governance attribution does not match original governance evidence",
    });
  }

  const expectedBindingHash = deriveBindingHash({
    toolId: binding.toolId,
    toolVersion: binding.toolVersion,
    registryHash: binding.registryHash,
    capabilityHash: binding.capabilityHash,
    sandboxProfileHash: binding.sandboxProfileHash,
    trustZoneHash: binding.trustZoneHash,
    runtimeAuthorityLockHash: binding.runtimeAuthorityLockHash,
    replayContainmentHash: binding.replayContainmentHash,
    governanceHash: binding.governanceHash,
    lineageHash: binding.lineageHash,
    provenanceHash: binding.provenanceHash,
    evidenceHash: binding.evidenceHash,
    resolutionHash: binding.resolutionHash,
  });

  if (binding.bindingHash !== expectedBindingHash || binding.bindingId !== deriveBindingId(expectedBindingHash)) {
    failures.push({
      code: "TOOL_BINDING_MUTATION_DETECTED",
      message: "binding hash or binding id is inconsistent with the immutable binding artifact",
    });
  }

  return failures;
}
