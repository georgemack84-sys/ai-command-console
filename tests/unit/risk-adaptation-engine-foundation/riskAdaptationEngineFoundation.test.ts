import { describe, expect, it } from "vitest";
import {
  analyzeRiskAdaptationFoundation,
  getRiskAdaptationFoundation,
  replayRiskAdaptationFoundation,
} from "@/services/risk-adaptation-engine-foundation";
import type { RiskAdaptationFailure, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";

describe("Mission Control Phase 10.7.1 Risk Adaptation Engine Foundation", () => {
  it("publishes the risk adaptation foundation", () => {
    const foundation = getRiskAdaptationFoundation();

    expect(foundation.risk_adaptation_engine_foundation_version).toBe("risk-adaptation-engine-foundation/v1");
    expect(foundation.api_surface.analyze_foundation).toBe("POST /risk-adaptation-engine-foundation/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("generates the foundation deterministically", () => {
    const first = analyzeRiskAdaptationFoundation({ scenario: "SEVERITY" });
    const second = analyzeRiskAdaptationFoundation({ scenario: "SEVERITY" });

    expect(first.contract.adaptation_id).toBe(second.contract.adaptation_id);
    expect(first.pipeline.pipeline_id).toBe(second.pipeline.pipeline_id);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports every required recommendation type", () => {
    expect(analyzeRiskAdaptationFoundation({ scenario: "SEVERITY" }).contract.recommendation_type).toBe("SEVERITY_ADJUSTMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "PROBABILITY" }).contract.recommendation_type).toBe("PROBABILITY_ADJUSTMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "ESCALATION" }).contract.recommendation_type).toBe("ESCALATION_REFINEMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "ROLLBACK" }).contract.recommendation_type).toBe("ROLLBACK_REFINEMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "GOVERNANCE" }).contract.recommendation_type).toBe("GOVERNANCE_ESCALATION");
    expect(analyzeRiskAdaptationFoundation({ scenario: "MONITORING" }).contract.recommendation_type).toBe("ADDITIONAL_MONITORING");
    expect(analyzeRiskAdaptationFoundation({ scenario: "EVIDENCE" }).contract.recommendation_type).toBe("EVIDENCE_IMPROVEMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "CLASSIFICATION" }).contract.recommendation_type).toBe("RISK_CLASSIFICATION_REFINEMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "DOCUMENTATION" }).contract.recommendation_type).toBe("DOCUMENTATION_IMPROVEMENT");
    expect(analyzeRiskAdaptationFoundation({ scenario: "SIMULATION" }).contract.recommendation_type).toBe("SIMULATION_REQUIREMENT");
  });

  it("defines lifecycle, state machine, and terminal rejection behavior", () => {
    const result = analyzeRiskAdaptationFoundation({ scenario: "REJECTED" });

    expect(result.lifecycle.current_state).toBe("REJECTED");
    expect(result.lifecycle.rejected_terminal).toBe(true);
    expect(result.lifecycle.no_backward_transitions).toBe(true);
    expect(result.lifecycle.allowed_transitions).toContain("GOVERNANCE_REVIEW");
    expect(result.lifecycle.replay_only_reconstruction).toBe(true);
  });

  it("builds a replayable recommendation pipeline and replay framework", () => {
    const result = analyzeRiskAdaptationFoundation({ scenario: "PROBABILITY" });

    expect(result.pipeline.stages).toContain("Outcome Analysis");
    expect(result.pipeline.stages).toContain("Recommendation Generation");
    expect(result.pipeline.deterministic).toBe(true);
    expect(result.replay_framework.replay_includes).toContain("originating_assessments");
    expect(result.replay_framework.reproduces_identical_recommendation).toBe(true);
    expect(result.replay_framework.replay_refs.length).toBeGreaterThan(0);
  });

  it("keeps risk adaptation advisory-only and unable to mutate production behavior", () => {
    const result = analyzeRiskAdaptationFoundation({ scenario: "SEVERITY" });
    const contract = result.contract;

    expect(result.advisory_only).toBe(true);
    expect(result.production_mutation_supported).toBe(false);
    expect(result.automatic_risk_update_supported).toBe(false);
    expect(result.governance_bypass_supported).toBe(false);
    expect(result.simulation_bypass_supported).toBe(false);
    expect(result.operator_bypass_supported).toBe(false);
    expect(contract.mutates_production_risk_model).toBe(false);
    expect(contract.updates_severity).toBe(false);
    expect(contract.updates_probability).toBe(false);
  });

  it("replays the risk adaptation foundation", () => {
    const result = analyzeRiskAdaptationFoundation({ scenario: "SEVERITY" });

    expect(replayRiskAdaptationFoundation(result)).toBe(true);
  });

  it.each([
    ["MISSING_SCHEMA", "SCHEMA_INVALID"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_METADATA_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_METADATA_MISSING"],
    ["MISSING_AUTHORITY", "AUTHORITY_METADATA_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_REQUIREMENT_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["INVALID_TRANSITION", "INVALID_STATE_TRANSITION"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"],
    ["SEVERITY_UPDATE", "AUTOMATIC_SEVERITY_UPDATE_DETECTED"],
    ["PROBABILITY_UPDATE", "AUTOMATIC_PROBABILITY_UPDATE_DETECTED"],
    ["GOVERNANCE_THRESHOLD_UPDATE", "GOVERNANCE_THRESHOLD_MUTATION_DETECTED"],
    ["SIMULATION_BYPASS", "SIMULATION_BYPASS_DETECTED"],
    ["OPERATOR_BYPASS", "OPERATOR_BYPASS_DETECTED"],
    ["HISTORICAL_RECORD_MUTATION", "HISTORICAL_RECORD_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_RECOMMENDATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskAdaptationScenario, RiskAdaptationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRiskAdaptationFoundation({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.production_mutation_supported).toBe(false);
  });

  it("marks missing replay as pending replay", () => {
    const result = analyzeRiskAdaptationFoundation({ scenario: "MISSING_REPLAY" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects invalid state transitions", () => {
    const result = analyzeRiskAdaptationFoundation({ scenario: "INVALID_TRANSITION" });

    expect(result.validation.state).toBe("REJECTED");
    expect(result.lifecycle.no_backward_transitions).toBe(false);
  });

  it("detects foundation tampering during replay", () => {
    const result = analyzeRiskAdaptationFoundation();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskAdaptationFoundation(tampered)).toBe(false);
  });
});
