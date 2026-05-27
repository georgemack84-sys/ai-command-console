import { describe, expect, it } from "vitest";
import { reconstructEscalationReplay } from "@/services/constitutional-escalation-layer";
import { buildConstitutionalEscalationFixture } from "./helpers";

describe("reconstructEscalationReplay", () => {
  it("reconstructs the recommendation deterministically", () => {
    const { escalation } = buildConstitutionalEscalationFixture();
    expect(reconstructEscalationReplay(escalation.recommendation)).toEqual(escalation.recommendation);
  });
});
