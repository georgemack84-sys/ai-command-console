import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationRecord } from "@/services/bounded-orchestration-framework";
import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration replay safety", () => {
  it("fails closed on replay ambiguity", () => {
    const fixture = buildBoundedOrchestrationFixture();
    const record = buildBoundedOrchestrationRecord({
      ...fixture.orchestrationInput,
      routingResult: {
        ...fixture.routingResult,
        replaySnapshotId: "replay-mismatch",
      },
    });

    expect(record.validation.failClosed).toBe(true);
    expect(record.validation.errors.map((error) => error.code)).toContain("ORCHESTRATION_BOUNDARY_REPLAY_AMBIGUITY");
  });

  it("keeps replay reconstructive-only", () => {
    const fixture = buildBoundedOrchestrationFixture();

    expect(fixture.record.replay.governanceSnapshotId).toBe(fixture.record.governanceSnapshotId);
    expect(fixture.record.replay.replaySnapshotId).toBe(fixture.record.replaySnapshotId);
    expect(fixture.record.warnings[0]).toContain("containment-only");
  });
});
