import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function archiveGovernanceSnapshot(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
    snapshotType: "governance",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-governance-snapshot", {
      governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
      governanceHash: input.deterministicReplayResult.governanceBinding.governanceHash,
    }),
    lineageHash: input.recommendationValidationResult.lineage.lineageHash,
    immutable: true as const,
  });
}
