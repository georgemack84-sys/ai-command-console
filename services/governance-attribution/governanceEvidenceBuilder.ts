import type { GovernanceEvidenceBundle } from "./governanceTypes";
import { hashGovernanceEvidenceBundle } from "./governanceHashing";

export function buildGovernanceEvidenceBundle(input: Omit<GovernanceEvidenceBundle, "evidenceHash">): GovernanceEvidenceBundle {
  const bundle = {
    executionId: input.executionId,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
    registryHash: input.registryHash,
    capabilityHash: input.capabilityHash,
    sandboxProfileHash: input.sandboxProfileHash,
    trustZoneHash: input.trustZoneHash,
    runtimeAuthorityLockHash: input.runtimeAuthorityLockHash,
    replayContainmentHash: input.replayContainmentHash,
    governanceHash: input.governanceHash,
    lineageHash: input.lineageHash,
    provenanceHash: input.provenanceHash,
    boundaryHash: input.boundaryHash,
  } as const;

  return {
    ...bundle,
    evidenceHash: hashGovernanceEvidenceBundle(bundle),
  };
}
