import { describe, expect, it } from "vitest";

import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("replay integrity after override", () => {
  it("preserves replay-safe ancestry after human override", () => {
    const fixture = buildMissionGraphFixture();
    const record = enforceHumanSupremacy(Object.freeze({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      operatorId: "operator-1",
      action: "override_coordination" as const,
      overrideType: "coordination" as const,
      reason: "Need explicit operator intervention.",
      proposal: fixture.input.proposal,
      lifecycle: fixture.input.lifecycle,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      escalationRecord: fixture.input.escalationRecord,
      missionGraph: fixture.snapshot,
      createdAt: "2026-05-17T09:20:00.000Z",
    }));

    expect(record.replayInspection.replaySafe).toBe(true);
  });
});
