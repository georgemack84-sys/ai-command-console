import { describe, expect, it } from "vitest";

import { buildIntentCorrelationFixture } from "./helpers";

describe("adversarial correlation", () => {
  it("does not infer A->C from A->B and B->C", () => {
    const { computation } = buildIntentCorrelationFixture();
    expect(computation.result.relationships.map((relationship) => `${relationship.sourceProposalId}:${relationship.targetProposalId}`)).toEqual([
      "proposal-a:proposal-b",
      "proposal-b:proposal-c",
    ]);
  });

  it("does not create runtime authority in the result", () => {
    const { computation } = buildIntentCorrelationFixture();
    expect(computation.result.boundary.executionAuthority).toBe(false);
    expect(computation.result.boundary.workflowSynthesis).toBe(false);
  });
});
