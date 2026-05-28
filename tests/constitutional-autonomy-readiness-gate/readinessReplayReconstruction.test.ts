import { describe, expect, it } from "vitest";
import { reconstructReadinessReplay } from "@/services/constitutional-autonomy-readiness-gate";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("reconstructReadinessReplay", () => {
  it("reconstructs certification deterministically", () => {
    const { gate } = buildConstitutionalReadinessGateFixture();
    expect(reconstructReadinessReplay(gate.certification)).toEqual(gate.certification);
  });
});
