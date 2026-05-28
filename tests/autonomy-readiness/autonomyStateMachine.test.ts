import { describe, expect, it } from "vitest";
import { buildAutonomyReadinessFixture, deriveAutonomyReadinessProfile } from "./helpers";

describe("autonomy state machine", () => {
  it("maps constitutional observe-only readiness into observe_only state", () => {
    const fixture = buildAutonomyReadinessFixture();
    const profile = deriveAutonomyReadinessProfile({
      ...fixture.input,
      governanceView: Object.freeze({
        ...fixture.input.governanceView,
        state: "ALLOW",
        violations: Object.freeze([]),
        policy: Object.freeze({
          ...fixture.input.governanceView.policy,
          governanceLineageHash: "governance-lineage:ok",
          approvalLineageHash: "approval-lineage:ok",
          authorityLineageHash: "authority-lineage:ok",
          policySnapshotHash: "policy-snapshot:ok",
        }),
        replayAuthority: Object.freeze({
          ...fixture.input.governanceView.replayAuthority,
          decision: "ALLOW",
          lineageValid: true,
          replaySnapshotHash: "replay-snapshot:ok",
          replayLineageHash: "replay-lineage:ok",
        }),
        autonomyBoundary: Object.freeze({
          ...fixture.input.governanceView.autonomyBoundary,
          currentLevel: "A0",
          ceilingLevel: "A0",
        }),
      }),
      source: Object.freeze({
        ...fixture.input.source,
        consoleView: Object.freeze({
          ...fixture.input.source.consoleView,
          autonomy: Object.freeze({
            ...fixture.input.source.consoleView.autonomy,
            autonomyLevel: "A0",
          }),
        }),
      }),
    });
    expect(profile.derivedState).toBe("observe_only");
  });
});
