import { describe, expect, it } from "vitest";
import {
  detectStrategicDrift,
  getStrategicDriftDetectionFoundation,
  replayStrategicDriftDetection,
} from "@/services/strategic-drift-detection";
import type {
  StrategicDriftFailure,
  StrategicDriftScenario,
  StrategicDriftStatus,
} from "@/types/strategic-drift-detection";

describe("Mission Control Phase 10.12.2 Strategic Drift Detection", () => {
  it("publishes the strategic drift detection contract", () => {
    const foundation = getStrategicDriftDetectionFoundation();

    expect(foundation.strategic_drift_detection_version).toBe("strategic-drift-detection/v1");
    expect(foundation.api_surface.detect_strategic_drift).toBe("POST /strategic-drift-detection/detect");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /strategic-drift-detection/baseline");
    expect(foundation.api_surface.retrieve_comparison).toBe("POST /strategic-drift-detection/comparison");
    expect(foundation.api_surface.retrieve_evidence).toBe("POST /strategic-drift-detection/evidence");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /strategic-drift-detection/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.autonomous_containment_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.detector_identifier).toBe("StrategicDriftDetection");
    expect(foundation.result.status).toBe("PASS");
  });

  it("detects deterministically with stable replay and integrity hashes", () => {
    const first = detectStrategicDrift();
    const second = detectStrategicDrift();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.comparison.integrity_hash).toBe(second.comparison.integrity_hash);
    expect(first.philosophy_profile.integrity_hash).toBe(second.philosophy_profile.integrity_hash);
    expect(first.hidden_optimization.integrity_hash).toBe(second.hidden_optimization.integrity_hash);
    expect(first.stability_analysis.integrity_hash).toBe(second.stability_analysis.integrity_hash);
    expect(first.variance_report.integrity_hash).toBe(second.variance_report.integrity_hash);
    expect(first.evidence_package.integrity_hash).toBe(second.evidence_package.integrity_hash);
    expect(first.drift_record.integrity_hash).toBe(second.drift_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayStrategicDriftDetection(first)).toBe(true);
  });

  it("registers the immutable approved strategic baseline", () => {
    const baseline = detectStrategicDrift().baseline;

    expect(baseline.baseline_id).toBe("strategic_baseline_mission_control_v1");
    expect(baseline.strategy_version).toBe("strategy/v1");
    expect(baseline.mission_scope).toBe("mission-control-adaptive-intelligence");
    expect(baseline.approved_priorities).toEqual(expect.arrayContaining(["constitutional_safety", "governance_compliance", "operator_authority"]));
    expect(baseline.decision_weights).toContain("constitution:1.00");
    expect(baseline.optimization_constraints).toEqual(expect.arrayContaining(["no_objective_substitution", "no_reward_hacking", "no_production_mutation"]));
    expect(baseline.governance_requirements).toContain("governance_approval_required");
    expect(baseline.constitutional_requirements).toContain("tenant_isolation_required");
    expect(baseline.approval_reference).toBe("governance-approval:strategic-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("compares current strategy against recommendation, objective, governance, and history dimensions", () => {
    const result = detectStrategicDrift();

    expect(result.comparison.strategy_difference_matrix).toEqual([
      "recommendation_priorities",
      "decision_ordering",
      "objective_weighting",
      "mission_alignment",
      "governance_alignment",
      "constitutional_alignment",
      "optimization_emphasis",
      "historical_consistency",
    ]);
    expect(result.comparison.priority_shift_report).toContain("No unauthorized");
    expect(result.comparison.objective_alignment_report).toContain("aligned");
    expect(result.comparison.strategic_consistency_score).toBeGreaterThan(0.9);
    expect(result.metrics.strategic_drift_score).toBe(0.04);
  });

  it("analyzes recommendation philosophy and hidden optimization patterns", () => {
    const result = detectStrategicDrift();

    expect(result.philosophy_profile.evaluated_dimensions).toEqual([
      "recommendation_rationale",
      "objective_prioritization",
      "evidence_utilization",
      "confidence_weighting",
      "risk_tolerance",
      "escalation_behavior",
      "governance_sensitivity",
      "operator_influence",
    ]);
    expect(result.philosophy_profile.philosophy_stability_score).toBe(0.98);
    expect(result.hidden_optimization.detected_patterns).toEqual([]);
    expect(result.hidden_optimization.objective_shift_analysis).toContain("No reward hacking");
    expect(result.hidden_optimization.hidden_optimization_score).toBe(0.03);
  });

  it("calculates reproducible stability and variance reports", () => {
    const result = detectStrategicDrift();

    expect(result.stability_analysis.strategic_stability_score).toBe(0.96);
    expect(result.stability_analysis.stability_timeline).toEqual(["baseline:v1", "observation:t1", "observation:t2", "detection:current"]);
    expect(result.variance_report.strategic_distance).toBe(0.04);
    expect(result.variance_report.strategic_divergence_matrix).toEqual([
      "strategic_distance",
      "priority_variance",
      "objective_variance",
      "recommendation_variance",
      "governance_variance",
      "policy_variance",
      "optimization_variance",
    ]);
  });

  it("generates complete immutable replayable evidence", () => {
    const evidence = detectStrategicDrift().evidence_package;

    expect(evidence.supporting_recommendations).toHaveLength(2);
    expect(evidence.affected_missions).toContain("mission:adaptive-intelligence");
    expect(evidence.baseline_comparisons.every((item) => /[a-f0-9]{64}/.test(item))).toBe(true);
    expect(evidence.decision_lineage).toContain("decision-lineage:current-recommendations");
    expect(evidence.governance_evaluations).toContain("governance:authority-verification");
    expect(evidence.constitutional_evaluations).toContain("constitutional:tenant-isolation");
    expect(evidence.replay_references).toContain("replay:strategic-drift-detection");
    expect(evidence.operator_decisions).toContain("operator:review-available");
    expect(evidence.simulation_outcomes).toContain("simulation:phase-10.11-certified");
    expect(evidence.immutable).toBe(true);
    expect(evidence.deterministic).toBe(true);
    expect(evidence.replayable).toBe(true);
    expect(evidence.cryptographically_verifiable).toBe(true);
    expect(evidence.audit_ready).toBe(true);
  });

  it("writes the canonical StrategicDriftRecord ledger entry", () => {
    const record = detectStrategicDrift({ tenant_id: "tenant-alpha" }).drift_record;

    expect(record.drift_id).toMatch(/^strategic_drift_/);
    expect(record.tenant_id).toBe("tenant-alpha");
    expect(record.baseline_ref).toMatch(/[a-f0-9]{64}/);
    expect(record.strategy_version).toBe("strategy/v1");
    expect(record.drift_category).toBe("STRATEGIC_DRIFT");
    expect(record.drift_score).toBe(0.04);
    expect(record.variance_score).toBe(0.04);
    expect(record.stability_score).toBe(0.96);
    expect(record.severity).toBe("INFORMATIONAL");
    expect(record.supporting_evidence).toMatch(/[a-f0-9]{64}/);
    expect(record.recommended_response).toBe("MONITOR");
    expect(record.containment_required).toBe(false);
    expect(record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("exposes operator review, replay, simulation, escalation, containment, rejection, and certification controls", () => {
    const visibility = detectStrategicDrift().operator_visibility;

    expect(visibility.displayed_fields).toEqual(expect.arrayContaining([
      "detected_drift",
      "affected_strategy",
      "strategic_baseline_comparison",
      "variance_analysis",
      "supporting_evidence",
      "governance_impact",
      "constitutional_impact",
      "replay_links",
    ]));
    expect(visibility.operator_capabilities).toEqual(expect.arrayContaining([
      "review_evidence",
      "initiate_replay",
      "request_simulation",
      "escalate_governance_review",
      "approve_containment",
      "reject_recommendations",
      "require_certification",
    ]));
    expect(visibility.governance_impact_visible).toBe(true);
    expect(visibility.constitutional_impact_visible).toBe(true);
    expect(visibility.replay_links_visible).toBe(true);
  });

  it("preserves governance, constitutional, operator, tenant, replay, and advisory invariants", () => {
    const result = detectStrategicDrift();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_production_change).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_STRATEGY_CHANGE", "UNAUTHORIZED_STRATEGY_CHANGE", "DRIFT_DETECTED"],
    ["MISSING_GOVERNANCE_APPROVAL", "MISSING_GOVERNANCE_APPROVAL", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_CONFLICT", "CONSTITUTIONAL_CONFLICT", "FAIL_CLOSED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_CLASSIFICATION", "DRIFT_DETECTED"],
    ["UNEXPLAINED_DRIFT", "UNEXPLAINED_STRATEGIC_DRIFT", "DRIFT_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_EVIDENCE", "DRIFT_DETECTED"],
    ["HIDDEN_OPTIMIZATION", "HIDDEN_OPTIMIZATION_DETECTED", "DRIFT_DETECTED"],
    ["OBJECTIVE_SUBSTITUTION", "OBJECTIVE_SUBSTITUTION_DETECTED", "DRIFT_DETECTED"],
    ["RECOMMENDATION_BIAS", "RECOMMENDATION_BIAS_DETECTED", "DRIFT_DETECTED"],
    ["GOVERNANCE_SENSITIVITY_REDUCTION", "GOVERNANCE_SENSITIVITY_REDUCTION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_SENSITIVITY_REDUCTION", "CONSTITUTIONAL_SENSITIVITY_REDUCTION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_ATTEMPT", "FAIL_CLOSED"],
    ["UNKNOWN_STRATEGY", "UNKNOWN_STRATEGIC_BEHAVIOR", "FAIL_CLOSED"],
  ] as const)("classifies %s deterministically", (scenario: StrategicDriftScenario, failure: StrategicDriftFailure, status: StrategicDriftStatus) => {
    const result = detectStrategicDrift({ scenario });

    expect(result.status).toBe(status);
    expect(result.failures).toContain(failure);
    expect(result.drift_record.drift_category).toBe("STRATEGIC_DRIFT");
    expect(result.authorizes_production_change).toBe(false);
    expect(replayStrategicDriftDetection(result)).toBe(true);
  });

  it("escalates hidden optimization and objective substitution without authorizing implementation", () => {
    const hidden = detectStrategicDrift({ scenario: "HIDDEN_OPTIMIZATION" });
    const objective = detectStrategicDrift({ scenario: "OBJECTIVE_SUBSTITUTION" });

    expect(hidden.hidden_optimization.detected_patterns).toContain("HIDDEN_OPTIMIZATION_DETECTED");
    expect(hidden.drift_record.severity).toBe("HIGH");
    expect(hidden.drift_record.recommended_response).toBe("SUPPRESS_ADAPTATION");
    expect(hidden.drift_record.containment_required).toBe(true);
    expect(objective.comparison.objective_alignment_report).toContain("Objective substitution detected");
    expect(objective.authorizes_production_change).toBe(false);
  });

  it("marks degraded determinism, explanation, replay, governance, constitutional, and tenant guarantees", () => {
    expect(detectStrategicDrift({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    expect(detectStrategicDrift({ scenario: "UNEXPLAINED_DRIFT" }).explainable).toBe(false);
    expect(detectStrategicDrift({ scenario: "NONREPLAYABLE_EVIDENCE" }).replayable).toBe(false);
    expect(detectStrategicDrift({ scenario: "GOVERNANCE_SENSITIVITY_REDUCTION" }).governance_preserved).toBe(false);
    expect(detectStrategicDrift({ scenario: "CONSTITUTIONAL_SENSITIVITY_REDUCTION" }).constitutional_preserved).toBe(false);
    expect(detectStrategicDrift({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("detects nested strategic drift evidence tampering", () => {
    const result = detectStrategicDrift();
    const tampered = {
      ...result,
      evidence_package: {
        ...result.evidence_package,
        supporting_recommendations: result.evidence_package.supporting_recommendations.slice(1),
      },
    };

    expect(replayStrategicDriftDetection(tampered)).toBe(false);
  });
});
