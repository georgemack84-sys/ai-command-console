import { describe, expect, it } from "vitest";

import { buildInterventionReplayInspection } from "@/services/human-supremacy/interventionReplayBuilder";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("intervention replay", () => {
  it("remains historical-only and replay-safe", () => {
    const fixture = buildMissionGraphFixture();
    const inspection = buildInterventionReplayInspection({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      proposal: fixture.input.proposal,
      lifecycle: fixture.input.lifecycle,
      escalationRecord: fixture.input.escalationRecord,
    });

    expect(inspection.replaySafe).toBe(true);
    expect(inspection.replayHashes.length).toBeGreaterThan(0);
  });
});
