import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

describe("constitutional replay adversarial markers", () => {
  it("escalates on topology drift and dependency mutation", () => {
    const result = buildConstitutionalReplayFixture({
      metadata: Object.freeze({ syntheticDependencyInjection: true }),
      scenarioCategory: "SYNTHETIC_DEPENDENCY_INJECTION",
    }).result;

    expect(result.errors.some((item) => item.code === "CONSTITUTIONAL_REPLAY_TOPOLOGY_DRIFT")).toBe(true);
    expect(result.topology.topologyFrozen).toBe(true);
  });

  it("fails closed on current-state substitution", () => {
    const result = buildConstitutionalReplayFixture({
      metadata: Object.freeze({ currentStateSubstitution: true }),
      scenarioCategory: "CURRENT_STATE_SUBSTITUTION",
    }).result;

    expect(result.errors.some((item) => item.code === "CONSTITUTIONAL_REPLAY_CURRENT_STATE_SUBSTITUTION")).toBe(true);
    expect(result.record.failClosed).toBe(true);
  });
});
