import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture, buildConstitutionalGovernanceView } from "./helpers";

describe("fail-closed behavior", () => {
  it("denies when required governance metadata is missing", () => {
    const fixture = buildConstitutionalGovernanceFixture();
    const view = buildConstitutionalGovernanceView({
      ...fixture.input,
      replay: undefined as never,
    });

    expect(view.state).toBe("DENY");
    expect(view.errors[0]?.code).toBe("CONSTITUTIONAL_REPO_CONTEXT_MISSING");
  });
});
