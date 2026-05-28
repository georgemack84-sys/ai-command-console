import { describe, expect, it } from "vitest";

import { hashGovernanceAttribution } from "@/services/governance-attribution";
import { hashTrustBoundary } from "@/services/execution-enforcement";
import { buildGovernanceFixture } from "./helpers";

describe("governance hashing", () => {
  it("is deterministic for identical containment truth", () => {
    const { attributionInput, entry, enforcement } = buildGovernanceFixture();
    const hashA = hashGovernanceAttribution({
      metadata: entry.governanceMetadata,
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: enforcement.envelope!.capabilityHash,
      sandboxProfileHash: enforcement.envelope!.sandboxProfileHash,
      trustZoneHash: hashTrustBoundary(attributionInput.authorityEnvelope.trustZone),
      replayContainmentHash: attributionInput.replayContainmentHash,
      runtimeAuthorityLockHash: attributionInput.authorityLock.lockHash,
      boundaryHash: attributionInput.boundaryHash,
    });
    const hashB = hashGovernanceAttribution({
      metadata: JSON.parse(JSON.stringify(entry.governanceMetadata)),
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: enforcement.envelope!.capabilityHash,
      sandboxProfileHash: enforcement.envelope!.sandboxProfileHash,
      trustZoneHash: hashTrustBoundary(attributionInput.authorityEnvelope.trustZone),
      replayContainmentHash: attributionInput.replayContainmentHash,
      runtimeAuthorityLockHash: attributionInput.authorityLock.lockHash,
      boundaryHash: attributionInput.boundaryHash,
    });

    expect(hashA).toBe(hashB);
  });

  it("changes when runtime containment truth changes", () => {
    const { attributionInput, entry, enforcement } = buildGovernanceFixture();
    const hashA = hashGovernanceAttribution({
      metadata: entry.governanceMetadata,
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: enforcement.envelope!.capabilityHash,
      sandboxProfileHash: enforcement.envelope!.sandboxProfileHash,
      trustZoneHash: hashTrustBoundary(attributionInput.authorityEnvelope.trustZone),
      replayContainmentHash: attributionInput.replayContainmentHash,
      runtimeAuthorityLockHash: attributionInput.authorityLock.lockHash,
      boundaryHash: attributionInput.boundaryHash,
    });
    const hashB = hashGovernanceAttribution({
      metadata: entry.governanceMetadata,
      toolId: entry.toolId,
      toolVersion: entry.version,
      registryHash: entry.registryHash,
      capabilityHash: enforcement.envelope!.capabilityHash,
      sandboxProfileHash: `${enforcement.envelope!.sandboxProfileHash}-drift`,
      trustZoneHash: hashTrustBoundary(attributionInput.authorityEnvelope.trustZone),
      replayContainmentHash: attributionInput.replayContainmentHash,
      runtimeAuthorityLockHash: attributionInput.authorityLock.lockHash,
      boundaryHash: attributionInput.boundaryHash,
    });

    expect(hashA).not.toBe(hashB);
  });
});
