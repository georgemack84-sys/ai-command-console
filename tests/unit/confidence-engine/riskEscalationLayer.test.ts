import { describe, expect, it } from "vitest";
import {
  evaluateRiskEscalation,
  replayRiskEscalation,
  calculateEscalationPressure,
  ESCALATION_PRESSURE_WEIGHTS,
  RiskEscalationEngine,
  EscalationPressureCalculator,
  EscalationReplayService,
  type RiskEscalationInput,
} from "@/services/confidence-engine/riskEscalationLayer";

function buildInput(overrides: Partial<RiskEscalationInput> = {}): RiskEscalationInput {
  return Object.freeze({
    confidence_score: 0.92,
    confidence_collapse: false,
    risk_score: 0.12,
    uncertainty_score: 0.08,
    lineage_integrity: "VALID",
    replay_integrity: "STABLE",
    governance_conflict: false,
    approval_instability: false,
    authority_ambiguity: false,
    policy_conflict: false,
    evidence_completeness: 1,
    recommendation_scope: "NARROW",
    tenant_id: "tenant-alpha",
    recommendation_id: "recommendation-53d",
    timestamp: "2026-06-01T10:00:00.000Z",
    version: "risk-escalation/v1",
    policy_version: "risk-escalation-policy/v1",
    weight_version: "risk-escalation-weights/v1",
    lineage_tenant_id: "tenant-alpha",
    replay_tenant_id: "tenant-alpha",
    ...overrides,
  } satisfies RiskEscalationInput);
}

describe("riskEscalationLayer", () => {
  it("returns identical outputs for identical immutable inputs", () => {
    const input = buildInput();

    const first = evaluateRiskEscalation(input);
    const second = RiskEscalationEngine.evaluate(input);

    expect(first).toEqual(second);
    expect(first.recommended_escalation).toBe("OBSERVE");
    expect(first.advisory_only).toBe(true);
    expect(first.execution_permitted).toBe(false);
    expect(first.authority_changed).toBe(false);
    expect(first.mutation_performed).toBe(false);
  });

  it("replays recommendations identically in read-only mode", () => {
    const input = buildInput({
      uncertainty_score: 0.7,
      risk_score: 0.55,
    });
    const recommendation = evaluateRiskEscalation(input);
    const replay = replayRiskEscalation({
      sourceInput: input,
      expected: recommendation,
    });

    expect(replay.replay_mode).toBe("READ_ONLY");
    expect(replay.reproduced).toBe(true);
    expect(EscalationReplayService.replay({ sourceInput: input, expected: recommendation })).toEqual(replay);
  });

  it("preserves immutable lineage and deterministic pressure calculations", () => {
    const input = buildInput({
      risk_score: 0.4,
      uncertainty_score: 0.3,
    });
    const factors = calculateEscalationPressure(input);
    const viaComponent = EscalationPressureCalculator.calculate(input);
    const recommendation = evaluateRiskEscalation(input);

    expect(factors).toEqual(viaComponent);
    expect(Object.isFrozen(recommendation.lineage)).toBe(true);
    expect(recommendation.lineage.lineage_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(recommendation.pressure_weights).toEqual(ESCALATION_PRESSURE_WEIGHTS);
    expect(recommendation.pressure_weights.version).toBe("risk-escalation-weights/v1");
    expect(recommendation.policy_references).toContain("risk-escalation-policy/v1");
  });

  it("escalates governance conflicts into governance review", () => {
    const recommendation = evaluateRiskEscalation(buildInput({
      governance_conflict: true,
      risk_score: 0.3,
    }));

    expect(recommendation.recommended_escalation).toBe("GOVERNANCE_REVIEW");
    expect(recommendation.reason_codes).toContain("GOVERNANCE_CONFLICT");
    expect(recommendation.governance_pressure).toBe(1);
  });

  it("escalates confidence collapse into review or stronger containment", () => {
    const recommendation = evaluateRiskEscalation(buildInput({
      confidence_score: 0.25,
      confidence_collapse: true,
    }));

    expect(["REVIEW", "GOVERNANCE_REVIEW", "CONSTITUTIONAL_REVIEW", "FREEZE_REQUIRED"]).toContain(
      recommendation.recommended_escalation,
    );
    expect(recommendation.reason_codes).toContain("CONFIDENCE_COLLAPSE");
  });

  it("escalates authority ambiguity without granting authority", () => {
    const recommendation = evaluateRiskEscalation(buildInput({
      authority_ambiguity: true,
    }));

    expect(recommendation.recommended_escalation).toBe("CONSTITUTIONAL_REVIEW");
    expect(recommendation.reason_codes).toContain("AUTHORITY_AMBIGUITY");
    expect(recommendation.may_change_authority).toBe(false);
  });

  it("fails closed when lineage is missing or corrupted", () => {
    const missing = evaluateRiskEscalation(buildInput({
      lineage_integrity: "MISSING",
    }));
    const corrupted = evaluateRiskEscalation(buildInput({
      lineage_integrity: "CORRUPTED",
    }));

    expect(missing.recommended_escalation).toBe("FREEZE_REQUIRED");
    expect(missing.reason_codes).toContain("LINEAGE_MISSING");
    expect(corrupted.recommended_escalation).toBe("FREEZE_REQUIRED");
    expect(corrupted.reason_codes).toContain("LINEAGE_CORRUPTED");
  });

  it("fails closed on replay mismatch and approval or policy unknowns", () => {
    const replay = evaluateRiskEscalation(buildInput({
      replay_integrity: "MISMATCHED",
    }));
    const approval = evaluateRiskEscalation(buildInput({
      approval_instability: "UNKNOWN",
    }));
    const policy = evaluateRiskEscalation(buildInput({
      policy_conflict: "UNKNOWN",
    }));

    expect(replay.recommended_escalation).toBe("FREEZE_REQUIRED");
    expect(approval.recommended_escalation).toBe("FREEZE_REQUIRED");
    expect(policy.recommended_escalation).toBe("FREEZE_REQUIRED");
  });

  it("preserves tenant isolation and fails closed on cross-tenant leakage", () => {
    const recommendation = evaluateRiskEscalation(buildInput({
      lineage_tenant_id: "tenant-beta",
    }));

    expect(recommendation.tenant_isolated).toBe(false);
    expect(recommendation.recommended_escalation).toBe("FREEZE_REQUIRED");
    expect(recommendation.reason_codes).toContain("TENANT_ISOLATION_VIOLATION");
  });

  it("keeps hidden escalation and execution impossible through authority fields", () => {
    const recommendation = evaluateRiskEscalation(buildInput({
      governance_conflict: true,
      authority_ambiguity: true,
      replay_integrity: "UNSTABLE",
    }));

    expect(recommendation.may_execute).toBe(false);
    expect(recommendation.may_schedule).toBe(false);
    expect(recommendation.may_mutate_state).toBe(false);
    expect(recommendation.may_change_approval).toBe(false);
    expect(recommendation.may_change_authority).toBe(false);
    expect(recommendation.may_route_workflow).toBe(false);
    expect(recommendation.may_freeze).toBe(false);
  });

  it("does not mutate source inputs", () => {
    const input = buildInput({
      uncertainty_score: 0.8,
      evidence_completeness: 0.6,
    });
    const before = JSON.stringify(input);

    evaluateRiskEscalation(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
