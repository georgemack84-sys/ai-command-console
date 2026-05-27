import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

describe("adversarial human override", () => {
  it("rejects hidden orchestration continuation and routing restoration", () => {
    const fixture = buildHumanCoordinationOverrideFixture({
      metadata: Object.freeze({ continueWorkflow: true, restore: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "HUMAN_COORDINATION_OVERRIDE_HIDDEN_CONTINUATION",
      "HUMAN_COORDINATION_OVERRIDE_ROUTING_RESTORATION",
    ]));
  });

  it("rejects recursive override and topology synthesis markers", () => {
    const fixture = buildHumanCoordinationOverrideFixture({
      metadata: Object.freeze({ recursiveOverride: true, synthesizeTopology: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "HUMAN_COORDINATION_OVERRIDE_RECURSIVE_MARKER",
      "HUMAN_COORDINATION_OVERRIDE_TOPOLOGY_SYNTHESIS",
    ]));
  });
});
