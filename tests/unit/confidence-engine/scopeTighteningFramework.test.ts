import { describe, expect, it } from "vitest";
import {
  CONTAINMENT_PRESSURE_WEIGHTS,
  ContainmentPressureCalculator,
  ContainmentReplayService,
  ScopeTighteningEngine,
  calculateContainmentPressure,
  evaluateScopeTightening,
  replayScopeTightening,
  type ScopeTighteningInput,
} from "@/services/confidence-engine/scopeTighteningFramework";

function buildInput(overrides: Partial<ScopeTighteningInput> = {}): ScopeTighteningInput {
  return Object.freeze({
    recommendation_id: "recommendation-53e",
    tenant_id: "tenant-alpha",
    confidence_score: 0.91,
    risk_score: 0.12,
    uncertainty_score: 0.08,
    escalation_pressure: 0.08,
    recommended_escalation: "OBSERVE",
    governance_pressure: 0,
    lineage_integrity: "VALID",
    replay_integrity: "STABLE",
    authority_ambiguity: false,
    approval_instability: false,
    policy_conflict: false,
    recommendation_count: 4,
    branch_count: 3,
    optimization_depth: 2,
    alternative_paths: 3,
    timestamp: "2026-06-01T11:00:00.000Z",
    version: "scope-tightening/v1",
    policy_version: "scope-tightening-policy/v1",
    weight_version: "scope-tightening-weights/v1",
    lineage_tenant_id: "tenant-alpha",
    replay_tenant_id: "tenant-alpha",
    ...overrides,
  } satisfies ScopeTighteningInput);
}

describe("scopeTighteningFramework", () => {
  it("produces identical advisory-only outputs for identical inputs", () => {
    const input = buildInput();

    const first = evaluateScopeTightening(input);
    const second = ScopeTighteningEngine.evaluate(input);

    expect(first).toEqual(second);
    expect(first.advisory_only).toBe(true);
    expect(first.execution_permitted).toBe(false);
    expect(first.authority_changed).toBe(false);
    expect(first.mutation_performed).toBe(false);
    expect(first.may_expand_scope).toBe(false);
  });

  it("replays containment recommendations deterministically in read-only mode", () => {
    const input = buildInput({
      escalation_pressure: 0.7,
      recommended_escalation: "CONSTITUTIONAL_REVIEW",
    });
    const recommendation = evaluateScopeTightening(input);
    const replay = replayScopeTightening({ sourceInput: input, expected: recommendation });

    expect(replay.replay_mode).toBe("READ_ONLY");
    expect(replay.reproduced).toBe(true);
    expect(ContainmentReplayService.replay({ sourceInput: input, expected: recommendation })).toEqual(replay);
  });

  it("keeps lineage immutable and weights versioned", () => {
    const input = buildInput({ uncertainty_score: 0.5 });
    const factors = calculateContainmentPressure(input);
    const viaComponent = ContainmentPressureCalculator.calculate(input);
    const recommendation = evaluateScopeTightening(input);

    expect(factors).toEqual(viaComponent);
    expect(Object.isFrozen(recommendation.lineage)).toBe(true);
    expect(recommendation.lineage.lineage_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(recommendation.lineage.weight_version).toBe("scope-tightening-weights/v1");
    expect(CONTAINMENT_PRESSURE_WEIGHTS.version).toBe("scope-tightening-weights/v1");
    expect(recommendation.policy_references).toContain("scope-tightening-policy/v1");
  });

  it("narrows outputs when uncertainty increases", () => {
    const low = evaluateScopeTightening(buildInput({
      uncertainty_score: 0.1,
      recommendation_count: 4,
      branch_count: 4,
      alternative_paths: 4,
    }));
    const high = evaluateScopeTightening(buildInput({
      uncertainty_score: 0.9,
      recommendation_count: 4,
      branch_count: 4,
      alternative_paths: 4,
    }));

    expect(low.containment_level).not.toBe("FREEZE_RECOMMENDATIONS");
    expect(high.containment_level).toBe("FREEZE_RECOMMENDATIONS");
    expect(high.scope_limit).toBeLessThanOrEqual(low.scope_limit);
    expect(high.branch_limit).toBeLessThanOrEqual(low.branch_limit);
    expect(high.alternative_limit).toBeLessThanOrEqual(low.alternative_limit);
  });

  it("constrains recommendations on governance conflict", () => {
    const recommendation = evaluateScopeTightening(buildInput({
      governance_pressure: 1,
      recommended_escalation: "GOVERNANCE_REVIEW",
      recommendation_count: 6,
      branch_count: 4,
      alternative_paths: 4,
    }));

    expect(["LIMIT_SCOPE", "STRICT_SCOPE", "MINIMAL_SCOPE", "FREEZE_RECOMMENDATIONS"]).toContain(
      recommendation.containment_level,
    );
    expect(recommendation.reason_codes).toContain("GOVERNANCE_CONFLICT");
    expect(recommendation.scope_limit).toBeLessThanOrEqual(6);
    expect(recommendation.alternative_limit).toBeLessThanOrEqual(4);
  });

  it("reduces authority ambiguity to minimal scope without changing authority", () => {
    const recommendation = evaluateScopeTightening(buildInput({
      authority_ambiguity: true,
      recommendation_count: 5,
      branch_count: 5,
      optimization_depth: 5,
      alternative_paths: 5,
    }));

    expect(recommendation.containment_level).toBe("MINIMAL_SCOPE");
    expect(recommendation.scope_limit).toBe(1);
    expect(recommendation.branch_limit).toBe(1);
    expect(recommendation.optimization_limit).toBe(1);
    expect(recommendation.alternative_limit).toBe(1);
    expect(recommendation.may_change_authority).toBe(false);
  });

  it("fails closed on lineage corruption and replay mismatch", () => {
    const lineage = evaluateScopeTightening(buildInput({ lineage_integrity: "CORRUPTED" }));
    const replay = evaluateScopeTightening(buildInput({ replay_integrity: "MISMATCHED" }));

    expect(lineage.containment_level).toBe("FREEZE_RECOMMENDATIONS");
    expect(lineage.reason_codes).toContain("LINEAGE_CORRUPTED");
    expect(replay.containment_level).toBe("FREEZE_RECOMMENDATIONS");
    expect(replay.reason_codes).toContain("REPLAY_MISMATCH");
  });

  it("preserves tenant isolation and fails closed on cross-tenant leakage", () => {
    const recommendation = evaluateScopeTightening(buildInput({
      replay_tenant_id: "tenant-beta",
    }));

    expect(recommendation.tenant_isolated).toBe(false);
    expect(recommendation.containment_level).toBe("FREEZE_RECOMMENDATIONS");
    expect(recommendation.reason_codes).toContain("TENANT_ISOLATION_VIOLATION");
  });

  it("blocks scope expansion under every containment level", () => {
    const cases = [
      buildInput(),
      buildInput({ recommended_escalation: "REVIEW", escalation_pressure: 0.4 }),
      buildInput({ recommended_escalation: "CONSTITUTIONAL_REVIEW", escalation_pressure: 0.7 }),
      buildInput({ authority_ambiguity: true }),
      buildInput({ lineage_integrity: "MISSING" }),
    ];

    for (const input of cases) {
      const recommendation = evaluateScopeTightening(input);

      expect(recommendation.scope_limit).toBeLessThanOrEqual(input.recommendation_count);
      expect(recommendation.branch_limit).toBeLessThanOrEqual(input.branch_count);
      expect(recommendation.optimization_limit).toBeLessThanOrEqual(input.optimization_depth);
      expect(recommendation.alternative_limit).toBeLessThanOrEqual(input.alternative_paths);
      expect(recommendation.certification.scope_expansion_blocked).toBe(true);
    }
  });

  it("keeps hidden containment impossible through authority fields", () => {
    const recommendation = evaluateScopeTightening(buildInput({
      recommended_escalation: "FREEZE_REQUIRED",
      escalation_pressure: 1,
    }));

    expect(recommendation.containment_level).toBe("FREEZE_RECOMMENDATIONS");
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
      uncertainty_score: 0.65,
      recommendation_count: 7,
    });
    const before = JSON.stringify(input);

    evaluateScopeTightening(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
