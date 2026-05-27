import { describe, expect, it } from "vitest";
import { validateEscalationPolicy } from "@/services/constitutional-escalation-layer";
import { buildConstitutionalEscalationFixture } from "./helpers";

describe("validateEscalationPolicy", () => {
  it("flags policy mismatch when governance is not fully allow", () => {
    const { input } = buildConstitutionalEscalationFixture({
      currentState: "denied",
      requestedTransition: "archive",
    });
    const result = validateEscalationPolicy(input.governanceView);

    expect(result.policyMismatch).toBe(true);
  });
});
