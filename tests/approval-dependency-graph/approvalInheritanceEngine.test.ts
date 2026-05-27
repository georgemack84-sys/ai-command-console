import { describe, expect, it } from "vitest";

import { deriveApprovalInheritance, resolveApprovalDependencyNodes } from "@/services/approval-dependency-graph";
import { buildProposalFixture } from "@/tests/proposal-lifecycle-engine/helpers";

describe("approvalInheritanceEngine", () => {
  it("makes higher-risk approvals inherit lower-risk prerequisites visibly", () => {
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
    const inheritance = deriveApprovalInheritance({ proposal, nodes });
    expect(inheritance.length).toBeGreaterThan(0);
    expect(inheritance.every((entry) => entry.inherited)).toBe(true);
  });
});
