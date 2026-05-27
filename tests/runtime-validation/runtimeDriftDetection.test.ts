import { describe, expect, it } from "vitest";

import { validateRuntimeDrift } from "@/services/runtime-validation";
import { buildRuntimeValidationFixture } from "./helpers";

describe("runtime drift detection", () => {
  it("stays clean for matching runtime state", () => {
    const result = validateRuntimeDrift(buildRuntimeValidationFixture());
    expect(result.driftDetected).toBe(false);
  });

  it("detects sandbox profile mutation", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeDrift({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        runtime: {
          ...fixture.activeRuntime.runtime,
          envelope: {
            ...fixture.activeRuntime.runtime.envelope,
            sandboxProfileHash: "forged",
          },
        },
      },
    });
    expect(result.driftDetected).toBe(true);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_SANDBOX_DRIFT")).toBe(true);
  });

  it("detects governance drift", () => {
    const fixture = buildRuntimeValidationFixture();
    const result = validateRuntimeDrift({
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        governance: {
          ...fixture.activeRuntime.governance,
          attribution: {
            ...fixture.activeRuntime.governance.attribution,
            governanceHash: "forged",
          },
        },
      },
    });
    expect(result.driftDetected).toBe(true);
    expect(result.failures.some((failure) => failure.code === "RUNTIME_GOVERNANCE_DRIFT")).toBe(true);
  });
});
