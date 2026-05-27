import type { AuthorizationSnapshot, ConstitutionalSnapshotBuildInput } from "@/types/deterministic-snapshot-engine";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";

export function captureAuthorizationSnapshot(
  input: ConstitutionalSnapshotBuildInput,
  authorization: AuthorizationSnapshot,
): unknown {
  return canonicalizeSnapshotValue({
    kind: "authorization",
    authorization,
    validationStatus: input.sourceArtifacts.validation?.result.status,
    treatyApprovalChainHash: input.sourceArtifacts.treaty?.manifest.approvalChainHash,
    sourceRefs: input.sourceArtifacts.sourceRefs ?? [],
  });
}
