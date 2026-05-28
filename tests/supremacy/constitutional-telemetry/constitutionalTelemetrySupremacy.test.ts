import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

describe("constitutional telemetry supremacy", () => {
  it("surfaces override propagation failures", () => {
    const supremacy = buildHumanSupremacyEnforcementFixture({
      metadata: Object.freeze({ overrideSuppression: true }),
    }).result;
    const fixture = buildConstitutionalTelemetryFixture({
      humanSupremacyResult: supremacy,
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_TELEMETRY_OVERRIDE_PROPAGATION_FAILURE")).toBe(true);
  });
});
