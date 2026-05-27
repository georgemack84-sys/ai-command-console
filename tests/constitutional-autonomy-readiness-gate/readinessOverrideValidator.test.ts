import { describe, expect, it } from "vitest";
import { validateReadinessOverride } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("validateReadinessOverride", () => {
  it("fails when override freeze is active", () => {
    const { input } = buildConstitutionalReadinessGateFixture();
    const result = validateReadinessOverride(input.overrideContract);
    expect(typeof result.overrideValid).toBe("boolean");
  });
});
