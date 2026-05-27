import type { DecisionAuditEpisodeInput, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function buildReplayEpisodeObservation(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: `observation:${input.decisionIntentBoundaryResult.artifact.intentId}`,
    snapshotType: "observation",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-observation", {
      intentId: input.decisionIntentBoundaryResult.artifact.intentId,
      evidenceLineage: input.decisionIntentBoundaryResult.artifact.evidenceLineage,
      summary: input.decisionIntentBoundaryResult.artifact.summary,
    }),
    lineageHash: input.decisionIntentBoundaryResult.lineage.lineageHash,
    immutable: true as const,
  });
}

export function buildRiskClassificationSnapshot(input: DecisionAuditEpisodeInput): EpisodeSnapshotRecord {
  return Object.freeze({
    snapshotId: `risk:${input.decisionIntentBoundaryResult.artifact.intentId}`,
    snapshotType: "risk_classification",
    snapshotHash: hashDecisionEpisodeValue("decision-episode-risk", {
      level: input.decisionIntentBoundaryResult.artifact.risk.level,
      factors: input.decisionIntentBoundaryResult.artifact.risk.factors,
      confidenceScore: input.decisionIntentBoundaryResult.artifact.confidence.score,
    }),
    lineageHash: input.recommendationLineageResult.lineage.lineageHash,
    immutable: true as const,
  });
}
