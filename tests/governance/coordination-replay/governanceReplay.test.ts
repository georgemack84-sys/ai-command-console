import { describe, expect, it } from "vitest";

import { buildCoordinationReplay } from "@/services/coordination-replay/coordinationReplayEngine";
import { buildCoordinationReplayFixture } from "@/tests/integration/coordination-replay/helpers";

describe("coordination replay governance", () => {
  it("fails closed on governance substitution attempts", () => {
    const fixture = buildCoordinationReplayFixture();
    const invalid = buildCoordinationReplay({
      ...fixture.replayInput,
      metadata: Object.freeze({ substituteGovernance: true }),
    });

    expect(invalid.state).toBe("invalid");
    expect(invalid.errors.map((error) => error.code)).toContain("COORDINATION_REPLAY_GOVERNANCE_MISMATCH");
  });
});
