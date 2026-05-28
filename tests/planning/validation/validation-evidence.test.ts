import { describe, expect, it } from "vitest";

import { validatePlanStructure } from "@/services/planning/validation/validation-engine";

import { buildCanonicalPlan } from "./helpers";

describe("validation evidence", () => {
  it("evidence hash is stable", () => {
    const plan = buildCanonicalPlan();
    expect(validatePlanStructure(plan).validationHash).toBe(validatePlanStructure(plan).validationHash);
  });

  it("includes deterministic evidence", () => {
    const plan = buildCanonicalPlan();
    const result = validatePlanStructure(plan);

    expect(result.evidence.validationRunId).toBeTruthy();
    expect(result.evidence.graphHash).toBe(result.graphHash);
    expect(result.evidence.validationHash).toBe(result.validationHash);
  });
});

