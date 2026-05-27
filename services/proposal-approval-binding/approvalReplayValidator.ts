import type {
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";

export function validateApprovalReplayBinding(
  input: ProposalApprovalBindingInput,
): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];
  const replay = input.proposalReplayResult;

  if (replay.status === "FAILED_CLOSED") {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_REPLAY_DRIFT",
      message: "Approval binding cannot depend on a replay result that already failed closed.",
      path: "proposalReplayResult.status",
    });
  }

  const approvalMismatch = replay.drifts.find((drift) => drift.driftType === "approval_mismatch");
  if (approvalMismatch) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_REPLAY_DRIFT",
      message: "Approval binding detected replay drift in immutable approval ancestry.",
      path: "proposalReplayResult.drifts",
    });
  }

  if (
    [...replay.replay.approvalSnapshotIds].sort().join("|")
    !== [...input.proposalIntegrityResult.approvalBinding.approvalDependencyIds].sort().join("|")
  ) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_REPLAY_DRIFT",
      message: "Replay approval snapshots diverge from integrity-bound approval dependencies.",
      path: "proposalReplayResult.replay.approvalSnapshotIds",
    });
  }

  return Object.freeze(errors);
}
