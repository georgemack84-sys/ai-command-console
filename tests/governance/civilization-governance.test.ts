import { describe, expect, it } from "vitest";

import { buildCivilizationGovernance } from "@/services/civilization/civilizationGovernance";

describe("buildCivilizationGovernance", () => {
  it("keeps operator supremacy and advisory posture", () => {
    const result = buildCivilizationGovernance({
      sovereigntyState: "SUPERVISED",
      validationState: "WARNING",
      containmentRequired: true,
      operatorInterventionRequired: true,
      blockedReasons: ["approval_required"],
      createdAt: 10,
    });

    expect(result.operatorSupremacyPreserved).toBe(true);
    expect(result.advisoryOnly).toBe(true);
  });
});
