import { describe, expect, it } from "vitest";

import { routeAutonomousCoordination } from "@/services/autonomy/coordinationRouter";

describe("routeAutonomousCoordination", () => {
  it("routes unsafe coordination into escalation and containment paths without execution", () => {
    const result = routeAutonomousCoordination({
      coordinationType: "CONTAINED",
      constitutionalSafe: false,
      escalationRequired: true,
      containmentRequired: true,
    });

    expect(result.route).toEqual([
      "governance_review",
      "containment_precedence",
      "escalation_supervision",
      "advisory_output_only",
    ]);
  });
});
