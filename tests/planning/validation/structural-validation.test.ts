import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("structural validation", () => {
  it("accepts a valid DAG", () => {
    const result = validatePlanStructure(buildCanonicalPlan());
    expect(result.ok).toBe(true);
    expect(result.status).toBe("approved_for_planning_pipeline");
  });

  it("rejects a cycle", () => {
    const plan = buildCanonicalPlan();
    plan.steps[0].dependencies = ["step-b"];

    const result = validatePlanStructure(plan);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "STRUCTURE_CYCLE_DETECTED")).toBe(true);
  });

  it("rejects an orphan node", () => {
    const plan = buildCanonicalPlan({
      steps: [
        ...buildCanonicalPlan().steps,
        {
          stepId: "step-c",
          type: "propose",
          title: "Detached branch",
          dependencies: [],
          action: {
            tool: "tool.propose",
            operation: "propose",
            parameters: {},
          },
          safety: {
            approvalRequired: false,
            dryRunSupported: true,
            riskLevel: "low",
          },
          execution: {
            timeoutMs: 1000,
            retryable: false,
            idempotent: true,
          },
          observability: {
            logLevel: "info",
            metricsEnabled: true,
          },
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "STRUCTURE_ORPHAN_NODE")).toBe(true);
  });

  it("rejects a disconnected graph", () => {
    const plan = buildCanonicalPlan({
      steps: [
        buildCanonicalPlan().steps[0],
        {
          ...buildCanonicalPlan().steps[1],
          dependencies: [],
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "STRUCTURE_DISCONNECTED_GRAPH")).toBe(true);
  });
});

