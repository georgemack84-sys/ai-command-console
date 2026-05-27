import { describe, expect, it } from "vitest";
import { buildExecutionTreatyFixture } from "./helpers";

describe("quarantine detection", () => {
  it("marks treaty as quarantined when upstream readiness is denied under containment", () => {
    const { treaty } = buildExecutionTreatyFixture({
      readiness: {
        ...buildExecutionTreatyFixture().input.readiness,
        status: "denied",
        governanceVerified: false,
      },
      failureState: {
        ...buildExecutionTreatyFixture().input.failureState,
        runtimeMode: "FULL_CONTAINMENT",
      },
    });

    expect(treaty.manifest.handoffStatus).toBe("quarantined");
    expect(treaty.manifest.preExecutionRevocationStatus).toBe("quarantined");
  });
});
