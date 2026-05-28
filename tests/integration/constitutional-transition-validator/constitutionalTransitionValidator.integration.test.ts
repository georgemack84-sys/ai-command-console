import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "./helpers";
import { ConstitutionalTransitionErrorCode } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

describe("constitutional transition validator integration", () => {
  it("preserves replay-certified historical bindings", () => {
    const fixture = buildConstitutionalTransitionFixture();

    expect(fixture.result.replayRecord.replayCertified).toBe(true);
    expect(fixture.result.replayRecord.replayHash).toBe(
      fixture.input.deterministicReplayResult.result.replayHash,
    );
    expect(fixture.result.transition.executionAuthorized).toBe(false);
  });

  it("freezes when suppression continuity would be bypassed", () => {
    const fixture = buildConstitutionalTransitionFixture({
      targetState: "validated",
      operatorAuthorityResult: {
        ...buildConstitutionalTransitionFixture().input.operatorAuthorityResult,
      },
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.SUPPRESSION_CONTINUITY_BROKEN,
    );
  });
});
