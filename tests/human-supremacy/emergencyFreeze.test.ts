import { describe, expect, it } from "vitest";

import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("emergency freeze", () => {
  it("creates human-authorized immutable emergency freeze evidence", () => {
    const fixture = buildMissionGraphFixture();
    const record = enforceHumanSupremacy(Object.freeze({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      operatorId: "operator-1",
      action: "emergency_freeze" as const,
      overrideType: "emergency" as const,
      reason: "Unsafe coordination detected by operator.",
      proposal: fixture.input.proposal,
      lifecycle: fixture.input.lifecycle,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      escalationRecord: fixture.input.escalationRecord,
      missionGraph: fixture.snapshot,
      createdAt: "2026-05-17T09:10:00.000Z",
    }));

    expect(record.state).toBe("frozen");
    expect(record.emergencyFreeze?.replaySafe).toBe(true);
    expect(record.emergencyFreeze?.governanceVisible).toBe(true);
  });
});
