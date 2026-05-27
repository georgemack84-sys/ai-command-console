import { describe, expect, it } from "vitest";
import { detectGovernanceDrift } from "@/services/governance-drift-detection";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governanceDriftDetectionEngine", () => {
  it("is deterministic for the same input", () => {
    const { input } = buildGovernanceDriftFixture();
    const first = detectGovernanceDrift(input);
    const second = detectGovernanceDrift(input);

    expect(first.deterministicHash).toBe(second.deterministicHash);
    expect(first.record.driftState).toBe("SIMULATED");
    expect(first.authorityContract.executionAuthority).toBe(false);
  });

  it("fails closed on governance substitution", () => {
    const result = buildGovernanceDriftFixture({
      metadata: Object.freeze({ governanceSubstitution: true }),
    }).result;

    expect(result.record.failClosed).toBe(true);
    expect(result.errors.some((item) => item.code === "GOVERNANCE_DRIFT_POLICY_DIVERGENCE")).toBe(true);
  });
});
