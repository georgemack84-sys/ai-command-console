import { describe, expect, it } from "vitest";

import { enforceReplayBinding, resolveExecutionBinding } from "@/services/resolution-engine";
import { buildResolutionFixture } from "./helpers";

describe("replay binding enforcer", () => {
  it("accepts the original immutable binding artifact", () => {
    const fixture = buildResolutionFixture();
    const resolution = resolveExecutionBinding(fixture);
    if (!resolution.binding) throw new Error("binding missing");

    expect(enforceReplayBinding({
      binding: resolution.binding,
      runtime: fixture.runtime,
      governance: fixture.governance,
    })).toEqual([]);
  });

  it("rejects governance evidence substitution", () => {
    const fixture = buildResolutionFixture();
    const resolution = resolveExecutionBinding(fixture);
    if (!resolution.binding) throw new Error("binding missing");

    const failures = enforceReplayBinding({
      binding: resolution.binding,
      runtime: fixture.runtime,
      governance: {
        ...fixture.governance,
        evidenceBundle: {
          ...fixture.governance.evidenceBundle,
          evidenceHash: "forged",
        },
      },
    });

    expect(failures.some((failure) => failure.code === "TOOL_BINDING_MUTATION_DETECTED")).toBe(true);
  });

  it("rejects lineage mismatch", () => {
    const fixture = buildResolutionFixture();
    const resolution = resolveExecutionBinding(fixture);
    if (!resolution.binding) throw new Error("binding missing");

    const failures = enforceReplayBinding({
      binding: resolution.binding,
      runtime: fixture.runtime,
      governance: {
        ...fixture.governance,
        lineageNode: {
          ...fixture.governance.lineageNode,
          lineageHash: "forged-lineage",
        },
      },
    });

    expect(failures.some((failure) => failure.code === "TOOL_BINDING_MUTATION_DETECTED")).toBe(true);
  });

  it("rejects replay containment mismatch", () => {
    const fixture = buildResolutionFixture();
    const resolution = resolveExecutionBinding(fixture);
    if (!resolution.binding) throw new Error("binding missing");

    const failures = enforceReplayBinding({
      binding: resolution.binding,
      runtime: {
        ...fixture.runtime,
        envelope: {
          ...fixture.runtime.envelope,
          sandboxProfileHash: "drifted",
        },
      },
      governance: fixture.governance,
    });

    expect(failures.some((failure) => failure.code === "TOOL_SNAPSHOT_INCONSISTENT")).toBe(true);
  });

  it("detects binding mutation", () => {
    const fixture = buildResolutionFixture();
    const resolution = resolveExecutionBinding(fixture);
    if (!resolution.binding) throw new Error("binding missing");

    const failures = enforceReplayBinding({
      binding: {
        ...resolution.binding,
        bindingHash: "forged",
      },
      runtime: fixture.runtime,
      governance: fixture.governance,
    });

    expect(failures.some((failure) => failure.code === "TOOL_BINDING_MUTATION_DETECTED")).toBe(true);
  });
});
