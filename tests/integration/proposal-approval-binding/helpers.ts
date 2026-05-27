import { hashApprovalValue } from "@/services/proposal-approval-binding/approvalHashEngine";
import { bindProposalApproval } from "@/services/proposal-approval-binding/approvalBindingEngine";
import type {
  ApprovalDependency,
  ApprovalOverrideRequest,
  ApprovalValidityWindow,
  ProposalApprovalBindingInput,
} from "@/services/proposal-approval-binding/types/proposalApprovalBindingTypes";
import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

function buildApprovals(input: {
  replayInput: ReturnType<typeof buildProposalReplayFixture>["input"];
  replayResult: ReturnType<typeof buildProposalReplayFixture>["result"];
}): readonly ApprovalDependency[] {
  return Object.freeze(
    input.replayInput.proposalIntegrityResult.proposal.approvalDependencyIds.map((approvalId, index) => {
      const core = {
        approvalId,
        proposalId: input.replayInput.proposalIntegrityResult.proposal.proposalId,
        approverId: `approver-${index + 1}`,
        approverRole: index % 2 === 0 ? "operator" : "governance",
        dependencySnapshotId: approvalId,
        governanceSnapshotId: input.replayInput.proposalGovernanceBindingResult.binding.governanceSnapshotId,
        authorityBoundaryId: input.replayInput.proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId,
        replayLineageId: input.replayResult.lineage.replayLineageHash,
        grantedAt: input.replayInput.replayedAt,
        immutable: true as const,
      };

      return Object.freeze({
        ...core,
        dependencyHash: hashApprovalValue("fixture-approval-dependency", core),
      });
    }),
  );
}

function buildValidityWindow(input: ReturnType<typeof buildProposalReplayFixture>["input"]): ApprovalValidityWindow {
  const core = {
    validityWindowId: `approval-validity-window:${input.proposalIntegrityResult.proposal.proposalId}`,
    proposalId: input.proposalIntegrityResult.proposal.proposalId,
    validFrom: "2026-05-21T06:00:00.000Z",
    validUntil: "2026-12-31T23:59:59.000Z",
    ambiguous: false,
    immutable: true as const,
  };

  return Object.freeze({
    ...core,
    windowHash: hashApprovalValue("fixture-approval-validity-window", core),
  });
}

export function buildProposalApprovalBindingFixture(
  overrides: Partial<ProposalApprovalBindingInput> = {},
) {
  const replayFixture = buildProposalReplayFixture();

  const baseInput = Object.freeze({
    approvalBindingRunId: "proposal-approval-binding-run-1",
    evaluatedAt: "2026-05-21T07:00:00.000Z",
    constitutionalVersion: "5.2F",
    proposalStateEngineResult: replayFixture.input.proposalStateEngineResult,
    proposalFreezeResult: replayFixture.input.proposalFreezeResult,
    proposalRevocationResult: Object.freeze({
      ...replayFixture.input.proposalRevocationResult,
      status: "NOT_REVOKED" as const,
    }),
    proposalGovernanceBindingResult: replayFixture.input.proposalGovernanceBindingResult,
    proposalReplayResult: replayFixture.result,
    proposalIntegrityResult: replayFixture.input.proposalIntegrityResult,
    constitutionalEnforcementResult: replayFixture.input.constitutionalEnforcementResult,
    approvals: buildApprovals({
      replayInput: replayFixture.input,
      replayResult: replayFixture.result,
    }),
    validityWindow: buildValidityWindow(replayFixture.input),
    metadata: Object.freeze({
      containmentMode: "approval-binding-only",
    }),
  } satisfies ProposalApprovalBindingInput);

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ProposalApprovalBindingInput;

  return Object.freeze({
    replayFixture,
    governanceFixture: replayFixture.governanceFixture,
    freezeFixture: replayFixture.freezeFixture,
    revocationFixture: replayFixture.revocationFixture,
    stateFixture: replayFixture.stateFixture,
    input,
    result: bindProposalApproval(input),
  });
}

export type { ApprovalOverrideRequest };
