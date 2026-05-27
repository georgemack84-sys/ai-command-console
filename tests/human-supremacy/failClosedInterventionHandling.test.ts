import { describe, expect, it } from "vitest";

import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("fail-closed intervention handling", () => {
  it("fails closed on frozen mission graph ancestry", () => {
    const fixture = buildMissionGraphFixture();
    const record = enforceHumanSupremacy(Object.freeze({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      operatorId: "operator-1",
      action: "override_coordination" as const,
      overrideType: "coordination" as const,
      reason: "Operator stops unsafe coordination.",
      proposal: fixture.input.proposal,
      lifecycle: fixture.input.lifecycle,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      escalationRecord: fixture.input.escalationRecord,
      missionGraph: Object.freeze({ ...fixture.snapshot, visibilityState: "frozen" as const }),
      createdAt: "2026-05-17T09:25:00.000Z",
    }));

    expect(record.state).toBe("fail_closed");
    expect(record.errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_REPLAY_ANCESTRY_MISMATCH");
  });
});
