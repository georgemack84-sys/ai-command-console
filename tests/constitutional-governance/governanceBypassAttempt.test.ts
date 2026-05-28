import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("governance bypass attempts", () => {
  it("preserve the constitutional rule as a hard requirement", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.autonomyBoundary.governanceRequirements).toContain("NO_AUTONOMOUS_DECISION_MAY_BYPASS_4_4H_GOVERNANCE");
    expect(view.policy.rules).toContain("no-autonomous-decision-may-bypass-4.4H-governance");
  });
});
