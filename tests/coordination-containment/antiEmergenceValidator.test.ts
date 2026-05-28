import { describe, expect, it } from "vitest";

import { validateAntiEmergence } from "@/services/coordination-containment/antiEmergenceValidator";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("validateAntiEmergence", () => {
  it("allows a clean deterministic baseline", () => {
    const fixture = buildMissionGraphFixture();
    const result = validateAntiEmergence({
      input: {
        coordinationId: fixture.input.coordinationRecord.coordinationId,
        missionGraph: fixture.snapshot,
        escalationRecord: fixture.input.escalationRecord,
        freshnessEvaluation: fixture.input.freshnessEvaluation,
        lifecycle: fixture.input.lifecycle,
        createdAt: fixture.input.createdAt,
      },
      hiddenMarkers: [],
      recursiveMarkers: [],
      authorityMarkers: [],
      runtimeMarkers: [],
      replayErrors: [],
    });

    expect(result.allowed).toBe(true);
    expect(result.containmentState).toBe("safe");
  });
});
