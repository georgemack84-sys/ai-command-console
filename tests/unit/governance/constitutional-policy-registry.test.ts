import { describe, expect, it } from "vitest";

import { CONSTITUTIONAL_POLICY_REGISTRY } from "@/services/governance/constitutionalPolicyRegistry";

describe("CONSTITUTIONAL_POLICY_REGISTRY", () => {
  it("defines deterministic constitutional states and approval requirements", () => {
    expect(CONSTITUTIONAL_POLICY_REGISTRY.CONSTITUTIONAL.requiredApprovals).toEqual([]);
    expect(CONSTITUTIONAL_POLICY_REGISTRY.DENIED.allow).toBe(false);
    expect(CONSTITUTIONAL_POLICY_REGISTRY.EMERGENCY_GOVERNANCE.requiredApprovals).toContain("emergency_governance_review");
  });
});
