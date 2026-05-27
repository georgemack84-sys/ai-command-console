import { describe, expect, it } from "vitest";
import { buildEscalationAuthorityContract, enforceEscalationBoundary } from "@/services/escalation/escalationBoundaryEnforcer";

describe("escalation boundary enforcer", () => {
  it("keeps authority contract false-only", () => {
    expect(enforceEscalationBoundary({
      authorityContract: buildEscalationAuthorityContract(),
    })).toEqual([]);
  });

  it("rejects orchestration metadata", () => {
    expect(enforceEscalationBoundary({
      authorityContract: buildEscalationAuthorityContract(),
      metadata: Object.freeze({ dispatchId: "dispatch-1" }),
    }).map((error) => error.code)).toContain("ESCALATION_ORCHESTRATION_LEAK_REJECTED");
  });
});
