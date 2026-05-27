import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("containment validation", () => {
  it("rejects graph size limit", () => {
    const base = buildCanonicalPlan();
    const steps = Array.from({ length: 65 }, (_, index) => ({
      ...base.steps[1],
      stepId: `step-${index}`,
      dependencies: index === 0 ? ["step-a"] : [`step-${index - 1}`],
    }));
    const plan = buildCanonicalPlan({
      steps: [base.steps[0], ...steps],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_NODE_LIMIT_EXCEEDED")).toBe(true);
  });

  it("rejects depth limit", () => {
    const base = buildCanonicalPlan();
    const steps = Array.from({ length: 12 }, (_, index) => ({
      ...base.steps[1],
      stepId: `deep-${index}`,
      dependencies: index === 0 ? ["step-a"] : [`deep-${index - 1}`],
    }));
    const plan = buildCanonicalPlan({
      steps: [base.steps[0], ...steps],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_DEPTH_EXCEEDED")).toBe(true);
  });

  it("rejects graph explosion", () => {
    const base = buildCanonicalPlan();
    const manyDeps = Array.from({ length: 10 }, (_, index) => `node-${index}`);
    const prefix = manyDeps.map((stepId) => ({
      ...base.steps[0],
      stepId,
    }));
    const plan = buildCanonicalPlan({
      steps: [
        ...prefix,
        {
          ...base.steps[1],
          stepId: "fan-in",
          dependencies: manyDeps,
        },
      ],
    });

    const result = validatePlanStructure(plan);
    expect(result.errors.some((error) => error.code === "STRUCTURE_CONTAINMENT_FAILURE")).toBe(true);
  });
});

