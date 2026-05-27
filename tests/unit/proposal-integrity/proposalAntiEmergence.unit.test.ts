import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity anti-emergence unit", () => {
  it("runtime-linked proposals are rejected", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ runtimeLinked: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_RUNTIME_LINKAGE_DETECTED")).toBe(true);
  });
});
