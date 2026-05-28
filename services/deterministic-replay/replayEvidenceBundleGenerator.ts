import type { DeterministicReplayInput, ReplayEvidenceBundle } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function buildReplayEvidenceBundle(input: DeterministicReplayInput): ReplayEvidenceBundle {
  const evidenceRefs = Object.freeze([
    ...input.request.evidenceSnapshotIds,
    input.recommendationValidationResult.result.validationHash,
    input.recommendationLineageResult.artifact.lineageHash,
    input.operatorAuthorityResult.action.replayHash,
  ]);
  return Object.freeze({
    bundleId: hashReplayValue("replay-evidence-bundle-id", {
      replayId: input.request.replayId,
    }),
    recommendationId: input.request.recommendationId,
    evidenceRefs,
    evidenceHash: hashReplayValue("replay-evidence-bundle", evidenceRefs),
  });
}
