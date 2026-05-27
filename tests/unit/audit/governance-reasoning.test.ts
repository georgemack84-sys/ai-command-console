import { describe, expect, it } from "vitest";

import { buildGovernanceReasoning } from "@/services/audit/governanceReasoning";

describe("buildGovernanceReasoning", () => {
  it("requires reasoning for denials", () => {
    expect(() => buildGovernanceReasoning({
      governanceAction: "DENY",
      constitutionalRules: ["rule:a"],
      evaluatedConstraints: ["constraint:a"],
      approvalsRequired: true,
      escalationRequired: true,
      governanceConfidence: 0.2,
      explanation: [],
    })).toThrow("governance_reasoning_incomplete");
  });
});
