import type {
  GovernanceReviewProposal,
  GovernanceReviewProposalRepository,
  GovernanceReviewProposalState,
} from "../../types/learning-constitution/governanceReview";

export class InMemoryGovernanceReviewProposalRepository implements GovernanceReviewProposalRepository {
  private readonly proposals = new Map<string, GovernanceReviewProposal>();

  async create(proposal: GovernanceReviewProposal): Promise<GovernanceReviewProposal> {
    const existing = this.proposals.get(proposal.proposalId);
    if (existing) return existing;
    this.proposals.set(proposal.proposalId, proposal);
    return proposal;
  }

  async getById(proposalId: string): Promise<GovernanceReviewProposal | undefined> {
    return this.proposals.get(proposalId);
  }

  async transition(
    proposalId: string,
    state: GovernanceReviewProposalState,
    reviewerId: string,
    decidedAt: string,
  ): Promise<GovernanceReviewProposal> {
    const existing = this.proposals.get(proposalId);
    if (!existing) throw new Error("governance proposal is missing");
    const updated: GovernanceReviewProposal = { ...existing, state, decidedAt, decidedBy: reviewerId };
    this.proposals.set(proposalId, updated);
    return updated;
  }
}
