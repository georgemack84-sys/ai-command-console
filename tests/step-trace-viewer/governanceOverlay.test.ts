import { describe, expect, it } from "vitest";
import { buildStepTraceFixture, projectGovernanceOverlay } from "./helpers";

describe("governance overlay", () => {
  it("renders governance decisions without recomputation", () => {
    const fixture = buildStepTraceFixture();
    const projected = projectGovernanceOverlay({
      treaty: fixture.validationFixture.context.treaty,
      validation: fixture.validationFixture.output,
    });

    expect(projected.overlay?.decision).toBe(
      fixture.validationFixture.output.result.validators.governance.status,
    );
  });
});
