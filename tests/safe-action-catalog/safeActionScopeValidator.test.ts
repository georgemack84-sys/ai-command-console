import { describe, expect, it } from "vitest";

import { getSafeActionDefinition, validateSafeActionScope } from "@/services/safe-action-catalog";
import { buildSafeActionFixture } from "./helpers";

describe("safeActionScopeValidator", () => {
  it("allows A0-A2 readiness levels inside the declared scope", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const scope = validateSafeActionScope(readinessProfile, getSafeActionDefinition("safe-action:observe")!);
    expect(scope.state).toBe("allowed");
    expect(scope.allowedNow).toBe(true);
  });

  it("keeps A3-A5 future bound only", () => {
    const { readinessProfile } = buildSafeActionFixture({ autonomyLevel: "A3" });
    const scope = validateSafeActionScope(readinessProfile, getSafeActionDefinition("safe-action:simulate")!);
    expect(scope.state).toBe("future_bound");
    expect(scope.allowedNow).toBe(false);
    expect(scope.futureBound).toBe(true);
  });
});
