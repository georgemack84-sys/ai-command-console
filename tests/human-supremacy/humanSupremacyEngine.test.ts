import { describe, expect, it } from "vitest";

import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

function buildInput(overrides: Partial<Record<string, unknown>> = {}) {
  const fixture = buildMissionGraphFixture();
  return Object.freeze({
    coordinationId: fixture.input.coordinationRecord.coordinationId,
    operatorId: "operator-1",
    action: "override_coordination" as const,
    overrideType: "coordination" as const,
    reason: "Operator requested constitutional interruption.",
    proposal: fixture.input.proposal,
    lifecycle: fixture.input.lifecycle,
    freshnessEvaluation: fixture.input.freshnessEvaluation,
    escalationRecord: fixture.input.escalationRecord,
    missionGraph: fixture.snapshot,
    createdAt: "2026-05-17T09:00:00.000Z",
    ...overrides,
  });
}

describe("human supremacy engine", () => {
  it("enforces deterministic human override without execution authority", () => {
    const first = enforceHumanSupremacy(buildInput());
    const second = enforceHumanSupremacy(buildInput());

    expect(first.interventionHash).toBe(second.interventionHash);
    expect(first.authorityContract.executionAuthority).toBe(false);
    expect(first.state).toBe("override_enforced");
  });
});
