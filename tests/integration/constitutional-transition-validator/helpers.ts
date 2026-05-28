import { buildDecisionAuditEpisodeFixture } from "@/tests/integration/decision-audit-episode/helpers";
import { validateConstitutionalTransition } from "@/services/constitutional-transition-validator/constitutionalTransitionValidator";
import type {
  ConstitutionalTransitionInput,
  ConstitutionalTransitionLedgerEntry,
  ConstitutionalTransitionLineageLedger,
} from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

export function buildConstitutionalTransitionFixture(
  overrides: Partial<ConstitutionalTransitionInput> = {},
) {
  const episodeFixture = buildDecisionAuditEpisodeFixture();
  const baseInput = {
    transitionId: "constitutional-transition-1",
    entityId: episodeFixture.input.recommendationValidationResult.result.recommendationId,
    entityType: "recommendation" as const,
    sourceState: "validated",
    targetState: "audited",
    transitionReason: "Historical audit export after replay-certified validation.",
    governanceBasisId: episodeFixture.input.recommendationValidationResult.result.governanceSnapshotId,
    authorityBasisId: episodeFixture.input.operatorAuthorityResult.action.actionId,
    replayLineageId: episodeFixture.input.deterministicReplayResult.lineage.lineageHash,
    approvalLineageIds: [
      episodeFixture.input.proposalIntegrityResult.proposal.approvalDependencyIds[0] ?? "approval-dependency-missing",
    ],
    auditLineageId: episodeFixture.input.decisionIntentBoundaryResult.lineage.lineageHash,
    policySnapshotId: episodeFixture.input.proposalIntegrityResult.governanceBinding.deterministicHash,
    replaySnapshotId: episodeFixture.input.deterministicReplayResult.result.replayId,
    operatorVisibilityRequired: true,
    overrideCompatible: true,
    constitutionalVersion: "5.0I",
    createdAt: "2026-05-20T15:00:00.000Z",
    validatorVersionId: "validator-v1",
    decisionAuditEpisodeResult: episodeFixture.result,
    deterministicReplayResult: episodeFixture.input.deterministicReplayResult,
    hiddenExecutionDetectionResult: episodeFixture.input.hiddenExecutionDetectionResult,
    operatorAuthorityResult: episodeFixture.input.operatorAuthorityResult,
    recommendationValidationResult: episodeFixture.input.recommendationValidationResult,
    proposalIntegrityResult: episodeFixture.input.proposalIntegrityResult,
  } satisfies ConstitutionalTransitionInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConstitutionalTransitionInput;

  return Object.freeze({
    input,
    result: validateConstitutionalTransition({
      ...input,
      existingLineage: overrides.existingLineage as ConstitutionalTransitionLineageLedger | undefined,
      existingAuditLedger: overrides.existingAuditLedger as readonly ConstitutionalTransitionLedgerEntry[] | undefined,
    }),
  });
}
