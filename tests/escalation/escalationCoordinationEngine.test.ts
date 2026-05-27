import { describe, expect, it } from "vitest";
import { buildGovernanceAwareEscalationRecord } from "@/services/escalation/escalationCoordinationEngine";
import { buildGovernanceAwareEscalationFixture } from "./helpers";

describe("governance-aware escalation coordination engine", () => {
  it("produces deterministic advisory escalation output", () => {
    const { input } = buildGovernanceAwareEscalationFixture();
    const left = buildGovernanceAwareEscalationRecord(input);
    const right = buildGovernanceAwareEscalationRecord(input);
    expect(left.escalationHash).toBe(right.escalationHash);
    expect(left.decision).toEqual(right.decision);
  });

  it("does not mutate input", () => {
    const { input } = buildGovernanceAwareEscalationFixture();
    const before = JSON.stringify(input);
    buildGovernanceAwareEscalationRecord(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
