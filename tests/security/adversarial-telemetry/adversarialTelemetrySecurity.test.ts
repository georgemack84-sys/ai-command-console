import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry security", () => {
  it("detects runtime contamination and privilege escalation", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        runtimeContamination: true,
        privilegeEscalation: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_RUNTIME_CONTAMINATION");
    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_PRIVILEGE_ESCALATION");
  });
});
