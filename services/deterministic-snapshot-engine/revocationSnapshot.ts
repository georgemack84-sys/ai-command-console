import type { ConstitutionalSnapshotBuildInput, RevocationSnapshot } from "@/types/deterministic-snapshot-engine";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";

export function captureRevocationSnapshot(
  input: ConstitutionalSnapshotBuildInput,
  revocation: RevocationSnapshot,
): unknown {
  return canonicalizeSnapshotValue({
    kind: "revocation",
    revocation,
    treatyRevocationStatus: input.sourceArtifacts.treaty?.manifest.preExecutionRevocationStatus,
    authorityHash: input.sourceArtifacts.authorization?.authorityHash,
    sourceRefs: input.sourceArtifacts.sourceRefs ?? [],
  });
}
