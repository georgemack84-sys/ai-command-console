import { describe, expect, it } from "vitest";
import {
  getAdaptationSimulationEngineBundle,
  replayAdaptationSimulationEngine,
  runAdaptationSimulationEngine,
  validateAdaptationSimulationEngine,
} from "@/services/adaptation-simulation-engine";
import type { AdaptationSimulationFailure, AdaptationSimulationResult } from "@/types/adaptation-simulation-engine";

const failureScenarios: AdaptationSimulationFailure[] = [
  "SIMULATIONS_NOT_DETERMINISTIC",
  "EVIDENCE_NOT_REPRODUCIBLE",
  "REPLAY_NOT_VERIFIED",
  "GOVERNANCE_IMPACT_NOT_VALIDATED",
  "OPERATIONAL_IMPACT_NOT_EXPLAINABLE",
  "TENANT_ISOLATION_NOT_PRESERVED",
  "RISK_ASSESSMENTS_NOT_REPRODUCIBLE",
  "COUNTERFACTUAL_ANALYSIS_NOT_DETERMINISTIC",
  "SIMULATION_LINEAGE_INCOMPLETE",
  "QUALIFICATION_RECOMMENDATIONS_NOT_GOVERNED",
  "SIMULATION_AUDIT_INCOMPLETE",
  "ADAPTATION_SIMULATION_NOT_CERTIFIED",
  "OPERATIONAL_HISTORY_MODIFIED",
  "SIMULATION_EVIDENCE_MUTABLE",
  "AUTHORITY_BOUNDARY_NOT_PRESERVED",
  "FAIL_CLOSED_NOT_ENFORCED",
  "PHASE_18_4_OPTIMIZATION_NOT_VALID",
];

describe("adaptation simulation engine", () => {
  it("publishes the Phase 18.5 doctrine and validates the baseline bundle", () => {
    const bundle = getAdaptationSimulationEngineBundle();

    expect(bundle.doctrine.version).toBe("adaptation-simulation-engine/v18.5");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-optimization-framework/v18.4");
    expect(bundle.doctrine.lifecycle_states).toEqual([
      "PROPOSED",
      "REGISTERED",
      "PREPARING",
      "SIMULATING",
      "VALIDATING",
      "ANALYZED",
      "RECORDED",
      "QUALIFICATION_READY",
    ]);
    expect(bundle.doctrine.simulation_domains).toHaveLength(5);
    expect(bundle.doctrine.simulation_categories).toEqual(["OPERATIONAL", "GOVERNANCE", "REPLAY", "TENANT_ISOLATION", "RISK"]);
    expect(bundle.doctrine.divergence_classes).toHaveLength(9);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("keeps simulations deterministic, advisory, fail-closed, and non-mutating", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.simulation_engine.deterministic_execution).toBe(true);
    expect(result.simulation_engine.reproducible_evidence_generation).toBe(true);
    expect(result.simulation_engine.advisory_only).toBe(true);
    expect(result.simulation_engine.fail_closed).toBe(true);
    expect(result.counterfactual_simulation.operational_history_modified).toBe(false);
  });

  it("measures operational impact as evidentiary-only metrics", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.impact_simulator.execution_latency_measured).toBe(true);
    expect(result.impact_simulator.operational_throughput_measured).toBe(true);
    expect(result.impact_simulator.monitoring_effectiveness_measured).toBe(true);
    expect(result.impact_simulator.optimization_effectiveness_measured).toBe(true);
    expect(result.impact_simulator.governance_overhead_measured).toBe(true);
    expect(result.impact_simulator.certification_impact_measured).toBe(true);
    expect(result.impact_simulator.metrics_evidentiary_only).toBe(true);
    expect(result.impact_simulator.explainable).toBe(true);
  });

  it("executes deterministic counterfactual analysis without rewriting history", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.counterfactual_simulation.baseline_behavior_evaluated).toBe(true);
    expect(result.counterfactual_simulation.proposed_behavior_evaluated).toBe(true);
    expect(result.counterfactual_simulation.expected_improvements_evaluated).toBe(true);
    expect(result.counterfactual_simulation.unintended_regressions_evaluated).toBe(true);
    expect(result.counterfactual_simulation.governance_implications_evaluated).toBe(true);
    expect(result.counterfactual_simulation.certification_implications_evaluated).toBe(true);
    expect(result.counterfactual_simulation.deterministic_analysis).toBe(true);
  });

  it("records immutable simulation evidence for every category", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.evidence_registry.immutable_records).toBe(true);
    expect(result.evidence_registry.append_only).toBe(true);
    expect(result.evidence_registry.lifecycle).toHaveLength(8);
    expect(result.evidence_registry.records).toHaveLength(5);
    expect(new Set(result.evidence_registry.records.map((record) => record.simulation_category)).size).toBe(5);
    for (const record of result.evidence_registry.records) {
      expect(record.baseline_refs.length).toBeGreaterThan(0);
      expect(record.simulated_refs.length).toBeGreaterThan(0);
      expect(record.replay_refs.length).toBeGreaterThan(0);
      expect(record.governance_refs.length).toBeGreaterThan(0);
      expect(record.evidence_refs.length).toBeGreaterThan(0);
      expect(record.certification_lineage.length).toBeGreaterThan(0);
      expect(record.simulation_outcome).toBe("PASS");
    }
  });

  it("validates governance, replay, tenant isolation, and risk before qualification", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.governance_validation.governance_before_approval).toBe(true);
    expect(result.governance_validation.governance_impact_validated).toBe(true);
    expect(result.governance_validation.tenant_isolation_preserved).toBe(true);
    expect(result.governance_validation.replay_validated_before_qualification).toBe(true);
    expect(result.replay_validation.replay_reproducible).toBe(true);
    expect(result.replay_validation.replay_lineage_complete).toBe(true);
    expect(result.risk_assessment.reproducible).toBe(true);
    expect(result.risk_assessment.harmful_divergence_blocks_qualification).toBe(true);
  });

  it("produces a governed advisory qualification recommendation", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.qualification_recommendation.governed).toBe(true);
    expect(result.qualification_recommendation.advisory_only).toBe(true);
    expect(result.qualification_recommendation.qualification_ready).toBe(true);
    expect(result.qualification_recommendation.outcome).toBe("QUALIFICATION_READY");
    expect(result.qualification_recommendation.blocking_divergences).toHaveLength(0);
    expect(result.qualification_recommendation.simulation_refs).toHaveLength(5);
  });

  it("certifies the Phase 18.5 exit criteria", () => {
    const result = runAdaptationSimulationEngine();

    expect(result.certification_package.simulations_deterministic).toBe(true);
    expect(result.certification_package.evidence_reproducible).toBe(true);
    expect(result.certification_package.replay_verified).toBe(true);
    expect(result.certification_package.governance_impact_validated).toBe(true);
    expect(result.certification_package.operational_impact_explainable).toBe(true);
    expect(result.certification_package.tenant_isolation_preserved).toBe(true);
    expect(result.certification_package.risk_assessments_reproducible).toBe(true);
    expect(result.certification_package.counterfactual_analysis_deterministic).toBe(true);
    expect(result.certification_package.simulation_lineage_complete).toBe(true);
    expect(result.certification_package.qualification_recommendations_governed).toBe(true);
    expect(result.certification_package.simulation_audit_complete).toBe(true);
    expect(result.certification_package.adaptation_simulation_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(12);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runAdaptationSimulationEngine();
    const second = runAdaptationSimulationEngine();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAdaptationSimulationEngine(first).valid).toBe(true);
    expect(replayAdaptationSimulationEngine(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runAdaptationSimulationEngine({
      scenario: "NON_CONSTITUTIONAL_SIMULATION_WARNING",
    });
    const validation = validateAdaptationSimulationEngine(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_SIMULATION_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runAdaptationSimulationEngine({ scenario });
    const validation = validateAdaptationSimulationEngine(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runAdaptationSimulationEngine();
    const tamperedEvidence: AdaptationSimulationResult = {
      ...result,
      evidence_registry: {
        ...result.evidence_registry,
        append_only: false,
      },
    };
    const tamperedReplay: AdaptationSimulationResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const evidenceValidation = validateAdaptationSimulationEngine(tamperedEvidence);
    const replayValidation = validateAdaptationSimulationEngine(tamperedReplay);

    expect(evidenceValidation.valid).toBe(false);
    expect(evidenceValidation.evidence_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
