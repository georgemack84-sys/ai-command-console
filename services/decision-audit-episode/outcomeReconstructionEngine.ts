import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function reconstructEpisodeOutcome(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: `outcome:${input.deterministicReplayResult.result.replayId}`,
    snapshotType: "outcome",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-outcome", {
      replayId: input.deterministicReplayResult.result.replayId,
      replayCertified: input.deterministicReplayResult.result.replayCertified,
      hiddenExecutionBlocked: input.hiddenExecutionDetectionResult.report.blocked,
      continuityInvalidated: input.operatorAuthorityResult.suppression.continuityInvalidated,
    }),
    lineageHash: input.deterministicReplayResult.lineage.lineageHash,
    immutable: true as const,
  });
}
