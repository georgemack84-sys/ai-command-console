import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { RuntimeAuthorityEnvelope, RuntimeAuthorityLock, EnforcementViolation } from "./enforcementTypes";

export function detectRuntimeAuthorityDrift(input: {
  envelope: RuntimeAuthorityEnvelope;
  authorityLock?: RuntimeAuthorityLock;
}): { valid: boolean; violations: EnforcementViolation[] } {
  if (!input.authorityLock) {
    return { valid: true, violations: [] };
  }

  const expectedLockHash = hashStableContent("EVIDENCE_BUNDLE", {
    toolId: input.authorityLock.toolId,
    toolVersion: input.authorityLock.toolVersion,
    registryHash: input.authorityLock.registryHash,
    capabilityHash: input.authorityLock.capabilityHash,
    trustZone: input.authorityLock.trustZone,
    sandboxProfileHash: input.authorityLock.sandboxProfileHash,
    derivedBoundaryHash: input.authorityLock.derivedBoundaryHash,
    lockedAt: input.authorityLock.lockedAt,
  });

  const violations: EnforcementViolation[] = [];
  if (expectedLockHash !== input.authorityLock.lockHash) {
    violations.push({
      rule: "authority-lock.integrity",
      expected: expectedLockHash,
      actual: input.authorityLock.lockHash,
      reasonCode: "RUNTIME_AUTHORITY_LOCK_INVALID",
    });
  }

  if (
    input.authorityLock.registryHash !== input.envelope.registryHash
    || input.authorityLock.capabilityHash !== input.envelope.capabilityHash
    || input.authorityLock.trustZone !== input.envelope.trustZone
    || input.authorityLock.sandboxProfileHash !== input.envelope.sandboxProfileHash
    || input.authorityLock.derivedBoundaryHash !== input.envelope.derivedBoundaryHash
  ) {
    violations.push({
      rule: "authority-lock.drift",
      expected: {
        registryHash: input.authorityLock.registryHash,
        capabilityHash: input.authorityLock.capabilityHash,
        trustZone: input.authorityLock.trustZone,
        sandboxProfileHash: input.authorityLock.sandboxProfileHash,
        derivedBoundaryHash: input.authorityLock.derivedBoundaryHash,
      },
      actual: {
        registryHash: input.envelope.registryHash,
        capabilityHash: input.envelope.capabilityHash,
        trustZone: input.envelope.trustZone,
        sandboxProfileHash: input.envelope.sandboxProfileHash,
        derivedBoundaryHash: input.envelope.derivedBoundaryHash,
      },
      reasonCode: "RUNTIME_AUTHORITY_DRIFT_DETECTED",
    });
  }

  return { valid: violations.length === 0, violations };
}
