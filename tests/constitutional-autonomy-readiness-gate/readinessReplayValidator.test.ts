import { describe, expect, it } from "vitest";
import { validateReadinessReplay } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("validateReadinessReplay", () => {
  it("verifies deterministic replay integrity", () => {
    const { input } = buildConstitutionalReadinessGateFixture();
    const result = validateReadinessReplay(input);
    expect(result.replayValid).toBe(true);
  });
});
