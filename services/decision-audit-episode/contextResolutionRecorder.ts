import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function recordContextResolution(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: `context:${input.decisionIntentBoundaryResult.artifact.intentId}`,
    snapshotType: "context_resolution",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-context", {
      summary: input.decisionIntentBoundaryResult.artifact.summary,
      governanceLineage: input.decisionIntentBoundaryResult.artifact.governanceLineage,
      replayLineage: input.decisionIntentBoundaryResult.artifact.replayLineage,
    }),
    lineageHash: input.decisionIntentBoundaryResult.lineage.lineageHash,
    immutable: true as const,
  });
}
