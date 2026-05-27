import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("hidden authority escalation", () => {
  it("prevent self-issued overrides and hidden escalation", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.escalationAuthority.selfIssuedOverrideAllowed).toBe(false);
    expect(view.autonomyBoundary.deniedOperations).toContain("recursive-authority-escalation");
  });
});
