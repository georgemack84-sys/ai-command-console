import { describe, expect, it } from "vitest";
import {
  getMultiDomainImpactSimulationFoundation,
  replayMultiDomainImpactAnalysis,
  simulateMultiDomainImpact,
} from "@/services/multi-domain-impact-simulation-engine";
import type {
  CrossDomainCorrelation,
  ImpactDomain,
  MultiDomainImpactFailure,
  MultiDomainImpactScenario,
} from "@/types/multi-domain-impact-simulation-engine";

describe("Mission Control Phase 10.11.4 Multi-Domain Impact Simulation Engine", () => {
  const expectedDomains: readonly ImpactDomain[] = [
    "MISSION_IMPACT",
    "RISK_IMPACT",
    "CONFIDENCE_IMPACT",
    "GOVERNANCE_IMPACT",
    "OPERATOR_WORKFLOW_IMPACT",
    "ROLLBACK_IMPACT",
    "ADVERSARIAL_SIMULATION",
  ];

  const expectedCorrelations: readonly CrossDomainCorrelation[] = [
    "MISSION_RISK",
    "MISSION_CONFIDENCE",
    "MISSION_GOVERNANCE",
    "MISSION_OPERATOR",
    "RISK_CONFIDENCE",
    "RISK_GOVERNANCE",
    "CONFIDENCE_GOVERNANCE",
    "GOVERNANCE_OPERATOR",
    "ROLLBACK_GOVERNANCE",
    "ADVERSARIAL_ALL_DOMAINS",
  ];

  it("publishes the multi-domain impact contract", () => {
    const foundation = getMultiDomainImpactSimulationFoundation();

    expect(foundation.multi_domain_impact_simulation_engine_version).toBe("multi-domain-impact-simulation-engine/v1");
    expect(foundation.domains).toEqual(expectedDomains);
    expect(foundation.correlations).toEqual(expectedCorrelations);
    expect(foundation.api_surface.simulate_impact).toBe("POST /multi-domain-impact-simulation-engine/simulate");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /multi-domain-impact-simulation-engine/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.operator_authority_reduction_supported).toBe(false);
    expect(foundation.api_surface.hidden_tradeoff_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.engine_identifier).toBe("MultiDomainImpactSimulationEngine");
    expect(foundation.result.outcome).toBe("PASS");
  });

  it("simulates deterministically with stable nested hashes", () => {
    const first = simulateMultiDomainImpact();
    const second = simulateMultiDomainImpact();

    expect(first.domain_assessments.map((item) => item.integrity_hash)).toEqual(second.domain_assessments.map((item) => item.integrity_hash));
    expect(first.correlation_assessments.map((item) => item.integrity_hash)).toEqual(second.correlation_assessments.map((item) => item.integrity_hash));
    expect(first.impact_analysis.integrity_hash).toBe(second.impact_analysis.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayMultiDomainImpactAnalysis(first)).toBe(true);
  });

  it("evaluates every intelligence domain with expected measures and validations", () => {
    const assessments = simulateMultiDomainImpact().domain_assessments;

    expect(assessments.map((item) => item.domain)).toEqual(expectedDomains);
    expect(assessments.find((item) => item.domain === "MISSION_IMPACT")?.measures).toContain("mission_success_rate");
    expect(assessments.find((item) => item.domain === "RISK_IMPACT")?.measures).toContain("mitigation_effectiveness");
    expect(assessments.find((item) => item.domain === "CONFIDENCE_IMPACT")?.measures).toContain("confidence_explainability");
    expect(assessments.find((item) => item.domain === "GOVERNANCE_IMPACT")?.validation_requirements).toContain("approval_workflows_unchanged");
    expect(assessments.find((item) => item.domain === "OPERATOR_WORKFLOW_IMPACT")?.measures).toContain("cognitive_load");
    expect(assessments.find((item) => item.domain === "ROLLBACK_IMPACT")?.validation_requirements).toContain("preserved_audit_evidence");
    expect(assessments.find((item) => item.domain === "ADVERSARIAL_SIMULATION")?.measures).toContain("synthetic_evidence_injection");
    expect(assessments.every((item) => item.passed)).toBe(true);
  });

  it("evaluates all cross-domain correlations to expose hidden tradeoffs", () => {
    const correlations = simulateMultiDomainImpact().correlation_assessments;

    expect(correlations.map((item) => item.correlation)).toEqual(expectedCorrelations);
    expect(correlations.find((item) => item.correlation === "MISSION_RISK")?.evaluated_domains).toEqual(["MISSION_IMPACT", "RISK_IMPACT"]);
    expect(correlations.find((item) => item.correlation === "ROLLBACK_GOVERNANCE")?.evaluated_domains).toEqual(["ROLLBACK_IMPACT", "GOVERNANCE_IMPACT"]);
    expect(correlations.find((item) => item.correlation === "ADVERSARIAL_ALL_DOMAINS")?.evaluated_domains).toEqual(expectedDomains);
    expect(correlations.every((item) => item.hidden_regression_detected)).toBe(false);
  });

  it("produces the required SimulationImpactAnalysis record", () => {
    const analysis = simulateMultiDomainImpact().impact_analysis;

    expect(analysis.analysis_id).toMatch(/^simulation_impact_/);
    expect(analysis.mission_impact.domain).toBe("MISSION_IMPACT");
    expect(analysis.risk_impact.domain).toBe("RISK_IMPACT");
    expect(analysis.confidence_impact.domain).toBe("CONFIDENCE_IMPACT");
    expect(analysis.governance_impact.domain).toBe("GOVERNANCE_IMPACT");
    expect(analysis.operator_workflow_impact.domain).toBe("OPERATOR_WORKFLOW_IMPACT");
    expect(analysis.rollback_impact.domain).toBe("ROLLBACK_IMPACT");
    expect(analysis.adversarial_results.domain).toBe("ADVERSARIAL_SIMULATION");
    expect(analysis.cross_domain_correlations).toHaveLength(10);
    expect(analysis.hidden_behavior_detected).toBe(false);
    expect(analysis.simulation_result).toBe("PASS");
  });

  it("publishes required simulation metrics and immutable evidence reports", () => {
    const result = simulateMultiDomainImpact();

    expect(result.metrics.domains_evaluated).toBe(7);
    expect(result.metrics.correlations_evaluated).toBe(10);
    expect(result.metrics.improvement_score).toBeGreaterThan(0);
    expect(result.metrics.degradation_score).toBe(0);
    expect(result.metrics.governance_stability_score).toBeGreaterThan(0);
    expect(result.metrics.confidence_stability_score).toBeGreaterThan(0);
    expect(result.metrics.risk_effectiveness_score).toBeGreaterThan(0);
    expect(result.metrics.operator_impact_score).toBeGreaterThan(0);
    expect(result.metrics.rollback_readiness_score).toBeGreaterThan(0);
    expect(result.metrics.adversarial_resilience_score).toBeGreaterThan(0);
    expect(result.metrics.cross_domain_dependency_score).toBeGreaterThan(0);
    expect(result.mission_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.risk_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.confidence_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.governance_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.operator_workflow_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.rollback_validation_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.adversarial_resilience_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.cross_domain_correlation_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.simulation_validation_ledger_entry_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("preserves governance, operator authority, rollback readiness, adversarial resilience, and advisory-only boundaries", () => {
    const result = simulateMultiDomainImpact();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_integrity_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.rollback_ready).toBe(true);
    expect(result.adversarial_resilience_demonstrated).toBe(true);
    expect(result.immutable_evidence_recorded).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.modifies_production_state).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("supports conditional and inconclusive outcomes without authorizing implementation", () => {
    const conditional = simulateMultiDomainImpact({ scenario: "CONDITIONAL_MINOR_ISSUES" });
    const inconclusive = simulateMultiDomainImpact({ scenario: "INCONCLUSIVE" });
    const moreEvidence = simulateMultiDomainImpact({ scenario: "MORE_EVIDENCE" });

    expect(conditional.outcome).toBe("CONDITIONAL_PASS");
    expect(inconclusive.outcome).toBe("INCONCLUSIVE");
    expect(moreEvidence.outcome).toBe("REQUIRES_MORE_EVIDENCE");
    expect(conditional.authorizes_implementation).toBe(false);
    expect(inconclusive.authorizes_implementation).toBe(false);
    expect(moreEvidence.authorizes_implementation).toBe(false);
  });

  it.each([
    ["NONDETERMINISTIC", "NONDETERMINISTIC_SIMULATION_BEHAVIOR", "FAIL"],
    ["HIDDEN_REGRESSION", "HIDDEN_CROSS_DOMAIN_REGRESSION", "FAIL"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["APPROVAL_WORKFLOW_DEGRADATION", "APPROVAL_WORKFLOW_DEGRADATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["OPERATOR_AUTHORITY_REDUCTION", "OPERATOR_AUTHORITY_REDUCTION", "REQUIRES_OPERATOR_REVIEW"],
    ["ROLLBACK_FAILURE", "ROLLBACK_FAILURE", "FAIL"],
    ["UNEXPLAINED_BEHAVIOR", "UNEXPLAINED_BEHAVIOR", "FAIL"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY", "FAIL"],
    ["CONFIDENCE_INSTABILITY", "CONFIDENCE_INSTABILITY", "FAIL"],
    ["RISK_INSTABILITY", "RISK_INSTABILITY", "FAIL"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH", "FAIL"],
    ["ADVERSARIAL_COMPROMISE", "ADVERSARIAL_SCENARIO_COMPROMISE", "FAIL"],
    ["EVIDENCE_CORRUPTION", "EVIDENCE_CORRUPTION", "FAIL"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILURE", "FAIL"],
  ] as const)("fails multi-domain impact simulation for %s", (scenario: MultiDomainImpactScenario, failure: MultiDomainImpactFailure, outcome) => {
    const result = simulateMultiDomainImpact({ scenario });

    expect(result.outcome).toBe(outcome);
    expect(result.failures).toContain(failure);
    expect(result.replayable).toBe(false);
    expect(replayMultiDomainImpactAnalysis(result)).toBe(true);
  });

  it("detects nested replay tampering", () => {
    const result = simulateMultiDomainImpact();
    const tampered = {
      ...result,
      impact_analysis: {
        ...result.impact_analysis,
        hidden_behavior_detected: true,
      },
    };

    expect(replayMultiDomainImpactAnalysis(tampered)).toBe(false);
  });
});
