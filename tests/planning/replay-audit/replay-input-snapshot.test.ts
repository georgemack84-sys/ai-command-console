import { describe, expect, it } from "vitest";

import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildReplayAuditFixture } from "./helpers";

describe("replay input snapshot", () => {
  it("builds stable replay snapshot hash", () => {
    const fixture = buildReplayAuditFixture();
    const first = buildReplayAuditReadiness(fixture);
    const second = buildReplayAuditReadiness(JSON.parse(JSON.stringify(fixture)));
    expect(first.replaySnapshotHash).toBe(second.replaySnapshotHash);
  });

  it("rejects mutable replay input fields", () => {
    const fixture = buildReplayAuditFixture();
    // @ts-expect-error test mutation
    fixture.executionCompatibilityContract.compatibilitySnapshot.runtimeState = { active: true };
    const result = buildReplayAuditReadiness(fixture);
    expect(result.failures.some((failure) => failure.code === "PHASE4_2H_MUTABLE_REPLAY_INPUT_DETECTED")).toBe(true);
  });

  it("shuffled object key order produces identical hashes", () => {
    const fixture = buildReplayAuditFixture();
    const compatibility = fixture.executionCompatibilityContract.compatibilitySnapshot.scopeBoundaries["step-read"]!;
    fixture.executionCompatibilityContract.compatibilitySnapshot.scopeBoundaries["step-read"] = {
      toolScope: [...compatibility.toolScope],
      tenantScope: [...compatibility.tenantScope],
      environmentScope: [...compatibility.environmentScope],
      resourceScope: [...compatibility.resourceScope],
      actionScope: [...compatibility.actionScope],
    };
    const left = buildReplayAuditReadiness(buildReplayAuditFixture());
    const right = buildReplayAuditReadiness(fixture);
    expect(left.replaySnapshotHash).toBe(right.replaySnapshotHash);
  });
});
