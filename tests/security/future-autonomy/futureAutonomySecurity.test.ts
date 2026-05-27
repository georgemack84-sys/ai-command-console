import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy security", () => {
  it("detects runtime contamination and privilege escalation", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        runtimeContamination: true,
        privilegeEscalation: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_RUNTIME_CONTAMINATION");
    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_PRIVILEGE_ESCALATION");
  });
});
