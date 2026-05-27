import { describe, expect, it } from "vitest";

import { buildMissionGraphFixture } from "./helpers";

describe("mission graph authority leak prevention", () => {
  it("never exposes mutable or executable authority", () => {
    const { snapshot } = buildMissionGraphFixture();

    expect(snapshot.authorityContract.mayExecute).toBe(false);
    expect(snapshot.authorityContract.mayAuthorizeExecution).toBe(false);
    expect(snapshot.authorityContract.mayGenerateApproval).toBe(false);
    expect(snapshot.authorityContract.mayInferAuthority).toBe(false);
  });
});
