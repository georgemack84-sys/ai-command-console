import type { ProposalLifecycleError, ProposalLifecycleInput } from "@/types/proposal-lifecycle-engine";

export function validateProposalLifecycle(input: {
  proposal: ProposalLifecycleInput;
  governanceValid: boolean;
  replayValid: boolean;
  snapshotValid: boolean;
  safeActionValid: boolean;
  futureBound: boolean;
  forbidden: boolean;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly ProposalLifecycleError[] {
  const errors: ProposalLifecycleError[] = [];

  if (!input.governanceValid) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_MISSING",
      message: "Proposal requires valid governance lineage.",
      path: "governanceBinding",
    });
  }
  if (!input.replayValid || !input.proposal.replay.lineage.valid) {
    errors.push({
      code: "PROPOSAL_REPLAY_MISMATCH",
      message: "Proposal requires valid replay lineage and deterministic reconstruction.",
      path: "replayBinding",
    });
  }
  if (!input.snapshotValid) {
    errors.push({
      code: "PROPOSAL_LINEAGE_MISSING",
      message: "Proposal requires immutable snapshot lineage.",
      path: "snapshotBinding",
    });
  }
  if (!input.safeActionValid) {
    errors.push({
      code: "PROPOSAL_SAFE_ACTION_MISSING",
      message: "Proposal requires a valid safe action binding.",
      path: "safeActionBinding",
    });
  }
  if (input.forbidden) {
    errors.push({
      code: "PROPOSAL_SAFE_ACTION_FORBIDDEN",
      message: "Forbidden safe actions may not enter the proposal lifecycle.",
      path: "safeActionBinding",
    });
  }
  if (input.futureBound) {
    errors.push({
      code: "PROPOSAL_FUTURE_BOUND_ESCALATION",
      message: "Future-bound safe actions may not escalate through proposal governance.",
      path: "safeActionBinding",
    });
  }

  const metadata = input.metadata ?? {};
  if ("execute" in metadata || "dispatch" in metadata || "runtimeBridge" in metadata) {
    errors.push({
      code: "PROPOSAL_RUNTIME_BRIDGE_FORBIDDEN",
      message: "Proposal metadata may not inject execution, dispatch, or runtime bridges.",
      path: "metadata",
    });
  }
  if ("approvalGranted" in metadata || "authorityInflation" in metadata) {
    errors.push({
      code: "PROPOSAL_AUTHORITY_INFLATION",
      message: "Proposal metadata may not imply approval or inflate authority.",
      path: "metadata",
    });
  }

  return Object.freeze(errors);
}
