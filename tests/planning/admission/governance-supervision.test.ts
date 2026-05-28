import { describe, expect, it } from "vitest";

import { buildGovernanceSupervision } from "@/services/planning/admission";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

describe("governance supervision", () => {
  it("is observational only", () => {
    const fixture = buildAdmissionFixture();
    const before = JSON.stringify(fixture.executionTruthPackage);
    const supervision = buildGovernanceSupervision({
      buildInput: fixture,
      decision: "PAUSED",
    });
    expect(supervision.status).toBe("PAUSE_RECOMMENDED");
    expect(JSON.stringify(fixture.executionTruthPackage)).toBe(before);
  });
});
