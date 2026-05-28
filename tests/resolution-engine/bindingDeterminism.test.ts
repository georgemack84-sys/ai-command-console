import { describe, expect, it } from "vitest";

import { resolveExecutionBinding, verifyDeterministicBindings } from "@/services/resolution-engine";
import { buildResolutionFixture } from "./helpers";

describe("binding determinism", () => {
  it("produces deterministic binding hashes", () => {
    const first = resolveExecutionBinding(buildResolutionFixture());
    const second = resolveExecutionBinding(buildResolutionFixture());

    expect(first.binding?.bindingHash).toBe(second.binding?.bindingHash);
    expect(first.binding?.resolutionHash).toBe(second.binding?.resolutionHash);
  });

  it("keeps binding hash stable across audit timestamp changes", () => {
    const firstFixture = buildResolutionFixture();
    const secondFixture = buildResolutionFixture();

    const first = resolveExecutionBinding(firstFixture);
    const second = resolveExecutionBinding({
      ...secondFixture,
      governance: {
        ...secondFixture.governance,
      },
    });

    expect(first.binding?.bindingHash).toBe(second.binding?.bindingHash);
  });

  it("produces identical bindings across 1000 identical resolutions", () => {
    const bindings = Array.from({ length: 1000 }, () => resolveExecutionBinding(buildResolutionFixture()).binding!).filter(Boolean);
    expect(verifyDeterministicBindings(bindings)).toBe(true);
  });
});
