import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import type { ProposalRevocationError, ProposalRevocationInput, ProposalRevocationReplayPolicy } from "./proposalRevocationTypes";

const FORBIDDEN_PATTERNS: Array<{
  pattern: string;
  code: ProposalRevocationError["code"];
  message: string;
}> = [
  {
    pattern: "execute",
    code: "PROPOSAL_REVOCATION_EXECUTION_SEMANTIC",
    message: "Revocation replay attempted execution restoration semantics.",
  },
  {
    pattern: "schedul",
    code: "PROPOSAL_REVOCATION_SCHEDULER_SEMANTIC",
    message: "Revocation replay attempted scheduling restoration semantics.",
  },
  {
    pattern: "orchestr",
    code: "PROPOSAL_REVOCATION_ORCHESTRATION_SEMANTIC",
    message: "Revocation replay attempted orchestration restoration semantics.",
  },
  {
    pattern: "approve",
    code: "PROPOSAL_REVOCATION_AUTHORITY_RESTORATION",
    message: "Revocation replay attempted approval restoration semantics.",
  },
];

export function validateReplayRevocationContainment(input: ProposalRevocationInput): {
  replayPolicy: ProposalRevocationReplayPolicy;
  errors: readonly ProposalRevocationError[];
} {
  const errors: ProposalRevocationError[] = [];
  const haystack = JSON.stringify(input.metadata ?? {}).toLowerCase();

  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (haystack.includes(forbidden.pattern)) {
      errors.push({
        code: forbidden.code,
        message: forbidden.message,
        path: "metadata",
      });
    }
  }

  const replayPolicy = Object.freeze({
    replayAdmissibleForAudit: true as const,
    replayAdmissibleForReconstruction: true as const,
    replayAdmissibleForGovernanceReview: true as const,
    replayAdmissibleForForensics: true as const,
    executionRestorationBlocked: true as const,
    approvalRestorationBlocked: true as const,
    progressionRestorationBlocked: true as const,
    orchestrationRestorationBlocked: true as const,
    policyHash: hashProposalRevocationValue("proposal-revocation-replay-policy", {
      proposalId: input.request.proposalId,
      replaySnapshotId: input.request.replaySnapshotId,
    }),
  });

  return Object.freeze({
    replayPolicy,
    errors: Object.freeze(errors),
  });
}
