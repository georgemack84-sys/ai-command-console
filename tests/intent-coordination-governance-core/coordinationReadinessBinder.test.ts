import { describe, expect, it } from "vitest";

import { bindCoordinationReadiness } from "@/services/intent-coordination-governance-core/coordinationReadinessBinder";
import { buildIntentCoordinationGovernanceFixture } from "./helpers";

describe("coordination readiness binder", () => {
  it("requires valid upstream readiness certification", () => {
    const { input } = buildIntentCoordinationGovernanceFixture();
    const result = bindCoordinationReadiness(input.readinessGate);
    expect(result.errors).toEqual([]);
    expect(result.readinessValid).toBe(true);
  });
});
