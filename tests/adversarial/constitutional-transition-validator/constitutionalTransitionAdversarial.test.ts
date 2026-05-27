import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { ConstitutionalTransitionErrorCode } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

describe("constitutional transition adversarial", () => {
  it("blocks authority escalation attempts", () => {
    const fixture = buildConstitutionalTransitionFixture({
      transitionReason: "elevate authority after validation",
      metadata: Object.freeze({ authorityEscalation: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.AUTHORITY_ESCALATION_DETECTED,
    );
  });

  it("blocks synthetic transition reconstruction", () => {
    const fixture = buildConstitutionalTransitionFixture({
      metadata: Object.freeze({ syntheticReplay: true, transitionSynthesis: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.TRANSITION_SYNTHESIS_DETECTED,
    );
  });
});
