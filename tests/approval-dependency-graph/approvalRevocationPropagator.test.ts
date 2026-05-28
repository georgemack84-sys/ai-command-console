import { describe, expect, it } from "vitest";

import { propagateApprovalRevocations, resolveApprovalDependencyNodes } from "@/services/approval-dependency-graph";
import { buildProposalFixture } from "@/tests/proposal-lifecycle-engine/helpers";

describe("approvalRevocationPropagator", () => {
  it("propagates revocation forward without rewriting history", () => {
    const { proposal } = buildProposalFixture({
      currentState: "approved",
      requestedTransition: "prepare_handoff",
      actionId: "safe-action:prepare_handoff",
      metadata: Object.freeze({}),
    });
    const revokedProposal = Object.freeze({
      ...proposal,
      revocation: Object.freeze({
        ...proposal.revocation,
        status: "revoked" as const,
        revokedAt: "2026-05-16T15:04:00.000Z",
      }),
    });
    const nodes = resolveApprovalDependencyNodes({
      proposal: revokedProposal,
      governanceHash: revokedProposal.governanceBinding.governanceDecisionHash,
      replayHash: revokedProposal.replayBinding.reconstructionHash,
    });
    const result = propagateApprovalRevocations({
      nodes,
      revoked: true,
      revokedAt: revokedProposal.revocation.revokedAt,
    });
    expect(result.propagations[0]?.affectedApprovalIds.length).toBeGreaterThan(0);
  });
});
