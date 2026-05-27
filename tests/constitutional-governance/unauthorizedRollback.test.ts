import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("unauthorized rollback", () => {
  it("never allow automatic rollback authority", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.recoveryAuthorization.approvalRequired).toBe(true);
    expect(view.recoveryAuthorization.decision).not.toBe("ALLOW");
  });
});
