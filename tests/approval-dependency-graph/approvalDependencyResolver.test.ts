import { describe, expect, it } from "vitest";

import { resolveApprovalDependencyNodes } from "@/services/approval-dependency-graph";
import { buildProposalFixture } from "@/tests/proposal-lifecycle-engine/helpers";

describe("approvalDependencyResolver", () => {
  it("models governance and proposal approval prerequisites", () => {
    const { proposal } = buildProposalFixture({
      currentState: "approved",
      requestedTransition: "prepare_handoff",
      actionId: "safe-action:prepare_handoff",
    });
    const nodes = resolveApprovalDependencyNodes({
      proposal,
      governanceHash: proposal.governanceBinding.governanceDecisionHash,
      replayHash: proposal.replayBinding.reconstructionHash,
    });
    expect(nodes.map((node) => node.dependencyType)).toContain("governance_prerequisite");
    expect(nodes.map((node) => node.dependencyType)).toContain("proposal_approval");
  });
});
