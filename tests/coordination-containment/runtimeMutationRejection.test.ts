import { describe, expect, it } from "vitest";

import { buildCoordinationContainmentRecord } from "@/services/coordination-containment";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("runtime mutation rejection", () => {
  it("blocks runtime mutation markers", () => {
    const fixture = buildMissionGraphFixture();
    const record = buildCoordinationContainmentRecord({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      missionGraph: fixture.snapshot,
      escalationRecord: fixture.input.escalationRecord,
      freshnessEvaluation: fixture.input.freshnessEvaluation,
      lifecycle: fixture.input.lifecycle,
      createdAt: fixture.input.createdAt,
      metadata: { runtimeMutation: true },
    });

    expect(record.validation.violations.some((violation) => violation.category === "runtime_mutation")).toBe(true);
  });
});
