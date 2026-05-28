import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("runtime admissibility supremacy", () => {
  it("revokes admissibility when human supremacy freezes or shuts down the path", () => {
    const supremacy = buildHumanSupremacyEnforcementFixture({
      interventionType: "kill_switch",
    }).result;
    const fixture = buildRuntimeAdmissibilityFixture({
      humanSupremacyResult: supremacy,
    });

    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_OVERRIDE_INCOMPATIBLE")).toBe(true);
    expect(fixture.result.record.classification).toBe("revoked");
  });
});
