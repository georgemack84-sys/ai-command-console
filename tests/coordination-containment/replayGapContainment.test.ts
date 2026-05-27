import { describe, expect, it } from "vitest";

import { buildCoordinationContainmentRecord } from "@/services/coordination-containment";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("replay gap containment", () => {
  it("fails closed on replay ancestry mismatch", () => {
    const fixture = buildMissionGraphFixture();
    const record = buildCoordinationContainmentRecord({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      missionGraph: { ...fixture.snapshot, replayPaths: Object.freeze([]) },
      escalationRecord: fixture.input.escalationRecord,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      lifecycle: fixture.input.lifecycle,
      createdAt: fixture.input.createdAt,
    });

    expect(record.validation.violations.some((violation) => violation.category === "replay_violation")).toBe(true);
  });
});
