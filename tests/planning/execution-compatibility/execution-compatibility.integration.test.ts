import { describe, expect, it } from "vitest";

import { buildExecutionSafetyContract } from "@/services/planning/execution-safety/execution-safety-contract-builder";
import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildExecutionCompatibilityFixture } from "./helpers";

describe("execution compatibility integration", () => {
  it("prepares contracts for 4.2F without duplicating enforcement", () => {
    const fixture = buildExecutionCompatibilityFixture();
    const compatibility = validateExecutionCompatibility({
      executionTruthHash: fixture.executionTruthPackage.executionTruthHash,
      normalizedPlan: fixture.normalizedPlan,
      executionTruth: fixture.executionTruthPackage,
      dependencyValidation: fixture.dependencyValidation,
    });
    const safety = buildExecutionSafetyContract({
      normalizedPlan: fixture.normalizedPlan,
      executionTruthPackage: fixture.executionTruthPackage,
    });

    expect(compatibility.ok).toBe(true);
    expect(safety.ok).toBe(true);
    expect(compatibility.contract?.executionTruthHash).toBe(safety.ok ? safety.contract.executionTruthHash : "");
  });
});
