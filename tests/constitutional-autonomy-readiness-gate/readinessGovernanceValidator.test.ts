import { describe, expect, it } from "vitest";
import { validateReadinessGovernance } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("validateReadinessGovernance", () => {
  it("requires undisputed governance", () => {
    const { input } = buildConstitutionalReadinessGateFixture();
    const governanceView = Object.freeze({
      ...input.governanceView,
      state: "ALLOW" as const,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      decisions: Object.freeze(
        input.governanceView.decisions.map((decision) =>
          Object.freeze({
            ...decision,
            disputed: false,
          })),
      ),
    });
    const result = validateReadinessGovernance(governanceView);
    expect(result.governanceValid).toBe(true);
  });
});
