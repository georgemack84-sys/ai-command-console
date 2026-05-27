import type { ConstitutionalSnapshotBuildInput, SnapshotLineageView } from "@/types/deterministic-snapshot-engine";
import { hashSnapshotValue } from "./snapshotHasher";

export function buildSnapshotLineage(input: ConstitutionalSnapshotBuildInput): SnapshotLineageView {
  const replayAncestryHash = input.sourceArtifacts.replay?.lineage.replayBindingHash
    ?? input.sourceArtifacts.treaty?.manifest.replayBindingHash
    ?? "";
  const governanceAncestryHash = input.sourceArtifacts.policyExplanation?.governanceReasoning.governanceEvidenceHash
    ?? input.sourceArtifacts.treaty?.manifest.governanceSnapshotHash
    ?? "";
  const authorizationAncestryHash = input.sourceArtifacts.authorization?.authorityHash
    ?? input.sourceArtifacts.treaty?.manifest.approvalChainHash
    ?? "";
  const revocationAncestryHash = input.sourceArtifacts.revocation
    ? hashSnapshotValue("snapshot-revocation-ancestry", input.sourceArtifacts.revocation)
    : hashSnapshotValue("snapshot-revocation-ancestry", {
      revocationEligible: input.revocationEligible ?? true,
      revocationStatus: input.sourceArtifacts.treaty?.manifest.preExecutionRevocationStatus,
    });

  const edges = [
    input.parentSnapshotId ? {
      relation: "parent" as const,
      sourceId: input.parentSnapshotId,
      targetId: input.lineageId,
      hash: hashSnapshotValue("snapshot-lineage-parent", {
        parentSnapshotId: input.parentSnapshotId,
        lineageId: input.lineageId,
      }),
    } : undefined,
    input.branchId ? {
      relation: "branch" as const,
      sourceId: input.branchId,
      targetId: input.lineageId,
      hash: hashSnapshotValue("snapshot-lineage-branch", {
        branchId: input.branchId,
        lineageId: input.lineageId,
      }),
    } : undefined,
    replayAncestryHash ? {
      relation: "replay" as const,
      sourceId: replayAncestryHash,
      targetId: input.lineageId,
      hash: hashSnapshotValue("snapshot-lineage-replay", {
        replayAncestryHash,
        lineageId: input.lineageId,
      }),
    } : undefined,
    governanceAncestryHash ? {
      relation: "governance" as const,
      sourceId: governanceAncestryHash,
      targetId: input.lineageId,
      hash: hashSnapshotValue("snapshot-lineage-governance", {
        governanceAncestryHash,
        lineageId: input.lineageId,
      }),
    } : undefined,
    authorizationAncestryHash ? {
      relation: "authorization" as const,
      sourceId: authorizationAncestryHash,
      targetId: input.lineageId,
      hash: hashSnapshotValue("snapshot-lineage-authorization", {
        authorizationAncestryHash,
        lineageId: input.lineageId,
      }),
    } : undefined,
    revocationAncestryHash ? {
      relation: "revocation" as const,
      sourceId: revocationAncestryHash,
      targetId: input.lineageId,
      hash: hashSnapshotValue("snapshot-lineage-revocation", {
        revocationAncestryHash,
        lineageId: input.lineageId,
      }),
    } : undefined,
  ].filter((value): value is NonNullable<typeof value> => Boolean(value));

  return Object.freeze({
    lineageId: input.lineageId,
    parentSnapshotId: input.parentSnapshotId,
    branchId: input.branchId,
    replayAncestryHash,
    governanceAncestryHash,
    authorizationAncestryHash,
    revocationAncestryHash,
    edges: Object.freeze(edges),
    valid: Boolean(replayAncestryHash && governanceAncestryHash && authorizationAncestryHash && revocationAncestryHash),
  });
}
