import type { ProposalLifecycleError, ProposalLifecycleInput } from "@/types/proposal-lifecycle-engine";

export function validateProposalLifecycleSchema(input: ProposalLifecycleInput): readonly ProposalLifecycleError[] {
  const errors: ProposalLifecycleError[] = [];

  if (!input.proposalId || !input.missionId || !input.executionId || !input.createdAt || !input.updatedAt) {
    errors.push({
      code: "PROPOSAL_SCHEMA_INVALID",
      message: "Proposal identity and timestamps are required.",
      path: "proposal",
    });
  }
  if (!input.title || !input.summary) {
    errors.push({
      code: "PROPOSAL_SCHEMA_INVALID",
      message: "Proposal title and summary are required.",
      path: "content",
    });
  }

  return Object.freeze(errors);
}
