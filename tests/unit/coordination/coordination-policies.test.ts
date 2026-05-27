import { describe, expect, it } from "vitest";

import { evaluateCoordinationPolicies } from "@/services/coordination/coordinationPolicies";

describe("evaluateCoordinationPolicies", () => {
  it("gives containment precedence over stabilization", () => {
    const result = evaluateCoordinationPolicies({
      enforcementExecutable: true,
      containmentRequired: true,
      approvalRequired: false,
      disputedTruthPresent: false,
      sovereigntyState: "UNSTABLE",
      supervisionState: "SUPERVISING",
    });

    expect(result.outcome).toBe("CONTAIN");
  });
});
