import { describe, expect, it } from "vitest";
import { buildConstitutionalEscalationFixture } from "./helpers";

describe("buildConstitutionalEscalation", () => {
  it("builds a derived-only escalation recommendation deterministically", () => {
    const first = buildConstitutionalEscalationFixture();
    const second = buildConstitutionalEscalationFixture();

    expect(first.escalation.derivedOnly).toBe(true);
    expect(first.escalation.recommendation.executable).toBe(false);
    expect(first.escalation.escalationHash).toBe(second.escalation.escalationHash);
  });
});
