import { describe, expect, it } from "vitest";

import { buildContainmentReplay } from "@/services/coordination-containment/containmentReplayBuilder";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("buildContainmentReplay", () => {
  it("reconstructs deterministic replay snapshots", () => {
    const fixture = buildMissionGraphFixture();
    const input = {
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      missionGraph: fixture.snapshot,
      escalationRecord: fixture.input.escalationRecord,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      lifecycle: fixture.input.lifecycle,
      createdAt: fixture.input.createdAt,
    } as const;

    expect(buildContainmentReplay(input)).toEqual(buildContainmentReplay(input));
  });
});
