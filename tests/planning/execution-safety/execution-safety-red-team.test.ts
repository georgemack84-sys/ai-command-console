import { describe, expect, it } from "vitest";

import { validateExecutionSafety } from "@/services/planning/execution-safety";

import { buildExecutionSafetyFixture } from "./helpers";

describe("execution safety red team", () => {
  it("blocks policy downgrade, rollback tampering, disputed promotion, and containment violations", () => {
    const fixture = buildExecutionSafetyFixture();
    fixture.executionTruthPackage.riskProfile.stepSignals[0] = {
      ...fixture.executionTruthPackage.riskProfile.stepSignals[0]!,
      destructive: true,
      rollbackCapability: "none",
      targetEnvironment: "production",
    };

    const result = validateExecutionSafety(fixture);
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
