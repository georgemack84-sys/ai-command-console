import { describe, expect, it } from "vitest";
import { buildExecutionTreatyFixture } from "./helpers";

describe("stale evidence revalidation", () => {
  it("requires revalidation when replay evidence drifts or readiness already requires recertification", () => {
    const { treaty } = buildExecutionTreatyFixture({
      readiness: {
        ...buildExecutionTreatyFixture().input.readiness,
        status: "requires_recertification",
      },
      currentReplayBindingHash: "sha256:drifted",
    });

    expect(treaty.manifest.handoffStatus).toBe("revalidation-required");
    expect(treaty.manifest.preExecutionRevocationStatus).toBe("must_revalidate");
  });
});
