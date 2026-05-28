import { EVIDENCE_AGGREGATION_SCHEMA_VERSION } from "./evidenceAggregationContracts";
import { hashEvidenceValue } from "./evidenceHashEngine";
import { freezeEvidenceReference } from "./evidenceImmutableReferenceModel";
import type { EvidenceAggregationInput, EvidenceReference } from "./types/evidenceAggregationTypes";

function buildReference(input: Omit<EvidenceReference, "canonicalHash" | "schemaVersion">): EvidenceReference {
  const draft = {
    ...input,
    schemaVersion: EVIDENCE_AGGREGATION_SCHEMA_VERSION,
  };
  return freezeEvidenceReference({
    ...draft,
    canonicalHash: hashEvidenceValue("evidence-canonical", draft),
  });
}

export function correlateEvidenceSources(
  input: EvidenceAggregationInput,
): readonly EvidenceReference[] {
  const synthesisInput = input.recommendationSynthesisInput;
  const synthesisResult = input.recommendationSynthesisResult;
  const refs: EvidenceReference[] = [];

  for (const datum of synthesisInput.telemetry) {
    refs.push(buildReference({
      evidenceId: datum.telemetryId,
      evidenceType: "telemetry",
      sourceId: datum.source,
      sourceHash: hashEvidenceValue("evidence-telemetry-source", datum),
      collectedAt: input.startedAt,
      governanceSnapshotId: synthesisInput.recommendationValidationResult.result.governanceSnapshotId,
      replaySessionId: synthesisInput.deterministicReplayResult.result.replayId,
      integrityStatus: "verified",
      lineage: {
        parentEvidenceIds: [synthesisInput.synthesisId],
        sourceSnapshots: [synthesisInput.deterministicReplayResult.snapshot.snapshotId],
      },
    }));
  }

  refs.push(buildReference({
    evidenceId: synthesisInput.deterministicReplayResult.evidenceBundle.bundleId,
    evidenceType: "replay",
    sourceId: synthesisInput.deterministicReplayResult.result.replayId,
    sourceHash: synthesisInput.deterministicReplayResult.evidenceBundle.evidenceHash,
    collectedAt: synthesisInput.deterministicReplayResult.result.generatedAt,
    governanceSnapshotId: synthesisInput.deterministicReplayResult.governanceBinding.governanceSnapshotId,
    replaySessionId: synthesisInput.deterministicReplayResult.result.replayId,
    integrityStatus: synthesisInput.deterministicReplayResult.result.replayCertified ? "verified" : "incomplete",
    lineage: {
      parentEvidenceIds: [synthesisInput.deterministicReplayResult.result.recommendationId],
      sourceSnapshots: synthesisInput.deterministicReplayResult.immutableSnapshots.map((snapshot) => snapshot.snapshotId),
    },
  }));

  refs.push(buildReference({
    evidenceId: synthesisInput.recommendationValidationResult.evidence.evidenceId,
    evidenceType: "validation",
    sourceId: synthesisInput.recommendationValidationResult.result.recommendationId,
    sourceHash: synthesisInput.recommendationValidationResult.evidence.evidenceHash,
    collectedAt: synthesisInput.recommendationValidationResult.result.validatedAt,
    governanceSnapshotId: synthesisInput.recommendationValidationResult.result.governanceSnapshotId,
    replaySessionId: synthesisInput.recommendationValidationResult.result.replaySnapshotId,
    integrityStatus: synthesisInput.recommendationValidationResult.result.governanceValidated ? "verified" : "incomplete",
    lineage: {
      parentEvidenceIds: [synthesisInput.recommendationValidationResult.result.recommendationId],
      sourceSnapshots: [synthesisInput.recommendationValidationResult.snapshot.snapshotId],
    },
  }));

  refs.push(buildReference({
    evidenceId: synthesisInput.decisionReadinessCertificationResult.evidence.evidenceId,
    evidenceType: "governance",
    sourceId: synthesisInput.decisionReadinessCertificationResult.governanceRecord.governanceSnapshotId,
    sourceHash: synthesisInput.decisionReadinessCertificationResult.governanceRecord.governanceHash,
    collectedAt: synthesisInput.decisionReadinessCertificationResult.certification.certifiedAt,
    governanceSnapshotId: synthesisInput.decisionReadinessCertificationResult.governanceRecord.governanceSnapshotId,
    replaySessionId: synthesisInput.deterministicReplayResult.result.replayId,
    integrityStatus:
      synthesisInput.decisionReadinessCertificationResult.governanceRecord.governanceSnapshotId &&
      synthesisInput.decisionReadinessCertificationResult.governanceRecord.governanceHash
        ? "verified"
        : "incomplete",
    lineage: {
      parentEvidenceIds: [synthesisInput.decisionReadinessCertificationResult.certification.certificationId],
      sourceSnapshots: [synthesisInput.decisionReadinessCertificationResult.governanceRecord.governanceSnapshotId],
    },
  }));

  refs.push(buildReference({
    evidenceId: synthesisInput.proposalIntegrityResult.evidence.evidenceId,
    evidenceType: "integrity",
    sourceId: synthesisInput.proposalIntegrityResult.proposal.proposalId,
    sourceHash: synthesisInput.proposalIntegrityResult.evidence.evidenceHash,
    collectedAt: synthesisInput.proposalIntegrityResult.proposal.createdAt,
    governanceSnapshotId: synthesisInput.proposalIntegrityResult.proposal.governanceSnapshotId,
    replaySessionId: synthesisInput.proposalIntegrityResult.proposal.replaySnapshotId,
    integrityStatus: synthesisInput.proposalIntegrityResult.sealedRecord.immutable ? "verified" : "incomplete",
    lineage: {
      parentEvidenceIds: [synthesisInput.proposalIntegrityResult.proposal.proposalId],
      sourceSnapshots: [synthesisInput.proposalIntegrityResult.snapshot.snapshotId],
    },
  }));

  for (const policySnapshotId of synthesisInput.policySnapshotIds) {
    refs.push(buildReference({
      evidenceId: `${input.aggregationSessionId}:${policySnapshotId}`,
      evidenceType: "policy",
      sourceId: policySnapshotId,
      sourceHash: hashEvidenceValue("evidence-policy-source", policySnapshotId),
      collectedAt: input.startedAt,
      governanceSnapshotId: synthesisInput.recommendationValidationResult.result.governanceSnapshotId,
      replaySessionId: synthesisInput.deterministicReplayResult.result.replayId,
      integrityStatus: "verified",
      lineage: {
        parentEvidenceIds: [synthesisInput.synthesisId],
        sourceSnapshots: [policySnapshotId],
      },
    }));
  }

  refs.push(buildReference({
    evidenceId: synthesisInput.operatorAuthorityResult.evidence.evidenceId,
    evidenceType: "operator",
    sourceId: synthesisInput.operatorAuthorityResult.action.actionId,
    sourceHash: synthesisInput.operatorAuthorityResult.evidence.evidenceHash,
    collectedAt: synthesisInput.operatorAuthorityResult.action.propagatedAt,
    governanceSnapshotId: synthesisInput.operatorAuthorityResult.action.governanceSnapshotId,
    replaySessionId: synthesisInput.operatorAuthorityResult.action.replaySnapshotId,
    integrityStatus:
      synthesisInput.operatorAuthorityResult.action.actionType === "OVERRIDE" ? "verified" : "conflicted",
    lineage: {
      parentEvidenceIds: synthesisResult.recommendations.map((item) => item.recommendation.recommendationId),
      sourceSnapshots: [synthesisInput.operatorAuthorityResult.snapshot.snapshotId],
    },
  }));

  return Object.freeze(refs);
}
