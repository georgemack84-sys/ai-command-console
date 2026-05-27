import {
  createDeterministicRegistrySnapshotSignatureForTests,
  type RegistrySnapshotSignature,
} from "@/services/registry-signatures";
import {
  createRegistryTrustAuthorityStore,
  type RegistryTrustAuthority,
  type RegistryTrustVerificationContext,
} from "@/services/registry-trust";
import {
  buildRegistrySnapshotFixture,
} from "@/tests/registry-snapshots/helpers";
import type { RegistrySnapshotProvenance } from "@/services/registry-provenance";

export function buildRegistryTrustAuthorityFixture(
  override: Partial<RegistryTrustAuthority> = {},
): RegistryTrustAuthority {
  return {
    authorityId: "governance-authority-01",
    signingKeyId: "key-001",
    status: "active",
    allowedEnvironments: ["development", "validation", "staging", "production"],
    allowedPromotionStages: ["development", "validation", "staging", "production"],
    allowedTrustScopes: ["registry-snapshot-signing"],
    ...override,
  };
}

export function buildRegistryTrustContextFixture(
  override: Partial<RegistryTrustVerificationContext> = {},
): RegistryTrustVerificationContext {
  return {
    environment: "staging",
    promotionStage: "staging",
    trustScope: "registry-snapshot-signing",
    ...override,
  };
}

export function buildRegistrySnapshotSignatureFixture(
  override: Partial<RegistrySnapshotSignature> = {},
) {
  const snapshot = buildRegistrySnapshotFixture();
  const signedBy = override.signedBy ?? "governance-authority-01";
  const signingKeyId = override.signingKeyId ?? "key-001";
  return {
    snapshot,
    signature: {
      ...createDeterministicRegistrySnapshotSignatureForTests({
        snapshotId: snapshot.manifest.snapshotId,
        registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
        signedBy,
        signingKeyId,
        signedAt: override.signedAt ?? "2026-05-15T00:00:00.000Z",
      }),
      ...override,
    },
  };
}

export function buildRegistrySnapshotProvenanceFixture(
  override: Partial<RegistrySnapshotProvenance> = {},
): RegistrySnapshotProvenance {
  const genesis = buildRegistrySnapshotFixture({ snapshotVersion: 1, allowGenesis: true });
  const snapshot = buildRegistrySnapshotFixture({
    snapshotVersion: 2,
    parentSnapshot: genesis,
    allowGenesis: false,
  });
  return {
    snapshotId: snapshot.manifest.snapshotId,
    registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
    parentSnapshotId: genesis.manifest.snapshotId,
    parentSnapshotHash: genesis.manifest.registrySnapshotHash,
    promotionStage: "staging",
    previousPromotionStage: "validation",
    approvedBy: "governance-review-44",
    approvalChainHash: "sha256-approval-chain",
    governanceSnapshotHash: snapshot.manifest.governanceHash,
    signedBy: "governance-authority-01",
    ...override,
  };
}

export function buildRegistryTrustFixture() {
  const genesis = buildRegistrySnapshotFixture({ snapshotVersion: 1, allowGenesis: true });
  const snapshot = buildRegistrySnapshotFixture({
    snapshotVersion: 2,
    parentSnapshot: genesis,
    allowGenesis: false,
  });
  const authority = buildRegistryTrustAuthorityFixture();
  const context = buildRegistryTrustContextFixture();
  const signature = createDeterministicRegistrySnapshotSignatureForTests({
    snapshotId: snapshot.manifest.snapshotId,
    registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
    signedBy: authority.authorityId,
    signingKeyId: authority.signingKeyId,
    signedAt: "2026-05-15T00:00:00.000Z",
  });
  const provenance: RegistrySnapshotProvenance = {
    snapshotId: snapshot.manifest.snapshotId,
    registrySnapshotHash: snapshot.manifest.registrySnapshotHash,
    parentSnapshotId: genesis.manifest.snapshotId,
    parentSnapshotHash: genesis.manifest.registrySnapshotHash,
    promotionStage: "staging",
    previousPromotionStage: "validation",
    approvedBy: "governance-review-44",
    approvalChainHash: "sha256-approval-chain",
    governanceSnapshotHash: snapshot.manifest.governanceHash,
    signedBy: authority.authorityId,
  };
  const authorityStore = createRegistryTrustAuthorityStore([authority]);

  return {
    snapshot,
    parentSnapshot: genesis,
    authority,
    authorityStore,
    context,
    signature,
    provenance,
  };
}
