import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture, buildConstitutionalGovernanceView } from "./helpers";

describe("escalation spoofing", () => {
  it("deny when no escalation route exists", () => {
    const fixture = buildConstitutionalGovernanceFixture();
    const view = buildConstitutionalGovernanceView({
      ...fixture.input,
      consoleView: Object.freeze({
        ...fixture.input.consoleView,
        approvals: Object.freeze({
          ...fixture.input.consoleView.approvals,
          data: Object.freeze({
            ...fixture.input.consoleView.approvals.data,
            escalationRoutes: Object.freeze([]),
          }),
        }),
      }),
    });

    expect(view.escalationAuthority.decision).toBe("DENY");
  });
});
