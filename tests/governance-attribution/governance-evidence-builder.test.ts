import { describe, expect, it } from "vitest";

import { buildGovernanceEvidenceBundle, hashGovernanceEvidenceBundle } from "@/services/governance-attribution";
import { buildGovernanceFixture } from "./helpers";

describe("governance evidence builder", () => {
  it("builds reproducible evidence bundles", () => {
    const { evidenceBundle } = buildGovernanceFixture();

    expect(buildGovernanceEvidenceBundle({
      executionId: evidenceBundle.executionId,
      toolId: evidenceBundle.toolId,
      toolVersion: evidenceBundle.toolVersion,
      registryHash: evidenceBundle.registryHash,
      capabilityHash: evidenceBundle.capabilityHash,
      sandboxProfileHash: evidenceBundle.sandboxProfileHash,
      trustZoneHash: evidenceBundle.trustZoneHash,
      runtimeAuthorityLockHash: evidenceBundle.runtimeAuthorityLockHash,
      replayContainmentHash: evidenceBundle.replayContainmentHash,
      governanceHash: evidenceBundle.governanceHash,
      lineageHash: evidenceBundle.lineageHash,
      provenanceHash: evidenceBundle.provenanceHash,
      boundaryHash: evidenceBundle.boundaryHash,
    })).toEqual(evidenceBundle);
  });

  it("rejects forged governance evidence hashes", () => {
    const { evidenceBundle } = buildGovernanceFixture();
    const tampered = {
      ...evidenceBundle,
      evidenceHash: "forged",
    };

    expect(hashGovernanceEvidenceBundle(tampered)).not.toBe(tampered.evidenceHash);
  });
});
