import { describe, expect, it } from "vitest";

import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("bounded coordination adversarial constraints", () => {
  it("fails closed on runtime metadata injection", () => {
    const { input } = buildBoundedCoordinationFixture({
      metadata: Object.freeze({
        schedulerIntent: true,
        queueControl: true,
        runtimeBridge: true,
      }),
    });
    const framework = buildBoundedCoordinationFramework(input);
    expect(framework.errors.map((error) => error.code)).toContain("COORDINATION_DYNAMIC_MUTATION_FORBIDDEN");
  });

  it("fails closed when override reachability is lost", () => {
    const { input } = buildBoundedCoordinationFixture();
    const unreachable = Object.freeze({
      ...input,
      overrideContract: Object.freeze({
        ...input.overrideContract,
        lineage: Object.freeze({
          ...input.overrideContract.lineage,
          entries: Object.freeze([]),
        }),
      }),
    });
    const framework = buildBoundedCoordinationFramework(unreachable);
    expect(framework.errors.map((error) => error.code)).toContain("COORDINATION_OVERRIDE_UNREACHABLE");
  });
});
