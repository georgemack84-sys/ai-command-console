import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildControlledAutonomyReadinessGateFixture();
    const second = buildControlledAutonomyReadinessGateFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.risk).toEqual(second.result.risk);
  });

  it("remains advisory-only even when verified", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture();

    expect(fixture.result.authorityContract.readinessAuthorization).toBe(false);
    expect(fixture.result.authorityContract.autonomyAuthorization).toBe(false);
  });
});
