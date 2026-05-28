import { describe, expect, it } from "vitest";

import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("governance bypass rejection", () => {
  it("rejects governance bypass metadata", () => {
    const fixture = buildMissionGraphFixture();
    const record = enforceHumanSupremacy(Object.freeze({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      operatorId: "operator-1",
      action: "override_coordination" as const,
      overrideType: "governance" as const,
      reason: "bad request",
      proposal: fixture.input.proposal,
      lifecycle: fixture.input.lifecycle,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      escalationRecord: fixture.input.escalationRecord,
      missionGraph: fixture.snapshot,
      createdAt: "2026-05-17T09:15:00.000Z",
      metadata: Object.freeze({ governanceBypass: true }),
    }));

    expect(record.errors.map((error) => error.code)).toContain("HUMAN_SUPREMACY_GOVERNANCE_BYPASS_FORBIDDEN");
  });
});
