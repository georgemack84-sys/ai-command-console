import { describe, expect, it } from "vitest";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("human supremacy enforcement adversarial", () => {
  it("invalidates hidden execution and override suppression markers", () => {
    const fixture = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ hiddenExecution: true, overrideSuppression: true }),
    });

    expect(fixture.result.record.enforcementState).toBe("INVALID");
  });
});
