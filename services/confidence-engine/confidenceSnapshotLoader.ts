import { resolveConfidenceGovernanceSnapshot } from "./confidenceGovernanceSnapshotRegistry";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceSnapshotBundle,
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

export function loadConfidenceSnapshots(
  input: DeterministicConfidenceInput,
): {
  snapshotBundle: ConfidenceSnapshotBundle;
  errors: readonly DeterministicConfidenceError[];
} {
  const errors: DeterministicConfidenceError[] = [];
  const governance = resolveConfidenceGovernanceSnapshot(input);
  errors.push(...governance.errors);

  const evidenceSnapshotId = input.proposalIntegrityResult.snapshot.snapshotId;
  if (!evidenceSnapshotId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_EVIDENCE_SNAPSHOT_MISSING",
      message: "Confidence scoring requires an immutable evidence snapshot id.",
      path: "proposalIntegrityResult.snapshot.snapshotId",
    });
  }

  const replayLineageId = input.proposalReplayResult.lineage.replayLineageHash;
  if (!replayLineageId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_REPLAY_LINEAGE_MISSING",
      message: "Confidence scoring requires immutable replay lineage.",
      path: "proposalReplayResult.lineage.replayLineageHash",
    });
  }

  const proposalLineageId = input.proposalStateEngineResult.lineage.lineageId;
  if (!proposalLineageId) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_PROPOSAL_LINEAGE_CORRUPTED",
      message: "Confidence scoring requires immutable proposal lineage.",
      path: "proposalStateEngineResult.lineage.lineageId",
    });
  }

  const bundleCore = {
    evidenceSnapshotId,
    governanceSnapshotId: governance.governanceSnapshotId,
    policyLineageId: governance.policyLineageId,
    proposalLineageId,
    replayLineageId,
    authorityBoundaryId: input.proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId,
    approvalRequirementSetId: input.proposalGovernanceBindingResult.approvalRequirementBinding.approvalRequirementSetId,
    replayId: input.proposalReplayResult.replay.replayId,
    scoringModelVersion: input.scoringModelVersion,
    weightTableVersion: input.weightTableVersion,
    normalizationVersion: input.normalizationVersion,
  };

  const snapshotBundle = Object.freeze({
    ...bundleCore,
    snapshotHash: hashConfidenceValue("confidence-snapshot-bundle", bundleCore),
  } satisfies ConfidenceSnapshotBundle);

  return {
    snapshotBundle,
    errors: Object.freeze(errors),
  };
}
