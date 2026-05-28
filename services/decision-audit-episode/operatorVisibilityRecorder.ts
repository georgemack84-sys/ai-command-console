import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function recordOperatorVisibility(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: `visibility:${input.operatorAuthorityResult.action.actionId}`,
    snapshotType: "operator_visibility",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-visibility", {
      actionId: input.operatorAuthorityResult.action.actionId,
      suppressionHash: input.operatorAuthorityResult.suppression.suppressionHash,
      operatorReviewRequired: input.operatorAuthorityResult.action.operatorReviewRequired,
      hiddenExecutionBlocked: input.hiddenExecutionDetectionResult.report.blocked,
    }),
    lineageHash: input.operatorAuthorityResult.lineage.lineageHash,
    immutable: true as const,
  });
}
