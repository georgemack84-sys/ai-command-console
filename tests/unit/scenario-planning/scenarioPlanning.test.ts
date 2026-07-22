import { describe, expect, it } from "vitest";

import { getScenarioPlanningBundle, replayScenarioPlanning, runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { ScenarioLifecycleState, ScenarioPlanningFailure } from "@/types/scenario-planning";

const scenarioLifecycle: readonly ScenarioLifecycleState[] = ["DRAFT", "UNDER_ANALYSIS", "EVALUATED", "REVIEW", "REJECTED", "APPROVED", "ADOPTED", "ARCHIVED"];
const conditionalFailures = ["SCENARIO_DEFINITION_MISSING", "ALTERNATIVE_GENERATION_MISSING", "ASSUMPTION_MANAGEMENT_MISSING", "WHAT_IF_ANALYSIS_MISSING", "SCENARIO_EVALUATION_MISSING", "RISK_ASSESSMENT_MISSING", "OPPORTUNITY_ASSESSMENT_MISSING", "SCENARIO_COMPARISON_MISSING", "RECOMMENDATION_ENGINE_MISSING", "SCENARIO_GOVERNANCE_MISSING", "SCENARIO_EVIDENCE_MISSING"] as const satisfies readonly ScenarioPlanningFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "W2_3_CAPABILITY_REGISTRY_INVALID", "W2_4_SKILL_REGISTRY_INVALID", "W2_5_AUTHORITY_VALIDATOR_INVALID", "W2_6_POLICY_GATE_INVALID", "W2_7_SAFETY_GATE_INVALID", "W2_8_PLANNING_ENGINE_INVALID", "W2_9_MEMORY_ENGINE_INVALID", "W2_13_EVIDENCE_ENGINE_INVALID", "SCENARIO_IDENTITY_MISSING", "SCENARIO_VERSIONING_MISSING", "SCENARIO_BRANCHING_NON_DETERMINISTIC", "AUTHORITATIVE_MISSION_MUTATED", "SCENARIO_MISSION_REFERENCE_INVALID", "ASSUMPTION_TRACEABILITY_MISSING", "SCENARIO_CLASSIFICATION_INCOMPLETE", "EVALUATION_NON_REPRODUCIBLE", "COMPARISON_NON_DETERMINISTIC", "RECOMMENDATION_NOT_EXPLAINABLE", "CONSTITUTIONAL_VALIDATION_BYPASSED", "AUTHORITY_VALIDATION_BYPASSED", "POLICY_VALIDATION_BYPASSED", "SAFETY_VALIDATION_BYPASSED", "APPROVAL_WORKFLOW_MISSING", "SCENARIO_EVIDENCE_NOT_IMMUTABLE", "PLANNING_REPORTS_NOT_REPRODUCIBLE", "SCENARIO_LIFECYCLE_INVALID"] as const satisfies readonly ScenarioPlanningFailure[];

describe("Scenario Planning MC-2", () => {
  it("publishes the MC-2 scenario planning doctrine", () => {
    const bundle = getScenarioPlanningBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "scenario-planning/mc-2",
      owns_scenario_definition: true,
      owns_alternative_future_generation: true,
      owns_assumption_management: true,
      owns_what_if_analysis: true,
      owns_scenario_evaluation: true,
      owns_scenario_comparison: true,
      owns_recommendations: true,
      authoritative_mission_remains_unchanged: true,
      qualification_gate: "Mission Scenario Planning Qualification",
    });
    expect(bundle.result.readiness.decision).toBe("MISSION_SCENARIO_PLANNING_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-1 and planning dependencies", () => {
    const first = runScenarioPlanning({ seed: "deterministic" });
    const second = runScenarioPlanning({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "capability-registry/w2.3", "skill-registry/w2.4", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "evidence-engine/w2.13"]);
    expect(first.mission_id).toBe(second.mission_id);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateScenarioPlanning(first).valid).toBe(true);
    expect(replayScenarioPlanning()).toBe(true);
  });

  it("defines governed alternative futures without mutating the authoritative mission", () => {
    const result = runScenarioPlanning();

    expect(result.definition).toMatchObject({ scenario_model: true, metadata: true, identity: true, ownership: true, classification: true, versioning: true, scenario_registry: true, scenario_catalog: true });
    expect(result.generation).toMatchObject({ branch_planning: true, mission_forking: true, timeline_branching: true, alternative_objectives: true, alternative_resource_allocation: true, alternative_execution_paths: true, multiple_candidate_futures: true, deterministic_branching: true, reproducible_scenarios: true, authoritative_mission_unchanged: true, exactly_one_authoritative_mission_ref: true });
    expect(result.readiness.mission_integrity_preserved).toBe(true);
  });

  it("tracks assumptions and what-if classes", () => {
    const result = runScenarioPlanning();

    expect(result.assumptions).toMatchObject({ assumption_registry: true, assumption_validation: true, constraint_documentation: true, external_dependencies: true, confidence_levels: true, assumption_catalog: true, planning_constraints: true, traceable_assumptions: true });
    expect(result.what_if.classes).toEqual(["OPTIMISTIC", "NOMINAL", "DEGRADED", "CONTINGENCY", "WORST_CASE"]);
    expect(result.what_if).toMatchObject({ resource_variations: true, timeline_variations: true, risk_variations: true, capability_variations: true, policy_variations: true, environmental_variations: true });
  });

  it("evaluates risk, opportunity, comparison, and recommendations", () => {
    const result = runScenarioPlanning();

    expect(result.evaluation).toMatchObject({ goal_achievement_analysis: true, constraint_validation: true, dependency_analysis: true, mission_success_probability: true, resource_utilization: true, timeline_evaluation: true, constitutional_compliance: true, scenario_scores: true, evaluation_reports: true, repeatable_evaluations: true });
    expect(result.risk).toMatchObject({ operational_risk: true, dependency_risk: true, resource_risk: true, schedule_risk: true, authority_risk: true, policy_risk: true, risk_profiles: true, risk_matrix: true });
    expect(result.opportunity).toMatchObject({ efficiency_improvements: true, mission_optimization: true, resource_savings: true, capability_expansion: true, timeline_improvements: true, opportunity_analysis: true });
    expect(result.comparison).toMatchObject({ side_by_side: true, delta_analysis: true, cost_comparison: true, timeline_comparison: true, resource_comparison: true, risk_comparison: true, objective_comparison: true, comparative_reports: true, deterministic_comparisons: true });
    expect(result.recommendation).toMatchObject({ preferred_scenario_selection: true, tradeoff_analysis: true, recommendation_justification: true, decision_explanation: true, confidence_assessment: true, recommendation_report: true, explainable_recommendations: true });
  });

  it("enforces governance, immutable evidence, lifecycle, and outputs", () => {
    const result = runScenarioPlanning();

    expect(result.governance).toMatchObject({ constitutional_validation: true, authority_validation: true, policy_enforcement: true, safety_validation: true, approval_workflow: true, lifecycle_contract_enforced: true, authority_restrictions_enforced: true, policy_requirements_enforced: true, safety_constraints_enforced: true });
    expect(result.evidence).toMatchObject({ planning_evidence: true, evaluation_evidence: true, comparison_evidence: true, recommendation_evidence: true, approval_evidence: true, immutable_planning_evidence: true, evidence_lineage_complete: true });
    expect(result.lifecycle.states).toEqual(scenarioLifecycle);
    expect(result.lifecycle.deterministic_transitions).toBe(true);
    expect(result.lifecycle.adopted_requires_approval).toBe(true);
    expect(result.outputs).toMatchObject({ scenario_catalog: true, scenario_reports: true, scenario_evidence: true, assumption_registry: true, evaluation_reports: true, risk_reports: true, opportunity_reports: true, recommendation_reports: true, comparison_reports: true, planning_evidence_ledger: true, planning_analytics: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runScenarioPlanning({ scenario: failure });
    const validation = validateScenarioPlanning(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runScenarioPlanning({ scenario: failure });
    const validation = validateScenarioPlanning(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runScenarioPlanning({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runScenarioPlanning({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runScenarioPlanning({ scenario: "SCENARIO_PLANNING_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateScenarioPlanning(notQualified).valid).toBe(false);
  });
});
