import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "./helpers";

describe("operator override supremacy", () => {
  it("keeps operator deny admissibility overrides authoritative in replay-safe form", () => {
    const fixture = buildProposalApprovalBindingFixture({
      operatorOverrideRequest: Object.freeze({
        overrideId: "override-deny-1",
        operatorId: "operator-9",
        disposition: "DENY_ADMISSIBILITY" as const,
        reason: "Manual denial",
        boundAt: "2026-05-21T07:10:00.000Z",
        supersedesAutomation: true as const,
      }),
    });

    expect(fixture.result.overrideBinding?.disposition).toBe("DENY_ADMISSIBILITY");
    expect(fixture.result.admissibility.admissible).toBe(false);
    expect(fixture.result.admissibility.status).toBe("DENIED");
  });
});
