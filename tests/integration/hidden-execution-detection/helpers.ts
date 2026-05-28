import { buildConstitutionalRecommendationValidationFixture } from "@/tests/integration/constitutional-validator/helpers";
import { buildDeterministicReplayFixture } from "@/tests/integration/deterministic-replay/helpers";
import { buildOperatorAuthorityFixture } from "@/tests/integration/operator-authority/helpers";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";
import { detectHiddenExecution } from "@/services/hidden-execution-detection/hiddenExecutionDetectionEngine";
import type {
  HiddenExecutionArtifactType,
  HiddenExecutionDetectionInput,
} from "@/services/hidden-execution-detection/types/hiddenExecutionDetectionTypes";

export function buildHiddenExecutionInput(input: {
  artifactId?: string;
  artifactType?: HiddenExecutionArtifactType;
  artifact?: unknown;
  governanceSnapshotId?: string;
  replaySnapshotId?: string;
  validatorVersion?: string;
  proposalLineageHash?: string;
  recommendationLineageHash?: string;
  replayHash?: string;
  metadata?: Readonly<Record<string, unknown>>;
} = {}): HiddenExecutionDetectionInput {
  return Object.freeze({
    artifactId: input.artifactId ?? "hidden-execution-artifact-1",
    artifactType: input.artifactType ?? "recommendation",
    artifact: Object.prototype.hasOwnProperty.call(input, "artifact")
      ? input.artifact
      : Object.freeze({
        summary: "Purely advisory recommendation for operator review.",
        executionAuthorized: false,
        advisoryOnly: true,
      }),
    scannedAt: "2026-05-19T15:00:00.000Z",
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    validatorVersion: input.validatorVersion ?? "validator-v1",
    proposalLineageHash: input.proposalLineageHash,
    recommendationLineageHash: input.recommendationLineageHash,
    replayHash: input.replayHash,
    metadata: input.metadata,
  });
}

export function buildHiddenExecutionFixture(overrides: Partial<HiddenExecutionDetectionInput> = {}) {
  const input = buildHiddenExecutionInput(overrides);
  return Object.freeze({
    input,
    result: detectHiddenExecution(input),
  });
}

export function buildRecommendationArtifactFixture() {
  const validationFixture = buildConstitutionalRecommendationValidationFixture();
  return buildHiddenExecutionFixture({
    artifactId: validationFixture.result.result.recommendationId,
    artifactType: "recommendation",
    artifact: validationFixture.result.result,
    governanceSnapshotId: validationFixture.result.result.governanceSnapshotId,
    replaySnapshotId: validationFixture.result.result.replaySnapshotId,
    recommendationLineageHash: validationFixture.result.lineage.lineageHash,
    replayHash: validationFixture.result.result.replayHash,
  });
}

export function buildProposalArtifactFixture() {
  const proposalFixture = buildProposalIntegrityFixture();
  return buildHiddenExecutionFixture({
    artifactId: proposalFixture.result.proposal.proposalId,
    artifactType: "proposal",
    artifact: proposalFixture.result.proposal,
    governanceSnapshotId: proposalFixture.result.proposal.governanceSnapshotId,
    replaySnapshotId: proposalFixture.result.proposal.replaySnapshotId,
    proposalLineageHash: proposalFixture.result.lineage.lineageHash,
    recommendationLineageHash: proposalFixture.result.lineageBinding.recommendationLineageHash,
    replayHash: proposalFixture.result.proposal.replayHash,
  });
}

export function buildReplayArtifactFixture() {
  const replayFixture = buildDeterministicReplayFixture();
  return buildHiddenExecutionFixture({
    artifactId: replayFixture.result.result.replayId,
    artifactType: "replay",
    artifact: replayFixture.result.result,
    governanceSnapshotId: replayFixture.input.request.governanceSnapshotId,
    replaySnapshotId: replayFixture.input.request.replaySnapshotId,
    recommendationLineageHash: replayFixture.input.recommendationLineageResult.lineage.lineageHash,
    replayHash: replayFixture.result.result.replayHash,
  });
}

export function buildOperatorAuthorityArtifactFixture() {
  const operatorFixture = buildOperatorAuthorityFixture();
  return buildHiddenExecutionFixture({
    artifactId: operatorFixture.result.action.actionId,
    artifactType: "operator_authority",
    artifact: operatorFixture.result,
    governanceSnapshotId: operatorFixture.result.action.governanceSnapshotId,
    replaySnapshotId: operatorFixture.result.action.replaySnapshotId,
    replayHash: operatorFixture.result.action.replayHash,
  });
}
