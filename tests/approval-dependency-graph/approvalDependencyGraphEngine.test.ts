import { describe, expect, it } from "vitest";

import { buildApprovalDependencyFixture } from "./helpers";

describe("approvalDependencyGraphEngine", () => {
  it("builds a deterministic derived-only approval graph", () => {
    const first = buildApprovalDependencyFixture({
      currentState: "approved",
      requestedTransition: "prepare_handoff",
      actionId: "safe-action:prepare_handoff",
    });
    const second = buildApprovalDependencyFixture({
      currentState: "approved",
      requestedTransition: "prepare_handoff",
      actionId: "safe-action:prepare_handoff",
    });
    expect(first.graph.graphHash).toBe(second.graph.graphHash);
    expect(first.graph.derivedOnly).toBe(true);
  });
});
