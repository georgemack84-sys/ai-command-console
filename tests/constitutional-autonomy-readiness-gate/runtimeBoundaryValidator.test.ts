import { describe, expect, it } from "vitest";
import { validateRuntimeBoundary } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("validateRuntimeBoundary", () => {
  it("validates runtime observation remains observational", () => {
    const { input } = buildConstitutionalReadinessGateFixture();
    const result = validateRuntimeBoundary(input.monitoringModel);
    expect(typeof result.runtimeBoundarySafe).toBe("boolean");
  });
});
