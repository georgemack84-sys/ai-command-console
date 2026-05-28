import { describe, expect, it } from "vitest";

import { resolveContainmentState } from "@/services/coordination-containment/containmentFreezeManager";

describe("resolveContainmentState", () => {
  it("maps critical violations to frozen containment", () => {
    expect(resolveContainmentState({
      allowed: false,
      containmentState: "disputed",
      violations: [{
        violationId: "v1",
        category: "hidden_orchestration",
        severity: "critical",
        replaySafe: true,
        deterministic: true,
        containmentRequired: true,
        reason: "critical",
        evidence: [],
      }],
      replaySafe: true,
      deterministic: true,
      governanceEscalationRequired: true,
      failClosed: false,
    })).toBe("frozen");
  });
});
