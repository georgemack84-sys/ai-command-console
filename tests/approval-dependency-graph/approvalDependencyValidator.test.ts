import { describe, expect, it } from "vitest";

import { validateApprovalDependencyGraph } from "@/services/approval-dependency-graph";
import { buildApprovalDependencyFixture } from "./helpers";

describe("approvalDependencyValidator", () => {
  it("fails closed on missing bindings and runtime bridge metadata", () => {
    const { input, graph } = buildApprovalDependencyFixture({
      metadata: Object.freeze({ runtimeBridge: true }),
    });
    const errors = validateApprovalDependencyGraph({
      graphInput: input,
      nodes: graph.nodes,
      replay: Object.freeze({ ...graph.replay, valid: false, disputed: true }),
      inheritance: graph.inheritance,
      timeWindows: graph.timeWindows,
      metadata: input.metadata,
    });
    expect(errors.map((error) => error.code)).toContain("APPROVAL_DEPENDENCY_REPLAY_MISSING");
    expect(errors.map((error) => error.code)).toContain("APPROVAL_DEPENDENCY_RUNTIME_BRIDGE_FORBIDDEN");
  });
});
