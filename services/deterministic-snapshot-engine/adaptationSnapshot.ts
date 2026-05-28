import type { AdaptationEnvelopeSnapshot, ConstitutionalSnapshotBuildInput } from "@/types/deterministic-snapshot-engine";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";

export function captureAdaptationSnapshot(
  input: ConstitutionalSnapshotBuildInput,
  adaptation: AdaptationEnvelopeSnapshot,
): unknown {
  return canonicalizeSnapshotValue({
    kind: "adaptation",
    adaptation,
    capturedAsLegalityEnvelopeOnly: true,
    sourceRefs: input.sourceArtifacts.sourceRefs ?? [],
  });
}
