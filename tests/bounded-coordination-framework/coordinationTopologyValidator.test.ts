import { describe, expect, it } from "vitest";

import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("coordinationTopologyValidator", () => {
  it("rejects recursive coordination topologies", () => {
    const { input } = buildBoundedCoordinationFixture();
    const recursive = Object.freeze({
      ...input,
      graph: Object.freeze({
        ...input.graph,
        nodes: Object.freeze([
          Object.freeze({ ...input.graph.nodes[0], delegatedNodeIds: Object.freeze(["coord-child-1"]) }),
          Object.freeze({ ...input.graph.nodes[1], delegatedNodeIds: Object.freeze(["coord-root"]) }),
        ]),
      }),
    });
    const framework = buildBoundedCoordinationFramework(recursive);
    expect(framework.errors.map((error) => error.code)).toContain("COORDINATION_RECURSION_DETECTED");
  });

  it("rejects hidden topology paths", () => {
    const { input } = buildBoundedCoordinationFixture();
    const hidden = Object.freeze({
      ...input,
      graph: Object.freeze({
        ...input.graph,
        nodes: Object.freeze([
          Object.freeze({ ...input.graph.nodes[0], delegatedNodeIds: Object.freeze(["ghost-node"]) }),
          input.graph.nodes[1],
        ]),
      }),
    });
    const framework = buildBoundedCoordinationFramework(hidden);
    expect(framework.errors.map((error) => error.code)).toContain("COORDINATION_HIDDEN_PATH_DETECTED");
  });
});
