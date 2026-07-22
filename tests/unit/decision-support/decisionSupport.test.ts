import { describe, expect, it } from "vitest";

import { getDecisionSupportBundle, replayDecisionSupport, runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import type { DecisionSupportFailure } from "@/types/decision-support";

const conditionalFailures = ["DECISION_ENGINE_MISSING", "TRADEOFF_ANALYSIS_MISSING", "MULTI_CRITERIA_EVALUATION_MISSING", "EVIDENCE_AGGREGATION_MISSING", "JUSTIFICATION_MISSING", "MISSION_ADVISORY_GATE_MISSING", "DECISION_PACKAGE_MISSING", "RECOMMENDATION_REPORT_MISSING", "TRADEOFF_REPORT_MISSING", "EVIDENCE_BUNDLE_MISSING", "JUSTIFICATION_REPORT_MISSING", "AUDIT_EVIDENCE_MISSING"] as const satisfies readonly DecisionSupportFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "W2_EVIDENCE_INVALID", "W2_REPLAY_INVALID", "W2_CERTIFICATION_INVALID", "W2_POLICY_INVALID", "W2_AUTHORITY_INVALID", "W2_SAFETY_INVALID", "W2_PLANNING_INVALID", "W2_MEMORY_INVALID", "W2_COLLABORATION_INVALID", "W2_DELEGATION_INVALID", "W2_RUNTIME_INVALID", "RECOMMENDATION_GENERATION_MISSING", "RECOMMENDATION_RANKING_NON_DETERMINISTIC", "CONSTITUTIONAL_FILTERING_BYPASSED", "TRADEOFF_MATRIX_NON_DETERMINISTIC", "WEIGHTED_SCORING_NON_DETERMINISTIC", "MANDATORY_CONSTRAINTS_BYPASSED", "EVIDENCE_LINEAGE_INCOMPLETE", "EVIDENCE_CONFIDENCE_MISSING", "RECOMMENDATION_NOT_EXPLAINABLE", "REJECTED_ALTERNATIVES_MISSING", "MISSION_ADVISORY_GATE_FAILED", "OUTPUT_PUBLISHED_WITHOUT_GATE", "OPERATIONAL_DECISION_ATTEMPTED", "MISSION_EXECUTION_ATTEMPTED", "OPERATOR_SUPREMACY_BYPASSED", "AUDIT_EVIDENCE_NOT_IMMUTABLE", "DETERMINISTIC_REPLAY_FAILED"] as const satisfies readonly DecisionSupportFailure[];

describe("Decision Support MC-3", () => {
  it("publishes the MC-3 advisory decision support doctrine", () => {
    const bundle = getDecisionSupportBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "decision-support/mc-3",
      owns_decision_engine: true,
      owns_tradeoff_analysis: true,
      owns_multi_criteria_evaluation: true,
      owns_evidence_aggregation: true,
      owns_decision_justification: true,
      owns_mission_advisory_gate: true,
      produces_advisory_outputs_only: true,
      never_makes_operational_decisions: true,
      qualification_gate: "Mission Advisory Gate",
    });
    expect(bundle.result.readiness.decision).toBe("MISSION_DECISION_SUPPORT_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-1, MC-2, and CAF governance dependencies", () => {
    const first = runDecisionSupport({ seed: "deterministic" });
    const second = runDecisionSupport({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "evidence-engine/w2.13", "replay-engine/w2.14", "certification-engine/w2.15", "policy-gate/w2.6", "authority-validator/w2.5", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "collaboration-engine/w2.12", "delegation-engine/w2.11", "runtime-orchestrator/w2.10"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateDecisionSupport(first).valid).toBe(true);
    expect(replayDecisionSupport()).toBe(true);
  });

  it("generates ranked advisory recommendations without operational authority", () => {
    const result = runDecisionSupport();

    expect(result.decision_engine).toMatchObject({ recommendation_generation: true, alternative_ranking: true, recommendation_scoring: true, decision_normalization: true, constitutional_filtering: true, objectives: true, constraints: true, scenarios: true, evidence: true, policy: true, authority: true, historical_outcomes: true, ranked_recommendations: true, deterministic: true, advisory_only: true });
    expect(result.governance).toMatchObject({ recommendations_only: true, never_executes_mission_actions: true, preserves_operator_supremacy: true, deterministic_recommendations: true, explainable_recommendations: true, complete_evidence_lineage: true, immutable_audit_evidence: true, rejects_insufficient_evidence: true, rejects_constitutional_violations: true, requires_gate_before_publication: true });
    expect(result.readiness.advisory_only).toBe(true);
    expect(result.readiness.operator_supremacy_preserved).toBe(true);
  });

  it("evaluates tradeoffs and multi-criteria rankings", () => {
    const result = runDecisionSupport();

    expect(result.tradeoff_analyzer).toMatchObject({ compare_alternatives: true, identify_compromises: true, sensitivity_analysis: true, objective_comparison: true, cost: true, schedule: true, risk: true, confidence: true, mission_value: true, operational_impact: true, resource_usage: true, probability_of_success: true, comparative_tradeoff_matrix: true, deterministic_matrix: true });
    expect(result.multi_criteria).toMatchObject({ weighted_objectives: true, mandatory_constraints: true, mission_priorities: true, policy_restrictions: true, authority_restrictions: true, weighted_scoring: true, objective_normalization: true, constraint_evaluation: true, ranking: true, normalized_scoring: true, deterministic_rankings: true });
  });

  it("aggregates evidence and explains every recommendation", () => {
    const result = runDecisionSupport();

    expect(result.evidence_aggregator).toMatchObject({ scenarios: true, simulations: true, execution_history: true, replay: true, certification: true, operational_evidence: true, external_evidence_sources: true, evidence_collection: true, lineage_validation: true, confidence_aggregation: true, evidence_completeness: true, unified_evidence_package: true });
    expect(result.justification).toMatchObject({ recommendation_explanations: true, evidence_mapping: true, rationale_generation: true, traceability: true, supporting_evidence: true, rejected_alternatives: true, assumptions: true, constraints: true, constitutional_checks: true, confidence: true, risk_summary: true, justification_report: true, explainable: true });
  });

  it("publishes artifacts only after MissionAdvisoryGate passes", () => {
    const result = runDecisionSupport();

    expect(result.advisory_gate).toMatchObject({ mission_constitutional_compliance: true, mission_lifecycle_validity: true, authority_validation: true, policy_compliance: true, safety_compliance: true, evidence_completeness: true, evidence_provenance: true, recommendation_explainability: true, justification_completeness: true, confidence_thresholds: true, traceability: true, audit_readiness: true, failed_outputs_not_published: true, gate_passed: true });
    expect(result.artifacts).toMatchObject({ decision_package: true, recommendation_report: true, tradeoff_report: true, evidence_bundle: true, decision_justification_report: true, advisory_status: "PUBLISHED", tradeoff_summary: true, recommendation_ranking: true, constitutional_review: true, authority_review: true, policy_review: true, safety_review: true, mission_lifecycle_state: "APPROVED" });
    expect(result.artifacts.evidence_references).toHaveLength(5);
    expect(result.artifacts.confidence_score).toBeGreaterThanOrEqual(0.9);
    expect(result.artifacts.immutable_lineage_id).toBe("lineage:mc-3:decision-package");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runDecisionSupport({ scenario: failure });
    const validation = validateDecisionSupport(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runDecisionSupport({ scenario: failure });
    const validation = validateDecisionSupport(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runDecisionSupport({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runDecisionSupport({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runDecisionSupport({ scenario: "DECISION_SUPPORT_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateDecisionSupport(notQualified).valid).toBe(false);
  });
});
