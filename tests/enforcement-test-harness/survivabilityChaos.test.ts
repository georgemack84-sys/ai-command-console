import { describe, expect, it } from "vitest";
import { runSurvivabilityChaosHarness } from "@/services/enforcement-test-harness";
import { buildEnforcementHarnessFixture } from "./helpers";

describe("survivability chaos harness", () => {
  it("preserves observability while keeping execution denied", () => {
    const [result] = runSurvivabilityChaosHarness(buildEnforcementHarnessFixture());

    expect(result).toBeDefined();
    expect(result?.contained).toBe(true);
    expect(result?.denied).toBe(true);
    expect(result?.certificationEligible).toBe(true);
  });
});
