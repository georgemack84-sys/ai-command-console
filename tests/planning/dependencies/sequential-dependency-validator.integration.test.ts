import { describe, expect, it } from "vitest";

import { validateSequentialDependencies } from "@/services/planning/dependencies";

import { buildNormalizedPlan } from "./helpers";

describe("sequential dependency validator", () => {
  it("accepts a valid normalized plan and returns ordered ids and fingerprint", () => {
    const normalizedPlan = buildNormalizedPlan();
    normalizedPlan.steps = [
      {
        ...normalizedPlan.steps[0]!,
        id: "approval-step",
        sourceId: "approval-step",
        index: 0,
        action: {
          tool: "read_file",
          operation: "approval_gate",
          parameters: {},
        },
        inputs: {},
        dependencies: [],
      },
      {
        ...normalizedPlan.steps[1]!,
        id: "preflight-step",
        sourceId: "preflight-step",
        index: 1,
        action: {
          tool: "inspect_runtime",
          operation: "preflight_check",
          parameters: {},
        },
        inputs: {},
        dependencies: ["approval-step"],
      },
      {
        ...normalizedPlan.steps[1]!,
        id: "mutation-step",
        sourceId: "mutation-step",
        index: 2,
        approvalMode: "REQUIRED",
        inputs: {
          isDestructive: true,
          targetEnvironment: "production",
          idempotencyKey: "idem-1",
        },
        dependencies: ["preflight-step"],
      },
    ];

    const result = validateSequentialDependencies(normalizedPlan);
    expect(result.ok).toBe(true);
    expect(result.orderedStepIds).toEqual(["approval-step", "preflight-step", "mutation-step"]);
    expect(result.dependencyGraphFingerprint).toBeTruthy();
    expect(result.graph?.graphHash).toBe(normalizedPlan.validatedGraphHash);
  });
});
