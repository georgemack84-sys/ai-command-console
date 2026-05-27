import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("replay audit readiness", () => {
  it("happy path produces REPLAY_AUDIT_READY", () => {
    const fixture = buildReplayAuditFixture();
    const result = buildReplayAuditReadiness(fixture);
    expect(result.verdict).toBe("REPLAY_AUDIT_READY");
    expect(result.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
    expect(result.executionCompatibilityHash).toBe(fixture.executionCompatibilityContract.executionCompatibilityHash);
  });

  it("repeated calls with same input produce identical output", () => {
    const fixture = buildReplayAuditFixture();
    const left = buildReplayAuditReadiness(fixture);
    const right = buildReplayAuditReadiness(JSON.parse(JSON.stringify(fixture)));
    expect(left).toEqual(right);
  });
});
