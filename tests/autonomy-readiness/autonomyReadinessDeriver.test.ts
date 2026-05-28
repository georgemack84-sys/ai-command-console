import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("autonomy readiness deriver", () => {
  it("derives a deterministic readiness profile from constitutional governance", () => {
    const first = buildAutonomyReadinessFixture();
    const second = buildAutonomyReadinessFixture();

    expect(first.profile.readinessHash).toBe(second.profile.readinessHash);
    expect(first.profile).toEqual(second.profile);
  });

  it("fails closed when governance lineage is missing", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        policy: Object.freeze({
          ...fixture.input.governanceView.policy,
          governanceLineageHash: "",
        }),
      }),
    });

    expect(profile.derivedState).toBe("forbidden");
    expect(profile.errors.some((error) => error.code === "AUTONOMY_GOVERNANCE_UNBOUND")).toBe(true);
  });
});
