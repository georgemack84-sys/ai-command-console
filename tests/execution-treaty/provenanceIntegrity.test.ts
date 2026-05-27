import { describe, expect, it } from "vitest";
import { bindTreatyProvenance } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("provenance integrity", () => {
  it("fails when approval or governance provenance is missing", () => {
    const { input } = buildExecutionTreatyFixture({
      trustedSnapshotAdmission: {
        ok: true,
        snapshotId: "snapshot-1",
        registrySnapshotHash: "sha256:registry",
        integrityVerified: true,
        snapshotAdmissionVerified: true,
        signatureVerified: true,
        trustVerified: true,
        provenanceVerified: true,
        promotionVerified: true,
        signature: {
          snapshotId: "snapshot-1",
          registrySnapshotHash: "sha256:registry",
          signature: "sig",
          signedBy: "authority",
          signingKeyId: "key-1",
          signedAt: "2026-05-16T00:00:00.000Z",
        },
        provenance: {
          snapshotId: "snapshot-1",
          registrySnapshotHash: "sha256:registry",
          promotionStage: "production",
          signedBy: "authority",
        },
        authority: {
          authorityId: "authority",
          signingKeyId: "key-1",
          status: "active",
          allowedEnvironments: ["production"],
          allowedPromotionStages: ["production"],
          allowedTrustScopes: ["registry-snapshot-signing"],
        },
      },
    });
    const result = bindTreatyProvenance({
      trustedSnapshotAdmission: input.trustedSnapshotAdmission,
    });

    expect(result.failures.some((failure) => failure.code === "HANDOFF_APPROVAL_CHAIN_INVALID")).toBe(true);
    expect(result.failures.some((failure) => failure.code === "HANDOFF_PROVENANCE_MISSING")).toBe(true);
  });
});
