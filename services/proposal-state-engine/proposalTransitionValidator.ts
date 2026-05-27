import { validateProposalFreezeState } from "./proposalFreezeStateValidator";
import { validateProposalLineageIntegrity } from "./proposalLineageIntegrityValidator";
import { isProposalTransitionAllowed } from "./proposalTransitionMatrix";
import { validateProposalReplayAdmissibility } from "./proposalReplayAdmissibilityValidator";
import { validateProposalRevocationState } from "./proposalRevocationStateValidator";
import type {
  GovernanceBindingRecord,
  ProposalReplayAdmissibilityRecord,
  ProposalStateEngineInput,
  ProposalStateError,
} from "./types/proposalStateTypes";

const AMBIGUOUS_PATTERNS = [
  "automatic",
  "auto-",
  "retry",
  "schedule",
  "cron",
  "queue",
  "dispatch",
  "execute",
  "orchestrate",
  "worker",
  "self-heal",
  "self-correct",
  "infer",
  "implicitly",
  "autonomous",
  "without review",
  "grant authority",
] as const;

export function validateProposalTransition(input: {
  engineInput: ProposalStateEngineInput;
  governanceBinding: GovernanceBindingRecord;
  replayAdmissibility: ProposalReplayAdmissibilityRecord;
}): readonly ProposalStateError[] {
  const { engineInput } = input;
  const transition = engineInput.transition;
  const errors: ProposalStateError[] = [];

  errors.push(...validateProposalLineageIntegrity({
    proposalId: transition.proposalId,
    currentState: engineInput.currentState,
    existingLineage: engineInput.existingLineage,
  }));

  if (transition.sourceState !== engineInput.currentState) {
    errors.push({
      code: "PROPOSAL_STATE_SOURCE_MISMATCH",
      message: "Transition source state does not match the declared current state.",
      path: "transition.sourceState",
    });
  }
  if (!isProposalTransitionAllowed(transition.sourceState, transition.targetState)) {
    errors.push({
      code: "PROPOSAL_STATE_TARGET_ILLEGAL",
      message: "Target lifecycle state is illegal for the declared source state.",
      path: "transition.targetState",
    });
  }

  if (!transition.governanceAuthorityId || !transition.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_STATE_GOVERNANCE_BINDING_MISSING",
      message: "Transition must explicitly declare governance authority and governance snapshot.",
      path: "transition.governanceSnapshotId",
    });
  }
  if (!transition.replayLineageId || transition.replayLineageId !== input.replayAdmissibility.replayLineageId) {
    errors.push({
      code: "PROPOSAL_STATE_REPLAY_LINEAGE_MISSING",
      message: "Transition replay lineage is missing or not replay-admissible.",
      path: "transition.replayLineageId",
    });
  }

  const approvalRequired = transition.targetState === "reviewed"
    || transition.targetState === "approved"
    || transition.targetState === "denied";
  const expectedApprovalLineageId = engineInput.proposalIntegrityResult.approvalBinding.approvalHash;
  if (approvalRequired && !transition.approvalLineageId) {
    errors.push({
      code: "PROPOSAL_STATE_APPROVAL_LINEAGE_MISSING",
      message: "Approval lineage is required for reviewed, approved, or denied transitions.",
      path: "transition.approvalLineageId",
    });
  } else if (transition.approvalLineageId && transition.approvalLineageId !== expectedApprovalLineageId) {
    errors.push({
      code: "PROPOSAL_STATE_APPROVAL_LINEAGE_MISSING",
      message: "Approval lineage does not match the immutable proposal approval lineage.",
      path: "transition.approvalLineageId",
    });
  }

  const expectedDependencyLineageId = engineInput.proposalIntegrityResult.lineageBinding.recommendationLineageHash;
  if (engineInput.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0) {
    if (!transition.dependencyLineageId || transition.dependencyLineageId !== expectedDependencyLineageId) {
      errors.push({
        code: "PROPOSAL_STATE_DEPENDENCY_LINEAGE_INVALID",
        message: "Dependency lineage is missing or does not match the immutable proposal lineage binding.",
        path: "transition.dependencyLineageId",
      });
    }
  }

  if (!transition.auditLineageId) {
    errors.push({
      code: "PROPOSAL_STATE_AUDIT_APPEND_FAILED",
      message: "Audit lineage identifier is required for append-only transition recording.",
      path: "transition.auditLineageId",
    });
  }

  errors.push(
    ...validateProposalFreezeState({
      currentState: engineInput.currentState,
      targetState: transition.targetState,
    }),
    ...validateProposalRevocationState({
      currentState: engineInput.currentState,
      targetState: transition.targetState,
    }),
  );

  if (engineInput.currentState === "revoked") {
    errors.push({
      code: "PROPOSAL_STATE_REVOKED",
      message: "Revoked proposals remain operator-blocked except for archival.",
      path: "currentState",
    });
  }
  if (engineInput.currentState === "archived") {
    errors.push({
      code: "PROPOSAL_STATE_ARCHIVED",
      message: "Archived proposals are immutable historical records.",
      path: "currentState",
    });
  }

  const reason = transition.reason.toLowerCase();
  for (const pattern of AMBIGUOUS_PATTERNS) {
    if (reason.includes(pattern)) {
      errors.push({
        code: "PROPOSAL_STATE_AMBIGUOUS_TRANSITION",
        message: `Transition reason contains forbidden or inferred semantic: "${pattern}".`,
        path: "transition.reason",
      });
    }
  }

  if (transition.requestedBy === "proposal-system" && transition.targetState === "approved") {
    errors.push({
      code: "PROPOSAL_STATE_AMBIGUOUS_TRANSITION",
      message: "Proposal-system initiated approval would imply hidden autonomy.",
      path: "transition.requestedBy",
    });
  }

  return Object.freeze(errors);
}
