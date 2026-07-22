import { describe, expect, it } from "vitest";

import {
  certifyAdaptivePipeline,
  getAdaptivePipelineContract,
  replayAdaptivePipelineCertification,
  validateAdaptivePipelineCertification,
} from "../../../services/adaptive-pipeline-certification";
import type { AdaptivePipelineFailure, AdaptivePipelineScenario } from "../../../types/adaptive-pipeline-certification";

const failureScenarios: ReadonlyArray<readonly [AdaptivePipelineScenario, AdaptivePipelineFailure]> = [
  ["OUTCOME_OBSERVATION_FAILED", "OUTCOME_OBSERVATION_CERTIFICATION_FAILED"],
  ["OUTCOME_NORMALIZATION_FAILED", "OUTCOME_NORMALIZATION_CERTIFICATION_FAILED"],
  ["RECOMMENDATION_EFFECTIVENESS_FAILED", "RECOMMENDATION_EFFECTIVENESS_CERTIFICATION_FAILED"],
  ["PATTERN_INTELLIGENCE_FAILED", "PATTERN_INTELLIGENCE_CERTIFICATION_FAILED"],
  ["STRATEGY_EVOLUTION_FAILED", "STRATEGY_EVOLUTION_CERTIFICATION_FAILED"],
  ["CONFIDENCE_ADAPTATION_FAILED", "CONFIDENCE_ADAPTATION_CERTIFICATION_FAILED"],
  ["RISK_ADAPTATION_FAILED", "RISK_ADAPTATION_CERTIFICATION_FAILED"],
  ["GOVERNANCE_ADAPTATION_FAILED", "GOVERNANCE_ADAPTATION_CERTIFICATION_FAILED"],
  ["OPERATOR_FEEDBACK_FAILED", "OPERATOR_FEEDBACK_CERTIFICATION_FAILED"],
  ["ADAPTATION_PROPOSAL_FAILED", "ADAPTATION_PROPOSAL_CERTIFICATION_FAILED"],
  ["ADAPTIVE_SIMULATION_FAILED", "ADAPTIVE_SIMULATION_CERTIFICATION_FAILED"],
  ["REPLAY_VALIDATION_FAILED", "REPLAY_VALIDATION_CERTIFICATION_FAILED"],
  ["DRIFT_DEFENSE_FAILED", "DRIFT_DEFENSE_CERTIFICATION_FAILED"],
  ["ADAPTIVE_MEMORY_FAILED", "ADAPTIVE_MEMORY_CERTIFICATION_FAILED"],
  ["ADAPTIVE_DASHBOARD_FAILED", "ADAPTIVE_DASHBOARD_CERTIFICATION_FAILED"],
  ["UNDOCUMENTED_DEPENDENCY", "UNDOCUMENTED_SUBSYSTEM_DEPENDENCY"],
  ["SEQUENCING_DIVERGENCE", "PIPELINE_SEQUENCING_DIVERGENCE"],
  ["EVIDENCE_LINEAGE_GAP", "EVIDENCE_LINEAGE_DISCONTINUITY"],
  ["GOVERNANCE_CONTINUITY_FAILURE", "GOVERNANCE_CONTINUITY_FAILURE"],
  ["CONSTITUTIONAL_CONTINUITY_FAILURE", "CONSTITUTIONAL_CONTINUITY_FAILURE"],
  ["REPLAY_DISCONTINUITY", "REPLAY_CONTINUITY_FAILURE"],
  ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH"],
  ["ADVISORY_BOUNDARY_VIOLATION", "ADVISORY_ONLY_BOUNDARY_VIOLATION"],
  ["UNAUTHORIZED_EXECUTION", "UNAUTHORIZED_ADAPTIVE_EXECUTION"],
  ["HIDDEN_SUBSYSTEM_STATE", "HIDDEN_SUBSYSTEM_STATE_DETECTED"],
  ["MISSING_CERTIFICATION_ARTIFACTS", "CERTIFICATION_ARTIFACTS_MISSING"],
  ["INTERFACE_INCONSISTENCY", "SUBSYSTEM_INTERFACE_INCONSISTENCY"],
  ["DASHBOARD_VISIBILITY_INCOMPLETE", "DASHBOARD_VISIBILITY_INCOMPLETE"],
  ["PRODUCTION_READINESS_UNMET", "PRODUCTION_READINESS_CRITERIA_UNMET"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("adaptive pipeline certification", () => {
  it("publishes the adaptive pipeline doctrine", () => {
    const contract = getAdaptivePipelineContract();

    expect(contract.doctrine.version).toBe("adaptive-pipeline-certification/v10.15.5");
    expect(contract.doctrine.deterministic_required).toBe(true);
    expect(contract.doctrine.replay_required).toBe(true);
    expect(contract.doctrine.governance_required).toBe(true);
    expect(contract.doctrine.constitutional_required).toBe(true);
    expect(contract.doctrine.tenant_isolation_required).toBe(true);
    expect(contract.doctrine.advisory_only_required).toBe(true);
    expect(contract.doctrine.subsystems).toEqual(expect.arrayContaining(["outcome_observation", "adaptive_memory", "adaptive_dashboard"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies the complete adaptive pipeline deterministically", () => {
    const first = certifyAdaptivePipeline();
    const second = certifyAdaptivePipeline();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.deterministic).toBe(true);
    expect(first.replayable).toBe(true);
    expect(first.governed).toBe(true);
    expect(first.constitutional).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.tenant_isolated).toBe(true);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateAdaptivePipelineCertification(first).valid).toBe(true);
    expect(replayAdaptivePipelineCertification(first)).toBe(true);
  });

  it("certifies every subsystem and cross-pipeline invariant", () => {
    const result = certifyAdaptivePipeline();

    expect(Object.values(result.record.subsystem_results)).toHaveLength(15);
    expect(Object.values(result.record.subsystem_results).every((subsystem) => subsystem.status === "PASS")).toBe(true);
    expect(result.integration_validation.subsystem_sequence_deterministic).toBe(true);
    expect(result.integration_validation.dependencies_documented).toBe(true);
    expect(result.integration_validation.hidden_state_absent).toBe(true);
    expect(result.lineage_validation.evidence_lineage_continuous).toBe(true);
    expect(result.lineage_validation.governance_lineage_continuous).toBe(true);
    expect(result.lineage_validation.constitutional_lineage_continuous).toBe(true);
    expect(result.lineage_validation.replay_lineage_continuous).toBe(true);
    expect(result.readiness_validation.all_subsystems_certified).toBe(true);
    expect(result.readiness_validation.unauthorized_execution_absent).toBe(true);
  });

  it("emits complete pipeline certification and integration reports", () => {
    const result = certifyAdaptivePipeline();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.pipeline_integration_assessment).toBe("PASS");
    expect(result.certification_report.governance_constitutional_compliance).toBe("PASS");
    expect(result.adaptive_integration_report.end_to_end_execution_flow).toHaveLength(15);
    expect(result.adaptive_integration_report.operational_health_score).toBe(1);
    expect(result.record.certification_refs).toHaveLength(15);
    expect(result.validation_tests).toHaveLength(31);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyAdaptivePipeline({ scenario });
    const validation = validateAdaptivePipelineCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayAdaptivePipelineCertification(result)).toBe(false);
  });

  it("detects tampering through integrity checks", () => {
    const result = certifyAdaptivePipeline();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        pipeline_integration_status: "FAIL" as const,
      },
    };

    expect(validateAdaptivePipelineCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayAdaptivePipelineCertification(tampered)).toBe(false);
  });
});
