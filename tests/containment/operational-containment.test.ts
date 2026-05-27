import { describe, expect, it } from "vitest";

import { buildCivilizationContainment } from "@/services/civilization/civilizationContainment";

describe("buildCivilizationContainment", () => {
  it("inherits containment posture and prevents bypass", () => {
    const result = buildCivilizationContainment({
      inheritedContainmentState: "CONTAINMENT_ACTIVE",
      isolatedSystems: ["replay"],
      frozenSystems: ["runtime"],
      containmentPressure: 0.82,
      createdAt: 10,
    });

    expect(result.containmentBypassAllowed).toBe(false);
    expect(result.containmentState).toBe("CONTAINMENT_ACTIVE");
  });
});
