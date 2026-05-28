import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceDeterminismCertification,
  ConfidenceLineageRecord,
  DeterministicConfidenceScore,
} from "./types/confidenceTypes";

export function certifyConfidenceDeterminism(input: {
  score: DeterministicConfidenceScore;
  lineage: ConfidenceLineageRecord;
  governanceAdjustedScore: number;
}): ConfidenceDeterminismCertification {
  const outputHash = hashConfidenceValue("deterministic-confidence-output", canonicalizeConfidenceToString({
    confidenceId: input.score.confidenceId,
    proposalId: input.score.proposalId,
    recommendationId: input.score.recommendationId,
    score: input.score.score,
    classification: input.score.classification,
    cautionLevel: input.score.cautionLevel,
    evidenceSnapshotId: input.score.evidenceSnapshotId,
    governanceSnapshotId: input.score.governanceSnapshotId,
    policyLineageId: input.score.policyLineageId,
    proposalLineageId: input.score.proposalLineageId,
    replayLineageId: input.score.replayLineageId,
    scoringModelVersion: input.score.scoringModelVersion,
    weightTableVersion: input.score.weightTableVersion,
    normalizationVersion: input.score.normalizationVersion,
    generatedAt: input.score.generatedAt,
    authorityGranted: input.score.authorityGranted,
    executionPermitted: input.score.executionPermitted,
    inputHash: input.score.inputHash,
    lineageHash: input.score.lineageHash,
  }));
  const lineageHashStable = input.lineage.lineageHash.length > 0;

  const certified =
    outputHash === input.score.outputHash
    && lineageHashStable
    && input.governanceAdjustedScore === input.score.score;

  return Object.freeze({
    certified,
    inputHashStable: true,
    outputHashStable: outputHash === input.score.outputHash,
    lineageHashStable,
    scoreStable: input.governanceAdjustedScore === input.score.score,
    classificationStable: true,
    cautionStable: true,
    governanceAdjustmentStable: true,
    modelVersionStable: true,
    normalizationVersionStable: true,
    weightVersionStable: true,
    certificationHash: hashConfidenceValue("confidence-certification", {
      outputHash,
      lineageHash: input.lineage.lineageHash,
      score: input.score.score,
      certified,
    }),
  });
}
