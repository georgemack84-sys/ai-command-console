import { describe, expect, it } from "vitest";
import { validateConstitutionalTransition } from "@/services/constitutional-transition-validator/constitutionalTransitionValidator";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { ConstitutionalTransitionErrorCode } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

describe("constitutionalTransitionValidator", () => {
  it("validates a declared transition deterministically", () => {
    const fixture = buildConstitutionalTransitionFixture();

    expect(fixture.result.transition.executionAuthorized).toBe(false);
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.freeze.frozen).toBe(false);
    expect(fixture.result.stateMachine.declared).toBe(true);
    expect(fixture.result.transition.transitionHash).toHaveLength(64);
  });

  it("blocks undocumented transitions", () => {
    const fixture = buildConstitutionalTransitionFixture({
      targetState: "executing",
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.UNDOCUMENTED_TRANSITION,
    );
  });

  it("keeps identical inputs hash-stable", () => {
    const fixture = buildConstitutionalTransitionFixture();
    const second = validateConstitutionalTransition(fixture.input);

    expect(second.transition.transitionHash).toBe(fixture.result.transition.transitionHash);
    expect(second.deterministicHash).toBe(fixture.result.deterministicHash);
  });
});
