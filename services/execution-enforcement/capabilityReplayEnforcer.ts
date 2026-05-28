import type { RuntimeAuthorityEnvelope, ReplayContainmentBinding, EnforcementViolation } from "./enforcementTypes";

export function validateReplayContainment(
  envelope: RuntimeAuthorityEnvelope,
  replayBinding?: ReplayContainmentBinding,
): { valid: boolean; violations: EnforcementViolation[] } {
  const violations: EnforcementViolation[] = [];

  if (!replayBinding) {
    violations.push({
      rule: "replay.binding.required",
      reasonCode: "EXECUTION_REPLAY_REQUIRED",
    });
    return { valid: false, violations };
  }

  if (replayBinding.toolId !== envelope.toolId || replayBinding.toolVersion !== envelope.toolVersion) {
    violations.push({
      rule: "replay.identity.match",
      expected: { toolId: envelope.toolId, toolVersion: envelope.toolVersion },
      actual: { toolId: replayBinding.toolId, toolVersion: replayBinding.toolVersion },
      reasonCode: "EXECUTION_REPLAY_CONTAINMENT_MISMATCH",
    });
  }
  if (replayBinding.registryHash !== envelope.registryHash || replayBinding.capabilityHash !== envelope.capabilityHash) {
    violations.push({
      rule: "replay.authority.hashes.match",
      expected: { registryHash: envelope.registryHash, capabilityHash: envelope.capabilityHash },
      actual: { registryHash: replayBinding.registryHash, capabilityHash: replayBinding.capabilityHash },
      reasonCode: "EXECUTION_REPLAY_CONTAINMENT_MISMATCH",
    });
  }
  if (replayBinding.sandboxProfileHash !== envelope.sandboxProfileHash) {
    violations.push({
      rule: "replay.sandbox.match",
      expected: envelope.sandboxProfileHash,
      actual: replayBinding.sandboxProfileHash,
      reasonCode: "EXECUTION_REPLAY_CONTAINMENT_MISMATCH",
    });
  }
  if (replayBinding.trustBoundaryHash !== envelope.derivedBoundaryHash) {
    violations.push({
      rule: "replay.trust-boundary.match",
      expected: envelope.derivedBoundaryHash,
      actual: replayBinding.trustBoundaryHash,
      reasonCode: "EXECUTION_REPLAY_CONTAINMENT_MISMATCH",
    });
  }
  if ((replayBinding.environmentHash ?? null) !== (envelope.environmentHash ?? null)) {
    violations.push({
      rule: "replay.environment.match",
      expected: envelope.environmentHash ?? null,
      actual: replayBinding.environmentHash ?? null,
      reasonCode: "EXECUTION_REPLAY_CONTAINMENT_MISMATCH",
    });
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
