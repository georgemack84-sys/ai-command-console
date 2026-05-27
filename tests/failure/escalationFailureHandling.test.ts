import { describe, expect, it } from "vitest";
import { buildGovernanceAwareEscalationRecord } from "@/services/escalation/escalationCoordinationEngine";
import { buildGovernanceAwareEscalationFixture } from "@/tests/escalation/helpers";

describe("escalation failure handling", () => {
  it("fails closed on replay ambiguity", () => {
    const { input } = buildGovernanceAwareEscalationFixture();
    const attacked = Object.freeze({
      ...input,
      freshnessEvaluation: Object.freeze({
        ...input.freshnessEvaluation,
        state: Object.freeze({
          ...input.freshnessEvaluation.state,
          replayIntegrity: "quarantined" as const,
        }),
      }),
    });
    const record = buildGovernanceAwareEscalationRecord(attacked);
    expect(record.decision.resultingState).toBe("fail_closed");
  });

  it("rejects remediation semantics", () => {
    const { input } = buildGovernanceAwareEscalationFixture({
      metadata: Object.freeze({ remediate: true }),
    });
    const record = buildGovernanceAwareEscalationRecord(input);
    expect(record.errors.map((error) => error.code)).toContain("ESCALATION_REMEDIATION_FORBIDDEN");
  });
});
