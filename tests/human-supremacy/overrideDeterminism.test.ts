import { describe, expect, it } from "vitest";

import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("override determinism", () => {
  it("produces stable intervention lineage", () => {
    const fixture = buildMissionGraphFixture();
    const input = Object.freeze({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      operatorId: "operator-1",
      action: "pause_coordination" as const,
      overrideType: "coordination" as const,
      reason: "Pause for review.",
      proposal: fixture.input.proposal,
      lifecycle: fixture.input.lifecycle,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      escalationRecord: fixture.input.escalationRecord,
      missionGraph: fixture.snapshot,
      createdAt: "2026-05-17T09:05:00.000Z",
    });
    const first = enforceHumanSupremacy(input);
    const second = enforceHumanSupremacy(input);

    expect(first.lineage.lineageHash).toBe(second.lineage.lineageHash);
  });
});
