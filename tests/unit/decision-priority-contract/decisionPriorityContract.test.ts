import { describe, expect, it } from "vitest";
import {
  buildDecisionPriorityExplanation,
  buildDecisionPriorityObservability,
  computeDecisionPriorityIntegrityHash,
  createDecisionPriority,
  createPriorityScoringProfile,
  getPriorityEvaluationContractFoundation,
  replayDecisionPriority,
  transitionDecisionPriorityLifecycle,
  validateDecisionPriority,
} from "@/services/decision-priority-contract";

describe("Mission Control Phase 9.5.1 Priority Evaluation Contract", () => {
  it("creates the canonical immutable DecisionPriority contract", () => {
    const foundation = getPriorityEvaluationContractFoundation();

    expect(foundation.priority_version).toBe("priority-evaluation-contract/v1");
    expect(foundation.factors).toEqual([
      "mission_score",
      "urgency_score",
      "risk_score",
      "confidence_score",
      "governance_score",
      "runtime_score",
      "recovery_score",
      "forecast_score",
      "operator_score",
      "dependency_score",
    ]);
    expect(foundation.states).toEqual(["CRITICAL", "HIGH", "MODERATE", "LOW", "DEFERRED", "BLOCKED", "REJECTED"]);
    expect(foundation.lifecycle).toEqual(["REGISTERED", "VALIDATED", "SCORING", "RANKED", "EXPLAINED", "CERTIFIED", "RECORDED"]);
    expect(foundation.priority.advisory_only).toBe(true);
    expect(foundation.priority.total_priority_score).toBeGreaterThan(0);
    expect(foundation.validation.validation_state).toBe("VALID");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("serializes, scores, and hashes deterministically for identical inputs", () => {
    const first = createDecisionPriority();
    const second = createDecisionPriority();
    const explanation = buildDecisionPriorityExplanation(first);

    expect(first).toEqual(second);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(computeDecisionPriorityIntegrityHash(first)).toBe(first.integrity_hash);
    expect(explanation.priority_id).toBe(first.priority_id);
    expect(explanation.factor_contributions.governance_score).toBe(8.2);
  });

  it("classifies priority states deterministically from composite scores and forced terminal states", () => {
    const profile = createPriorityScoringProfile();
    const critical = createDecisionPriority({ scoring_profile: profile, scores: Object.fromEntries(["mission_score", "urgency_score", "risk_score", "confidence_score", "governance_score", "runtime_score", "recovery_score", "forecast_score", "operator_score", "dependency_score"].map((factor) => [factor, 95])) });
    const high = createDecisionPriority({ scoring_profile: profile, scores: { mission_score: 75, urgency_score: 75, risk_score: 75, confidence_score: 75, governance_score: 75, runtime_score: 75, recovery_score: 75, forecast_score: 75, operator_score: 75, dependency_score: 75 } });
    const moderate = createDecisionPriority({ scoring_profile: profile, scores: { mission_score: 45, urgency_score: 45, risk_score: 45, confidence_score: 45, governance_score: 45, runtime_score: 45, recovery_score: 45, forecast_score: 45, operator_score: 45, dependency_score: 45 } });
    const blocked = createDecisionPriority({ forced_state: "BLOCKED" });
    const rejected = createDecisionPriority({ forced_state: "REJECTED" });

    expect(critical.priority_state).toBe("CRITICAL");
    expect(high.priority_state).toBe("HIGH");
    expect(moderate.priority_state).toBe("MODERATE");
    expect(blocked.priority_state).toBe("BLOCKED");
    expect(rejected.priority_state).toBe("REJECTED");
  });

  it("fails closed for missing references, invalid scores, integrity mismatch, constitutional violation, tenant leak, and hidden scoring", () => {
    const missingGovernance = createDecisionPriority({ governance_refs: [] });
    const missingReplay = createDecisionPriority({ replay_refs: [] });
    const invalidScore = createDecisionPriority({ scores: { mission_score: 101 } });
    const tampered = { ...createDecisionPriority(), total_priority_score: 1 };
    const constitutional = createDecisionPriority({ constitutional_refs: ["constitutional_violation_detected"] });
    const tenantLeak = createDecisionPriority({ evidence_refs: ["evidence_tenant_beta_leak"] });
    const hidden = createDecisionPriority({ hidden_scoring_refs: ["hidden"] });

    expect(validateDecisionPriority(missingGovernance).failures).toContain("MISSING_GOVERNANCE_REFERENCES");
    expect(validateDecisionPriority(missingReplay).failures).toContain("MISSING_REPLAY_REFERENCES");
    expect(validateDecisionPriority(invalidScore).failures).toContain("SCORE_OUT_OF_RANGE");
    expect(validateDecisionPriority(tampered).failures).toContain("INTEGRITY_HASH_MISMATCH");
    expect(validateDecisionPriority(constitutional).failures).toContain("CONSTITUTIONAL_VIOLATION");
    expect(validateDecisionPriority(tenantLeak).failures).toContain("TENANT_ISOLATION_VIOLATION");
    expect(hidden.priority_state).toBe("REJECTED");
    expect(hidden.explanation_ref).toBe("hidden_scoring_rejected");
  });

  it("replays priority objects and enforces lifecycle order", () => {
    const priority = createDecisionPriority();
    const replay = replayDecisionPriority(priority);
    const validTransition = transitionDecisionPriorityLifecycle(priority, "VALIDATED");
    const invalidTransition = transitionDecisionPriorityLifecycle(priority, "CERTIFIED");

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(priority.integrity_hash);
    expect(replay.reconstructed_total_priority_score).toBe(priority.total_priority_score);
    expect(validTransition.transition_valid).toBe(true);
    expect(invalidTransition.transition_valid).toBe(false);
  });

  it("publishes observability for priority validation outcomes", () => {
    const valid = createDecisionPriority();
    const invalid = { ...valid, integrity_hash: "tampered" };
    const noGovernance = createDecisionPriority({ governance_refs: [] });

    const metrics = buildDecisionPriorityObservability([valid, invalid, noGovernance]);

    expect(metrics.priority_objects_created).toBe(3);
    expect(metrics.validation_failures).toBe(2);
    expect(metrics.integrity_failures).toBeGreaterThan(0);
    expect(metrics.governance_failures).toBeGreaterThan(0);
    expect(metrics.average_priority_score).toBeGreaterThan(0);
    expect(metrics.state_distribution.MODERATE).toBeGreaterThan(0);
  });
});
