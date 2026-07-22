import { describe, expect, it } from "vitest";
import {
  getContinuousAdaptiveOperationsCertificationBundle,
  replayContinuousAdaptiveOperationsCertification,
  runContinuousAdaptiveOperationsCertification,
  validateContinuousAdaptiveOperationsCertification,
} from "@/services/continuous-adaptive-operations-certification";
import type { ContinuousAdaptiveOperationsFailure, ContinuousAdaptiveOperationsResult } from "@/types/continuous-adaptive-operations-certification";

const failureScenarios: ContinuousAdaptiveOperationsFailure[] = [
  "CONTINUOUS_OPERATIONS_NOT_CERTIFIED",
  "PERPETUAL_GOVERNANCE_NOT_VERIFIED",
  "CONTINUOUS_MONITORING_NOT_OPERATIONAL",
  "DETERMINISTIC_ADAPTATION_NOT_VALIDATED",
  "ADAPTATION_QUALIFICATION_NOT_VERIFIED",
  "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL",
  "REPLAY_NOT_CONTINUOUSLY_REPRODUCIBLE",
  "GOVERNANCE_SUPREMACY_NOT_PRESERVED",
  "ADVISORY_BOUNDARY_NOT_ENFORCED",
  "EXTERNAL_IMPLEMENTATION_ATTESTATION_NOT_VERIFIED",
  "IMMUTABLE_EVOLUTION_LINEAGE_NOT_VERIFIED",
  "CONTINUOUS_IMPROVEMENT_LEDGER_INCOMPLETE",
  "OPERATIONAL_KNOWLEDGE_NOT_PRESERVED",
  "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE",
  "DETERMINISTIC_RISK_INTELLIGENCE_NOT_OPERATIONAL",
  "OBSERVABILITY_INCOMPLETE",
  "EXPLAINABILITY_NOT_REPRODUCIBLE",
  "TENANT_ISOLATION_NOT_PRESERVED",
  "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED",
  "PHASE_18_NOT_CERTIFIED",
  "MISSION_CONTROL_NOT_QUALIFIED_FOR_CONTINUOUS_ADAPTIVE_OPERATION",
  "NONDETERMINISTIC_MONITORING",
  "NONDETERMINISTIC_CHANGE_DETECTION",
  "NONDETERMINISTIC_SIMULATION",
  "NONDETERMINISTIC_QUALIFICATION",
  "REPLAY_DIVERGENCE_WITHOUT_GOVERNED_EXPLANATION",
  "GOVERNANCE_VIOLATION",
  "CONSTITUTIONAL_VIOLATION",
  "AUTHORITY_EXPANSION",
  "MISSING_IMPLEMENTATION_ATTESTATION",
  "MUTABLE_OPERATIONAL_HISTORY",
  "MUTABLE_CERTIFICATION_LINEAGE",
  "MUTABLE_RECOMMENDATION_LINEAGE",
  "MUTABLE_IMPLEMENTATION_LINEAGE",
  "INCOMPLETE_OPERATIONAL_EVIDENCE",
  "INCOMPLETE_REPLAY_EVIDENCE",
  "MISSING_RISK_INTELLIGENCE",
  "PHASE_18_11_OPERATIONAL_EVOLUTION_NOT_VALID",
];

describe("continuous adaptive operations certification gate", () => {
  it("publishes the Phase 18.12 doctrine and validates the baseline bundle", () => {
    const bundle = getContinuousAdaptiveOperationsCertificationBundle();

    expect(bundle.doctrine.version).toBe("continuous-adaptive-operations-certification/v18.12");
    expect(bundle.doctrine.upstream_phase).toBe("operational-evolution-knowledge/v18.11");
    expect(bundle.doctrine.outcome_family).toBe("Amendment 29");
    expect(bundle.doctrine.phase_18_services).toHaveLength(11);
    expect(bundle.doctrine.evidence_domains).toHaveLength(13);
    expect(bundle.doctrine.constitutional_requirements).toHaveLength(14);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("requires all Phase 18 certification preconditions", () => {
    const result = runContinuousAdaptiveOperationsCertification();

    expect(result.preconditions.completed_services).toHaveLength(11);
    expect(result.preconditions.standing_constitutional_services_operational).toBe(true);
    expect(result.preconditions.operational_evidence_complete).toBe(true);
    expect(result.preconditions.replay_infrastructure_operational).toBe(true);
    expect(result.preconditions.evolution_lineage_complete).toBe(true);
    expect(result.preconditions.knowledge_registry_populated).toBe(true);
    expect(result.preconditions.continuous_certification_operational).toBe(true);
    expect(result.preconditions.risk_intelligence_operational).toBe(true);
    expect(result.preconditions.governance_validation_complete).toBe(true);
    expect(result.preconditions.tenant_isolation_verified).toBe(true);
    expect(result.preconditions.external_attestation_framework_operational).toBe(true);
  });

  it("collects complete immutable replayable evidence across every required domain", () => {
    const result = runContinuousAdaptiveOperationsCertification();

    expect(result.evidence_domains).toHaveLength(13);
    expect(new Set(result.evidence_domains.map((domain) => domain.domain)).size).toBe(13);
    for (const domain of result.evidence_domains) {
      expect(domain.evidence_refs.length).toBeGreaterThan(0);
      expect(domain.complete).toBe(true);
      expect(domain.immutable).toBe(true);
      expect(domain.replayable).toBe(true);
      expect(domain.explainable).toBe(true);
    }
  });

  it("verifies all constitutional validation requirements", () => {
    const result = runContinuousAdaptiveOperationsCertification();

    expect(result.constitutional_validation.requirements).toHaveLength(14);
    expect(result.constitutional_validation.historical_truth_preserved).toBe(true);
    expect(result.constitutional_validation.learning_governance_enforced).toBe(true);
    expect(result.constitutional_validation.optimization_authority_bounded).toBe(true);
    expect(result.constitutional_validation.advisory_recommendations_only).toBe(true);
    expect(result.constitutional_validation.qualification_no_implementation_authority).toBe(true);
    expect(result.constitutional_validation.certification_no_implementation_assumption).toBe(true);
    expect(result.constitutional_validation.external_attestation_required).toBe(true);
    expect(result.constitutional_validation.replay_deterministic_across_evolution).toBe(true);
    expect(result.constitutional_validation.standing_services_fail_closed).toBe(true);
    expect(result.constitutional_validation.tenant_isolation_preserved).toBe(true);
    expect(result.constitutional_validation.operational_knowledge_immutable).toBe(true);
    expect(result.constitutional_validation.historical_evidence_additive).toBe(true);
    expect(result.constitutional_validation.lineage_complete).toBe(true);
    expect(result.constitutional_validation.governance_authority_supreme).toBe(true);
  });

  it("passes the required certification test matrix", () => {
    const result = runContinuousAdaptiveOperationsCertification();
    const matrixNames = result.certification_matrix.map((entry) => entry.name);

    expect(result.certification_matrix).toHaveLength(24);
    expect(matrixNames).toContain("Continuous monitoring operational");
    expect(matrixNames).toContain("Operational change detection deterministic");
    expect(matrixNames).toContain("Simulation deterministic");
    expect(matrixNames).toContain("Adaptation qualification deterministic");
    expect(matrixNames).toContain("External implementation attested");
    expect(matrixNames).toContain("Continuous Improvement Ledger complete");
    expect(matrixNames).toContain("Mission Control qualified for continuous adaptive operation");
    expect(result.certification_matrix.every((entry) => entry.expected === "PASS" && entry.actual === "PASS" && entry.passed)).toBe(true);
  });

  it("certifies the full Phase 18 exit criteria", () => {
    const result = runContinuousAdaptiveOperationsCertification();

    expect(result.certification_package.continuous_operations_certified).toBe(true);
    expect(result.certification_package.perpetual_operational_governance_verified).toBe(true);
    expect(result.certification_package.continuous_monitoring_operational).toBe(true);
    expect(result.certification_package.deterministic_operational_adaptation_validated).toBe(true);
    expect(result.certification_package.adaptation_qualification_verified).toBe(true);
    expect(result.certification_package.continuous_certification_operational).toBe(true);
    expect(result.certification_package.replay_continuously_reproducible).toBe(true);
    expect(result.certification_package.governance_supremacy_preserved).toBe(true);
    expect(result.certification_package.advisory_only_boundary_enforced).toBe(true);
    expect(result.certification_package.external_implementation_attestation_verified).toBe(true);
    expect(result.certification_package.immutable_operational_evolution_lineage_verified).toBe(true);
    expect(result.certification_package.continuous_improvement_ledger_complete).toBe(true);
    expect(result.certification_package.operational_knowledge_preserved).toBe(true);
    expect(result.certification_package.operational_evidence_immutable).toBe(true);
    expect(result.certification_package.deterministic_risk_intelligence_operational).toBe(true);
    expect(result.certification_package.observability_complete).toBe(true);
    expect(result.certification_package.explainability_reproducible).toBe(true);
    expect(result.certification_package.tenant_isolation_preserved).toBe(true);
    expect(result.certification_package.constitutional_compliance_verified).toBe(true);
    expect(result.certification_package.phase_18_certified).toBe(true);
    expect(result.certification_package.mission_control_qualified_for_continuous_adaptive_operation).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runContinuousAdaptiveOperationsCertification();
    const second = runContinuousAdaptiveOperationsCertification();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateContinuousAdaptiveOperationsCertification(first).valid).toBe(true);
    expect(replayContinuousAdaptiveOperationsCertification(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runContinuousAdaptiveOperationsCertification({ scenario: "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" });
    const validation = validateContinuousAdaptiveOperationsCertification(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_CERTIFICATION_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_matrix_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runContinuousAdaptiveOperationsCertification({ scenario });
    const validation = validateContinuousAdaptiveOperationsCertification(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runContinuousAdaptiveOperationsCertification();
    const tamperedConstitutional: ContinuousAdaptiveOperationsResult = {
      ...result,
      constitutional_validation: {
        ...result.constitutional_validation,
        governance_authority_supreme: false,
      },
    };
    const tamperedReplay: ContinuousAdaptiveOperationsResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const constitutionalValidation = validateContinuousAdaptiveOperationsCertification(tamperedConstitutional);
    const replayValidation = validateContinuousAdaptiveOperationsCertification(tamperedReplay);

    expect(constitutionalValidation.valid).toBe(false);
    expect(constitutionalValidation.constitutional_validation_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
