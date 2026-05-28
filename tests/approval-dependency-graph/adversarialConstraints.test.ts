import { describe, expect, it } from "vitest";

import { buildApprovalDependencyGraph } from "@/services/approval-dependency-graph";
import { buildApprovalDependencyFixture } from "./helpers";

describe("approval dependency adversarial constraints", () => {
  it("denies hidden approval injection and authority inflation", () => {
    const { input } = buildApprovalDependencyFixture({
      metadata: Object.freeze({
        approvalGranted: true,
        authorityInflation: true,
      }),
    });
    const graph = buildApprovalDependencyGraph(input);
    expect(graph.errors.map((error) => error.code)).toContain("APPROVAL_DEPENDENCY_AUTHORITY_INFLATION");
  });

  it("denies runtime bridge and execution metadata insertion", () => {
    const { input } = buildApprovalDependencyFixture({
      metadata: Object.freeze({
        runtimeBridge: true,
        execute: true,
      }),
    });
    const graph = buildApprovalDependencyGraph(input);
    expect(graph.errors.map((error) => error.code)).toContain("APPROVAL_DEPENDENCY_RUNTIME_BRIDGE_FORBIDDEN");
    expect(graph.errors.map((error) => error.code)).toContain("APPROVAL_DEPENDENCY_EXECUTION_METADATA_FORBIDDEN");
  });

  it("denies future-bound escalation attempts", () => {
    const { input } = buildApprovalDependencyFixture({
      autonomyLevel: "A4",
      actionId: "safe-action:simulate",
    });
    const graph = buildApprovalDependencyGraph(input);
    expect(graph.errors.map((error) => error.code)).toContain("APPROVAL_DEPENDENCY_FUTURE_BOUND_ESCALATION");
  });
});
