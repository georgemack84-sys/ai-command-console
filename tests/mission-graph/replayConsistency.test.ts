import { describe, expect, it } from "vitest";

import { buildMissionCoordinationGraph } from "@/services/mission-graph/missionCoordinationGraphEngine";
import { buildMissionGraphFixture } from "./helpers";

describe("mission graph replay consistency", () => {
  it("fails closed on replay mismatch ancestry", () => {
    const fixture = buildMissionGraphFixture();
    const snapshot = buildMissionCoordinationGraph({
      ...fixture.input,
      freshnessEvaluation: Object.freeze({
        ...fixture.input.freshnessEvaluation,
        state: Object.freeze({
          ...fixture.input.freshnessEvaluation.state,
          replayIntegrity: "mismatch" as const,
        }),
      }),
    });

    expect(snapshot.visibilityState).toBe("frozen");
    expect(snapshot.errors.map((error) => error.code)).toContain("MISSION_GRAPH_REPLAY_AMBIGUITY");
  });
});
