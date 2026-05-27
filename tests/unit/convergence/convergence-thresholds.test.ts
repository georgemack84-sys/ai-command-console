import { describe, expect, it } from "vitest";

import { getConvergenceThresholds } from "@/services/convergence/convergenceThresholds";

describe("getConvergenceThresholds", () => {
  it("returns deterministic thresholds", () => {
    expect(getConvergenceThresholds()).toEqual(getConvergenceThresholds());
  });
});
