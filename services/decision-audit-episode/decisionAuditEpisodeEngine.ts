import { detectEpisodeAntiEmergenceRisks } from "./antiEmergenceReplayDetector";
import { recordApprovalDependencies } from "./approvalDependencyRecorder";
import { exportDecisionAuditEpisode } from "./constitutionalEpisodeExporter";
import { recordContextResolution } from "./contextResolutionRecorder";
import { appendDecisionEpisodeLedger, appendDecisionEpisodeLineage } from "./episodeLineageStore";
import { archiveGovernanceSnapshot } from "./governanceSnapshotArchiver";
import { validateImmutableEpisode } from "./immutableEpisodeValidator";
import { reconstructEpisodeOutcome } from "./outcomeReconstructionEngine";
import { recordOperatorVisibility } from "./operatorVisibilityRecorder";
import { buildRiskClassificationSnapshot, buildReplayEpisodeObservation } from "./decisionEpisodeReplayEngine";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";
import { DECISION_AUDIT_EPISODE_POLICY } from "./decisionEpisodePolicy";
import { recordProposalLineage } from "./proposalLineageRecorder";
import { validateReconstructionBoundary } from "./reconstructionBoundaryValidator";
import { validateReplayAuthorityBoundary } from "./replayAuthorityBoundary";
import { detectDecisionEpisodeReplayDrift } from "./replayDriftDetector";
import { buildReplayFreezeErrors } from "./replayStateFreezeEngine";
import { shouldDecisionEpisodeFailClosed } from "./decisionEpisodeFailClosedController";
import type {
  DecisionAuditEpisode,
  DecisionAuditEpisodeError,
  DecisionAuditEpisodeInput,
  DecisionAuditEpisodeLineageEntry,
  DecisionAuditEpisodeMetrics,
  DecisionAuditEpisodeResult,
  EpisodeSnapshotRecord,
} from "./types/decisionAuditEpisodeTypes";

function freezeErrors(items: readonly DecisionAuditEpisodeError[]): readonly DecisionAuditEpisodeError[] {
  return Object.freeze([...items]);
}

function buildMetrics(input: {
  errors: readonly DecisionAuditEpisodeError[];
  hiddenExecutionBlocked: boolean;
  governancePreserved: boolean;
  lineagePreserved: boolean;
}): DecisionAuditEpisodeMetrics {
  const metrics = {
    replayFreezeTriggered: input.errors.some((error) => error.code.includes("REPLAY")) ? 1 : 0,
    failClosedTriggered: input.errors.length > 0 ? 1 : 0,
    hiddenExecutionDetected: input.hiddenExecutionBlocked ? 1 : 0,
    governancePreserved: input.governancePreserved ? 1 : 0,
    lineageIntegrityPreserved: input.lineagePreserved ? 1 : 0,
    metricsHash: "",
  };
  return Object.freeze({
    ...metrics,
    metricsHash: hashDecisionEpisodeValue("decision-audit-episode-metrics", metrics),
  });
}

export function buildDecisionAuditEpisode(input: DecisionAuditEpisodeInput): DecisionAuditEpisodeResult {
  const observationSnapshot = buildReplayEpisodeObservation(input);
  const contextSnapshot = recordContextResolution(input);
  const governanceSnapshot = archiveGovernanceSnapshot(input);
  const riskSnapshot = buildRiskClassificationSnapshot(input);
  const proposalSnapshot = recordProposalLineage(input);
  const approvalSnapshot = recordApprovalDependencies(input);
  const visibilitySnapshot = recordOperatorVisibility(input);
  const outcomeSnapshot = reconstructEpisodeOutcome(input);
  const snapshots: readonly EpisodeSnapshotRecord[] = Object.freeze([
    observationSnapshot,
    contextSnapshot,
    governanceSnapshot,
    riskSnapshot,
    proposalSnapshot,
    approvalSnapshot,
    visibilitySnapshot,
    outcomeSnapshot,
  ]);

  const errors = freezeErrors([
    ...buildReplayFreezeErrors(input),
    ...detectEpisodeAntiEmergenceRisks(input),
    ...validateReconstructionBoundary(input),
    ...validateReplayAuthorityBoundary(input),
    ...detectDecisionEpisodeReplayDrift(input),
  ]);

  const provisionalEpisode: DecisionAuditEpisode = Object.freeze({
    episodeId: input.episodeId,
    createdAt: input.createdAt,
    observationSnapshotId: observationSnapshot.snapshotId,
    contextResolutionSnapshotId: contextSnapshot.snapshotId,
    governanceSnapshotId: governanceSnapshot.snapshotId,
    riskClassificationSnapshotId: riskSnapshot.snapshotId,
    proposalSnapshotId: proposalSnapshot.snapshotId,
    approvalDependencySnapshotId: approvalSnapshot.snapshotId,
    operatorVisibilitySnapshotId: visibilitySnapshot.snapshotId,
    outcomeSnapshotId: outcomeSnapshot.snapshotId,
    lineageHash: "",
    governanceHash: governanceSnapshot.snapshotHash,
    proposalHash: input.proposalIntegrityResult.proposal.proposalHash,
    replayHash: input.deterministicReplayResult.result.replayHash,
    auditHash: "",
    constitutionalVersion: input.constitutionalVersion,
    replayCertified: input.deterministicReplayResult.result.replayCertified,
    executionAuthorized: false as const,
  });

  const lineageEntry: DecisionAuditEpisodeLineageEntry = Object.freeze({
    entryId: hashDecisionEpisodeValue("decision-audit-episode-lineage-entry-id", {
      episodeId: input.episodeId,
      createdAt: input.createdAt,
    }),
    episodeId: input.episodeId,
    recommendationId: input.deterministicReplayResult.result.recommendationId,
    replayCertified: input.deterministicReplayResult.result.replayCertified,
    createdAt: input.createdAt,
    deterministicHash: hashDecisionEpisodeValue("decision-audit-episode-lineage-entry", {
      episodeId: input.episodeId,
      recommendationId: input.deterministicReplayResult.result.recommendationId,
      replayCertified: input.deterministicReplayResult.result.replayCertified,
    }),
  });
  const lineage = appendDecisionEpisodeLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });

  const episodeBase = {
    ...provisionalEpisode,
    lineageHash: lineage.lineageHash,
    auditHash: "",
  };
  const auditHash = hashDecisionEpisodeValue("decision-audit-episode-audit", {
    episodeId: input.episodeId,
    lineageHash: lineage.lineageHash,
    replayHash: input.deterministicReplayResult.result.replayHash,
    proposalHash: input.proposalIntegrityResult.proposal.proposalHash,
  });
  const episode: DecisionAuditEpisode = Object.freeze({
    ...episodeBase,
    auditHash,
  });

  const auditLedger = appendDecisionEpisodeLedger({
    existing: appendDecisionEpisodeLedger({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "decision.audit.episode.reconstructed",
        episodeId: input.episodeId,
        replayHash: episode.replayHash,
        auditHash,
      }),
      scope: "decision-audit-episode",
    }),
    payload: Object.freeze({
      event: shouldDecisionEpisodeFailClosed(errors) ? "decision.audit.episode.failed_closed" : "decision.audit.episode.certified",
      episodeId: input.episodeId,
      lineageHash: lineage.lineageHash,
      governanceHash: episode.governanceHash,
      proposalHash: episode.proposalHash,
    }),
    scope: "decision-audit-episode-audit",
  });

  const immutableErrors = validateImmutableEpisode({
    snapshots,
    lineage,
    auditLedger,
  });
  const finalErrors = freezeErrors([...errors, ...immutableErrors]);
  const metrics = buildMetrics({
    errors: finalErrors,
    hiddenExecutionBlocked: input.hiddenExecutionDetectionResult.report.blocked,
    governancePreserved: input.recommendationValidationResult.result.governanceValidated,
    lineagePreserved: lineage.lineageHash.length > 0,
  });
  const exportRecord = exportDecisionAuditEpisode({
    episodeId: input.episodeId,
    replayHash: episode.replayHash,
    auditHash,
    lineageHash: lineage.lineageHash,
  });

  return Object.freeze({
    episode,
    snapshots,
    lineage,
    auditLedger,
    metrics,
    exportRecord,
    errors: finalErrors,
    warnings: Object.freeze(
      shouldDecisionEpisodeFailClosed(finalErrors)
        ? ["Decision audit episode failed closed rather than reconstruct synthetic historical state."]
        : ["Decision audit episode reconstructed immutable historical truth without operational authority."],
    ),
    deterministicHash: hashDecisionEpisodeValue("decision-audit-episode-result", {
      episode,
      snapshotHashes: snapshots.map((snapshot) => snapshot.snapshotHash),
      lineageHash: lineage.lineageHash,
      metricsHash: metrics.metricsHash,
      exportHash: exportRecord.exportHash,
      errorCodes: finalErrors.map((error) => error.code),
      policy: DECISION_AUDIT_EPISODE_POLICY,
    }),
    derivedOnly: true as const,
  });
}
