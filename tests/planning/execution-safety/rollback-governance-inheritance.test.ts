import { describe, expect, it } from "vitest";

import { validateRollbackGovernanceInheritance } from "@/services/planning/execution-safety";

describe("rollback governance inheritance", () => {
  it("blocks rollback governance weakening", () => {
    const result = validateRollbackGovernanceInheritance(
      {
        allowed: true,
        requiredApprovals: ["production", "rollback"],
        blockedReasons: [],
        escalationRequired: true,
        policyLocks: [],
        containmentZone: "PRODUCTION_RESTRICTED",
      },
      {
        allowed: true,
        requiredApprovals: ["production"],
        blockedReasons: [],
        escalationRequired: false,
        policyLocks: [],
        containmentZone: "READ_ONLY",
      },
      {
        maxAutonomyLevel: "approval_required",
        downgradeReasons: [],
        selfElevationBlocked: true,
      },
      {
        maxAutonomyLevel: "bounded_autonomous",
        downgradeReasons: [],
        selfElevationBlocked: false,
      },
    );

    expect(result.governanceInherited).toBe(false);
    expect(result.invariants.some((invariant) => !invariant.satisfied)).toBe(true);
  });
});
