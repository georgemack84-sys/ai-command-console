import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { ConstitutionalTransitionErrorCode } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

describe("constitutional transition anti-emergence", () => {
  it("freezes recursive transition chains", () => {
    const fixture = buildConstitutionalTransitionFixture({
      sourceState: "validated",
      targetState: "validated",
      metadata: Object.freeze({ recursiveTransitionChain: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.RECURSIVE_TRANSITION_CHAIN,
    );
  });

  it("freezes hidden lifecycle mutation", () => {
    const fixture = buildConstitutionalTransitionFixture({
      metadata: Object.freeze({ hiddenLifecycleMutation: true }),
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.HIDDEN_TRANSITION_DETECTED,
    );
  });
});
