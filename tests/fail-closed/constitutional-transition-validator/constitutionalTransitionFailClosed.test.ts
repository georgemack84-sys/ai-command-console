import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { ConstitutionalTransitionErrorCode } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";

describe("constitutional transition fail-closed", () => {
  it("freezes when replay lineage is missing", () => {
    const fixture = buildConstitutionalTransitionFixture({
      replayLineageId: "",
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.MISSING_REPLAY_LINEAGE,
    );
  });

  it("freezes when approval lineage is missing", () => {
    const fixture = buildConstitutionalTransitionFixture({
      approvalLineageIds: [],
    });

    expect(fixture.result.freeze.frozen).toBe(true);
    expect(fixture.result.errors.map((error) => error.code)).toContain(
      ConstitutionalTransitionErrorCode.MISSING_APPROVAL_LINEAGE,
    );
  });
});
