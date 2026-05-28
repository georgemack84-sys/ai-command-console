import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { RuntimeAuthorityEnvelope, RuntimeAuthorityLock } from "./enforcementTypes";

export function createRuntimeAuthorityLock(input: {
  envelope: RuntimeAuthorityEnvelope;
  lockedAt: string;
}): RuntimeAuthorityLock {
  const lockBase = {
    toolId: input.envelope.toolId,
    toolVersion: input.envelope.toolVersion,
    registryHash: input.envelope.registryHash,
    capabilityHash: input.envelope.capabilityHash,
    trustZone: input.envelope.trustZone,
    sandboxProfileHash: input.envelope.sandboxProfileHash,
    derivedBoundaryHash: input.envelope.derivedBoundaryHash,
    lockedAt: input.lockedAt,
  };

  return {
    ...lockBase,
    lockHash: hashStableContent("EVIDENCE_BUNDLE", lockBase),
  };
}
