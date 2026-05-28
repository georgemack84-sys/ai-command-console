import { describe, expect, it } from "vitest";

import { buildProposalFixture } from "./helpers";

describe("proposalLifecycleEngine", () => {
  it("supports lawful draft to validated transitions", () => {
    const { proposal } = buildProposalFixture({
      currentState: "draft",
      requestedTransition: "validate",
    });
    expect(proposal.resultingState).toBe("validated");
    expect(proposal.lifecycleDecision).toBe("ALLOW");
  });

  it("supports approved to prepared handoff with governance-only packaging", () => {
    const { proposal } = buildProposalFixture({
      currentState: "approved",
      requestedTransition: "prepare_handoff",
    });
    expect(proposal.resultingState).toBe("prepared_handoff");
    expect(proposal.handoff?.packageType).toBe("governance_only");
    expect(proposal.handoff?.executionPayloadIncluded).toBe(false);
  });
});
