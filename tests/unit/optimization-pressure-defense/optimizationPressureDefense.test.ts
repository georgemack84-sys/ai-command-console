import { describe, expect, it } from "vitest";
import {
  defendOptimizationPressure,
  getOptimizationPressureFoundation,
  replayOptimizationPressureDefense,
} from "@/services/optimization-pressure-defense";
import type {
  OptimizationPressureFailure,
  OptimizationPressureScenario,
  OptimizationPressureStatus,
} from "@/types/optimization-pressure-defense";

describe("Mission Control Phase 10.12.8 Optimization Pressure Defense", () => {
  it("publishes the optimization pressure defense contract", () => {
    const foundation = getOptimizationPressureFoundation();

    expect(foundation.optimization_pressure_defense_version).toBe("optimization-pressure-defense/v1");
    expect(foundation.api_surface.defend_optimization_pressure).toBe("POST /optimization-pressure-defense/defend");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /optimization-pressure-defense/baseline");
    expect(foundation.api_surface.retrieve_objective_alignment).toBe("POST /optimization-pressure-defense/objective-alignment");
    expect(foundation.api_surface.retrieve_reward_hacking).toBe("POST /optimization-pressure-defense/reward-hacking");
    expect(foundation.api_surface.retrieve_metric_integrity).toBe("POST /optimization-pressure-defense/metric-integrity");
    expect(foundation.api_surface.retrieve_governance_tradeoff).toBe("POST /optimization-pressure-defense/governance-tradeoff");
    expect(foundation.api_surface.retrieve_integrity_score).toBe("POST /optimization-pressure-defense/integrity-score");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /optimization-pressure-defense/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.optimization_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.defense_identifier).toBe("OptimizationPressureDefense");
    expect(foundation.result.status).toBe("PASS");
  });

  it("defends deterministically with stable replay and integrity hashes", () => {
    const first = defendOptimizationPressure();
    const second = defendOptimizationPressure();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.objective_alignment_report.integrity_hash).toBe(second.objective_alignment_report.integrity_hash);
    expect(first.reward_hacking_assessment.integrity_hash).toBe(second.reward_hacking_assessment.integrity_hash);
    expect(first.metric_integrity_report.integrity_hash).toBe(second.metric_integrity_report.integrity_hash);
    expect(first.governance_tradeoff_report.integrity_hash).toBe(second.governance_tradeoff_report.integrity_hash);
    expect(first.balance_report.integrity_hash).toBe(second.balance_report.integrity_hash);
    expect(first.integrity_score_report.integrity_hash).toBe(second.integrity_score_report.integrity_hash);
    expect(first.pressure_assessment.integrity_hash).toBe(second.pressure_assessment.integrity_hash);
    expect(first.risk_summary.integrity_hash).toBe(second.risk_summary.integrity_hash);
    expect(first.suppression_decision.integrity_hash).toBe(second.suppression_decision.integrity_hash);
    expect(first.optimization_record.integrity_hash).toBe(second.optimization_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayOptimizationPressureDefense(first)).toBe(true);
  });

  it("maintains the authoritative optimization baseline", () => {
    const baseline = defendOptimizationPressure().baseline;

    expect(baseline.baseline_id).toBe("optimization_pressure_baseline_v1");
    expect(baseline.optimization_policy_version).toBe("optimization-policy/v1");
    expect(baseline.approved_objectives).toEqual(expect.arrayContaining(["decision_quality", "mission_integrity", "governance_compliance"]));
    expect(baseline.protected_constraints).toEqual(expect.arrayContaining(["constitutional_safety", "replayability", "explainability"]));
    expect(baseline.optimization_boundaries).toEqual(expect.arrayContaining(["no_reward_hacking", "no_metric_gaming", "no_governance_minimization", "no_objective_substitution"]));
    expect(baseline.governance_requirements).toContain("certification_required_for_optimization_change");
    expect(baseline.constitutional_requirements).toContain("constitutional_constraints_nonnegotiable");
    expect(baseline.replay_requirements).toContain("deterministic_replay_required");
    expect(baseline.explainability_requirements).toContain("tradeoff_explanation_required");
    expect(baseline.approval_reference).toBe("governance-approval:optimization-pressure-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("produces baseline assessment, scoring, suppression, and ledger evidence", () => {
    const result = defendOptimizationPressure();

    expect(result.objective_alignment_report.mission_alignment_score).toBe(0.97);
    expect(result.reward_hacking_assessment.reward_hacking_detected).toBe(false);
    expect(result.reward_hacking_assessment.detected_reward_patterns).toEqual([]);
    expect(result.metric_integrity_report.metric_gaming_assessment).toBe("Metrics remain indicators rather than objectives.");
    expect(result.governance_tradeoff_report.detected_tradeoffs).toEqual([]);
    expect(result.balance_report.optimization_balance_report).toContain("balanced");
    expect(result.integrity_score_report.optimization_integrity_score).toBe(0.97);
    expect(result.pressure_assessment.pressure_detected).toBe(false);
    expect(result.risk_summary.operational_risk).toContain("low");
    expect(result.suppression_decision.containment_actions).toEqual(["monitor_optimization_integrity"]);
    expect(result.optimization_record.optimization_event_id).toMatch(/^optimization_pressure_/);
    expect(result.optimization_record.optimization_policy_version).toBe("optimization-policy/v1");
    expect(result.optimization_record.optimization_type).toBe("OPTIMIZATION_PRESSURE");
    expect(result.optimization_record.optimization_integrity_score).toBe(0.97);
    expect(result.optimization_record.severity).toBe("INFORMATIONAL");
    expect(result.optimization_record.recommended_response).toBe("MONITOR");
    expect(result.optimization_record.containment_required).toBe(false);
    expect(result.optimization_record.replay_refs).toContain("replay:optimization-pressure-defense");
    expect(result.optimization_record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("enforces invariant guarantees without mutating production behavior", () => {
    const result = defendOptimizationPressure();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_optimization).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_OBJECTIVE_CHANGE", "UNAUTHORIZED_OBJECTIVE_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["REWARD_HACKING", "REWARD_HACKING_DETECTED", "SUPPRESSED"],
    ["OVER_OPTIMIZATION", "OVER_OPTIMIZATION_DETECTED", "PRESSURE_DETECTED"],
    ["METRIC_GAMING", "METRIC_GAMING_DETECTED", "SUPPRESSED"],
    ["CONFIDENCE_MAXIMIZATION", "CONFIDENCE_MAXIMIZATION_DETECTED", "PRESSURE_DETECTED"],
    ["GOVERNANCE_MINIMIZATION", "GOVERNANCE_MINIMIZATION_DETECTED", "SUPPRESSED"],
    ["SHORTCUT_LEARNING", "SHORTCUT_LEARNING_DETECTED", "PRESSURE_DETECTED"],
    ["OPTIMIZATION_IMBALANCE", "OPTIMIZATION_IMBALANCE_DETECTED", "PRESSURE_DETECTED"],
    ["OBJECTIVE_SUBSTITUTION", "OBJECTIVE_SUBSTITUTION_DETECTED", "SUPPRESSED"],
    ["OPTIMIZATION_DRIFT", "OPTIMIZATION_DRIFT_DETECTED", "PRESSURE_DETECTED"],
    ["ADAPTIVE_OPTIMIZATION_BIAS", "ADAPTIVE_OPTIMIZATION_BIAS", "PRESSURE_DETECTED"],
    ["OPTIMIZATION_INSTABILITY", "OPTIMIZATION_INSTABILITY_DETECTED", "PRESSURE_DETECTED"],
    ["PERFORMANCE_ONLY", "PERFORMANCE_ONLY_OPTIMIZATION", "PRESSURE_DETECTED"],
    ["REPLAY_REDUCTION", "REPLAY_REDUCTION_DETECTED", "SUPPRESSED"],
    ["EXPLAINABILITY_DEGRADATION", "EXPLAINABILITY_DEGRADATION_DETECTED", "SUPPRESSED"],
    ["AUDIT_REDUCTION", "AUDIT_REDUCTION_DETECTED", "PRESSURE_DETECTED"],
    ["CERTIFICATION_AVOIDANCE", "CERTIFICATION_AVOIDANCE_DETECTED", "SUPPRESSED"],
    ["CONSTITUTIONAL_TRADEOFF", "CONSTITUTIONAL_TRADEOFF_DETECTED", "SUPPRESSED"],
    ["OPERATOR_AUTHORITY_WEAKENING", "OPERATOR_AUTHORITY_WEAKENING", "PRESSURE_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ASSESSMENT", "PRESSURE_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_OPTIMIZATION_EVIDENCE", "PRESSURE_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_OPTIMIZATION_BEHAVIOR", "FAIL_CLOSED"],
  ] as readonly [OptimizationPressureScenario, OptimizationPressureFailure, OptimizationPressureStatus][])(
    "maps %s to %s with %s status",
    (scenario, failure, status) => {
      const result = defendOptimizationPressure({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.status).toBe(status);
      expect(result.pressure_assessment.detected_behaviors).toContain(failure);
      expect(result.optimization_record.suppressed_behaviors).toEqual(result.suppression_decision.suppressed_behaviors);
      expect(replayOptimizationPressureDefense(result)).toBe(true);
    },
  );

  it("automatically suppresses reward hacking and metric gaming pressure", () => {
    const reward = defendOptimizationPressure({ scenario: "REWARD_HACKING" });
    const metric = defendOptimizationPressure({ scenario: "METRIC_GAMING" });

    expect(reward.reward_hacking_assessment.reward_hacking_detected).toBe(true);
    expect(reward.reward_hacking_assessment.automatic_suppression).toContain("suppress_reward_hacking");
    expect(reward.suppression_decision.containment_actions).toContain("suppress_unsafe_optimization");
    expect(reward.optimization_record.containment_required).toBe(true);
    expect(metric.metric_integrity_report.detected_metric_anomalies).toContain("METRIC_GAMING_DETECTED");
    expect(metric.suppression_decision.containment_actions).toContain("exclude_from_adaptive_learning");
    expect(metric.optimization_record.recommended_response).toBe("SUPPRESS_ADAPTATION");
  });

  it("blocks governance, constitutional, replay, explainability, and certification tradeoffs", () => {
    const governance = defendOptimizationPressure({ scenario: "GOVERNANCE_MINIMIZATION" });
    const constitutional = defendOptimizationPressure({ scenario: "CONSTITUTIONAL_TRADEOFF" });
    const replay = defendOptimizationPressure({ scenario: "REPLAY_REDUCTION" });
    const explainability = defendOptimizationPressure({ scenario: "EXPLAINABILITY_DEGRADATION" });
    const certification = defendOptimizationPressure({ scenario: "CERTIFICATION_AVOIDANCE" });

    expect(governance.governance_tradeoff_report.automatic_suppression).toContain("require_governance_review");
    expect(governance.suppression_decision.containment_actions).toContain("require_governance_review");
    expect(constitutional.pressure_assessment.severity).toBe("CRITICAL");
    expect(constitutional.pressure_assessment.recommended_response).toBe("FAIL_CLOSED");
    expect(replay.governance_tradeoff_report.replay_preservation_score).toBe(0.22);
    expect(explainability.governance_tradeoff_report.explainability_preservation_score).toBe(0.24);
    expect(certification.governance_tradeoff_report.certification_preservation_score).toBe(0.2);
  });

  it("degrades guarantees only for the corresponding pressure class", () => {
    expect(defendOptimizationPressure({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    const evidence = defendOptimizationPressure({ scenario: "NONREPLAYABLE_EVIDENCE" });
    expect(evidence.replayable).toBe(false);
    expect(evidence.evidence_backed).toBe(false);
    expect(defendOptimizationPressure({ scenario: "GOVERNANCE_MINIMIZATION" }).governance_preserved).toBe(false);
    expect(defendOptimizationPressure({ scenario: "CONSTITUTIONAL_TRADEOFF" }).constitutional_preserved).toBe(false);
    expect(defendOptimizationPressure({ scenario: "OPERATOR_AUTHORITY_WEAKENING" }).operator_authority_preserved).toBe(false);
    expect(defendOptimizationPressure({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("fails replay when optimization pressure evidence is tampered", () => {
    const result = defendOptimizationPressure({ scenario: "REWARD_HACKING" });
    const tampered = {
      ...result,
      suppression_decision: {
        ...result.suppression_decision,
        containment_actions: ["allow_unsafe_optimization"],
      },
    };

    expect(replayOptimizationPressureDefense(result)).toBe(true);
    expect(replayOptimizationPressureDefense(tampered)).toBe(false);
  });
});
