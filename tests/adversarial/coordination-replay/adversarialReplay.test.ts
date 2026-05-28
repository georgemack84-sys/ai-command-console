import { describe, expect, it } from "vitest";

import { buildCoordinationReplay } from "@/services/coordination-replay/coordinationReplayEngine";
import { buildCoordinationReplayFixture } from "@/tests/integration/coordination-replay/helpers";

describe("coordination replay adversarial enforcement", () => {
  it("rejects replay repair injection", () => {
    const fixture = buildCoordinationReplayFixture({
      metadata: Object.freeze({ repairReplay: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toContain("COORDINATION_REPLAY_SYNTHETIC_CONTINUITY");
  });

  it("rejects chronology mutation attempts", () => {
    const fixture = buildCoordinationReplayFixture({
      metadata: Object.freeze({ mutateChronology: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toContain("COORDINATION_REPLAY_HISTORY_MUTATION");
  });

  it("rejects replay ambiguity injection", () => {
    const fixture = buildCoordinationReplayFixture();
    const invalid = buildCoordinationReplay({
      ...fixture.replayInput,
      routingResult: {
        ...fixture.replayInput.routingResult,
        replaySnapshotId: "replay-mismatch",
      },
    });
    expect(invalid.state).toBe("fail_closed");
    expect(invalid.errors.map((error) => error.code)).toContain("COORDINATION_REPLAY_AMBIGUITY");
  });

  it("rejects orchestration continuation attempts", () => {
    const fixture = buildCoordinationReplayFixture({
      metadata: Object.freeze({ continueWorkflow: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toContain("COORDINATION_REPLAY_SYNTHETIC_CONTINUITY");
  });
});
