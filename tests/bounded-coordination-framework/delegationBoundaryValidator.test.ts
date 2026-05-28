import { describe, expect, it } from "vitest";

import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("delegationBoundaryValidator", () => {
  it("rejects authority drift and escalation depth overflow", () => {
    const { input } = buildBoundedCoordinationFixture();
    const drifted = Object.freeze({
      ...input,
      graph: Object.freeze({
        ...input.graph,
        nodes: Object.freeze([
          Object.freeze({ ...input.graph.nodes[0], authorityBoundaryId: "authority:unknown", escalationDepth: 2 }),
          input.graph.nodes[1],
        ]),
      }),
    });
    const framework = buildBoundedCoordinationFramework(drifted);
    expect(framework.errors.map((error) => error.code)).toContain("COORDINATION_AUTHORITY_DRIFT");
  });
});
