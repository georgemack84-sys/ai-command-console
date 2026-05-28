import { describe, expect, it } from "vitest";

import { buildCoordinationContainmentRecord } from "@/services/coordination-containment";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("authority inheritance rejection", () => {
  it("fails closed on authority inheritance attempts", () => {
    const fixture = buildMissionGraphFixture();
    const record = buildCoordinationContainmentRecord({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      missionGraph: fixture.snapshot,
      escalationRecord: fixture.input.escalationRecord,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      lifecycle: fixture.input.lifecycle,
      createdAt: fixture.input.createdAt,
      metadata: { authorityInheritance: true },
    });

    expect(record.validation.failClosed).toBe(true);
  });
});
