import { detectGovernanceMismatch } from "./governanceMismatchDetector";
import { detectProposalReplayDrift } from "./replayDriftMonitor";
import { validateProposalFreezeApprovals } from "./proposalFreezeApprovalValidator";
import { validateProposalFreezeDependencies } from "./proposalFreezeDependencyValidator";
import { validateProposalFreezeState } from "./proposalFreezeStateGuard";
import type {
  ProposalFreezeError,
  ProposalFreezeInput,
  ProposalFreezeRecord,
} from "./types/proposalFreezeTypes";

const FORBIDDEN_PATTERNS: Array<{
  pattern: string;
  code: ProposalFreezeError["code"];
  message: string;
}> = [
  {
    pattern: "execute",
    code: "PROPOSAL_FREEZE_HIDDEN_EXECUTION",
    message: "Proposal freeze layer detected hidden execution semantics.",
  },
  {
    pattern: "orchestr",
    code: "PROPOSAL_FREEZE_HIDDEN_ORCHESTRATION",
    message: "Proposal freeze layer detected hidden orchestration semantics.",
  },
  {
    pattern: "schedul",
    code: "PROPOSAL_FREEZE_SCHEDULER_SEMANTIC",
    message: "Proposal freeze layer detected scheduler semantics.",
  },
  {
    pattern: "authority",
    code: "PROPOSAL_FREEZE_AUTHORITY_MISMATCH",
    message: "Proposal freeze layer detected authority mutation semantics.",
  },
];

function mapReason(code: ProposalFreezeError["code"]): ProposalFreezeRecord["freezeReason"] {
  switch (code) {
    case "PROPOSAL_FREEZE_REPLAY_DRIFT":
      return "REPLAY_DRIFT";
    case "PROPOSAL_FREEZE_GOVERNANCE_MISMATCH":
      return "GOVERNANCE_MISMATCH";
    case "PROPOSAL_FREEZE_POLICY_MISMATCH":
      return "POLICY_MISMATCH";
    case "PROPOSAL_FREEZE_AUTHORITY_MISMATCH":
      return "AUTHORITY_MISMATCH";
    case "PROPOSAL_FREEZE_AUDIT_INCONSISTENCY":
    case "PROPOSAL_FREEZE_LINEAGE_MUTATION":
    case "PROPOSAL_FREEZE_STATE_BYPASS":
    case "PROPOSAL_FREEZE_UNFREEZE_ATTEMPT":
    case "PROPOSAL_FREEZE_HIDDEN_EXECUTION":
    case "PROPOSAL_FREEZE_HIDDEN_ORCHESTRATION":
    case "PROPOSAL_FREEZE_SCHEDULER_SEMANTIC":
      return "AUDIT_INCONSISTENCY";
    case "PROPOSAL_FREEZE_DEPENDENCY_CORRUPTION":
      return "DEPENDENCY_CORRUPTION";
    case "PROPOSAL_FREEZE_APPROVAL_LINEAGE_INSTABILITY":
      return "APPROVAL_LINEAGE_INSTABILITY";
    case "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE":
    case "PROPOSAL_FREEZE_FAIL_CLOSED":
    default:
      return "REPLAY_RECONSTRUCTION_FAILURE";
  }
}

export function validateFreezeTriggers(input: ProposalFreezeInput): {
  freezeRequired: boolean;
  permanentFreezeRequired: boolean;
  errors: readonly ProposalFreezeError[];
  freezeReason: ProposalFreezeRecord["freezeReason"];
} {
  const errors: ProposalFreezeError[] = [];
  const replay = detectProposalReplayDrift(input);
  errors.push(...replay.errors);
  errors.push(
    ...detectGovernanceMismatch(input),
    ...validateProposalFreezeDependencies(input),
    ...validateProposalFreezeApprovals(input),
    ...validateProposalFreezeState(input),
  );

  const metadataHaystack = JSON.stringify({
    stateReason: input.proposalStateEngineInput.transition.reason,
    metadata: input.metadata ?? {},
  }).toLowerCase();
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (metadataHaystack.includes(forbidden.pattern)) {
      errors.push({
        code: forbidden.code,
        message: forbidden.message,
        path: "transition.reason",
      });
    }
  }

  if (!input.proposalStateEngineResult.transitionResult.accepted && input.proposalStateEngineResult.errors.length > 0) {
    const proposalStateReason = input.proposalStateEngineResult.errors[0]!.code;
    if (
      proposalStateReason === "PROPOSAL_STATE_LINEAGE_DISPUTED"
      || proposalStateReason === "PROPOSAL_STATE_AUDIT_APPEND_FAILED"
    ) {
      errors.push({
        code: "PROPOSAL_FREEZE_AUDIT_INCONSISTENCY",
        message: "Proposal state engine already detected disputed lineage or audit inconsistency.",
        path: "proposalStateEngineResult.errors",
      });
    }
  }

  const firstError = errors[0];
  const freezeReason = mapReason(firstError?.code ?? "PROPOSAL_FREEZE_FAIL_CLOSED");
  const permanentFreezeRequired = errors.some((error) =>
    error.code === "PROPOSAL_FREEZE_GOVERNANCE_MISMATCH"
    || error.code === "PROPOSAL_FREEZE_POLICY_MISMATCH"
    || error.code === "PROPOSAL_FREEZE_AUTHORITY_MISMATCH"
    || error.code === "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE"
    || error.code === "PROPOSAL_FREEZE_UNFREEZE_ATTEMPT"
    || error.code === "PROPOSAL_FREEZE_STATE_BYPASS",
  );

  return Object.freeze({
    freezeRequired: errors.length > 0,
    permanentFreezeRequired,
    errors: Object.freeze(errors),
    freezeReason,
  });
}
