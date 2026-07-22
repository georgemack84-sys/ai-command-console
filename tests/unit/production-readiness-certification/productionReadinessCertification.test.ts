import { describe, expect, it } from "vitest";

import {
  certifyProductionReadiness,
  getProductionReadinessContract,
  replayProductionReadinessCertification,
  validateProductionReadinessCertification,
} from "../../../services/production-readiness-certification";
import type { ProductionReadinessFailure, ProductionReadinessScenario } from "../../../types/production-readiness-certification";

const failureScenarios: ReadonlyArray<readonly [ProductionReadinessScenario, ProductionReadinessFailure]> = [
  ["SCALABILITY_DETERMINISM_COMPROMISED", "SCALABILITY_COMPROMISED_DETERMINISM"],
  ["OPERATIONAL_INSTABILITY", "OPERATIONAL_INSTABILITY_DETECTED"],
  ["INCOMPLETE_OBSERVABILITY", "OBSERVABILITY_INCOMPLETE"],
  ["GOVERNANCE_FAILURE", "GOVERNANCE_ENFORCEMENT_FAILURE"],
  ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_ENFORCEMENT_FAILURE"],
  ["REPLAY_UNAVAILABLE", "REPLAY_UNAVAILABLE"],
  ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENT"],
  ["FAIL_OPEN_BEHAVIOR", "FAIL_OPEN_BEHAVIOR_DETECTED"],
  ["OPERATOR_WORKFLOW_FAILURE", "OPERATOR_WORKFLOW_FAILURE"],
  ["INCOMPLETE_CERTIFICATION_DEPENDENCIES", "CERTIFICATION_DEPENDENCIES_INCOMPLETE"],
  ["UNRESOLVED_SAFETY_FINDINGS", "UNRESOLVED_ADAPTIVE_SAFETY_FINDINGS"],
  ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH"],
  ["ADVISORY_BOUNDARY_VIOLATION", "ADVISORY_ONLY_BOUNDARY_VIOLATION"],
  ["INCOMPLETE_RECOVERY", "RECOVERY_PROCEDURES_INCOMPLETE"],
  ["PRODUCTION_READINESS_UNMET", "PRODUCTION_READINESS_CRITERIA_UNMET"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("production readiness certification", () => {
  it("publishes the production readiness doctrine", () => {
    const contract = getProductionReadinessContract();

    expect(contract.doctrine.version).toBe("production-readiness-certification/v10.15.9");
    expect(contract.doctrine.deterministic_required).toBe(true);
    expect(contract.doctrine.governance_required).toBe(true);
    expect(contract.doctrine.replay_required).toBe(true);
    expect(contract.doctrine.observability_required).toBe(true);
    expect(contract.doctrine.fail_closed_required).toBe(true);
    expect(contract.doctrine.operator_workflows_required).toBe(true);
    expect(contract.doctrine.certification_dependencies).toEqual(expect.arrayContaining(["Adaptive Contract Certification", "Adaptive Ledger Certification"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies production readiness deterministically", () => {
    const first = certifyProductionReadiness();
    const second = certifyProductionReadiness();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.production_ready).toBe(true);
    expect(first.deterministic).toBe(true);
    expect(first.observable).toBe(true);
    expect(first.governed).toBe(true);
    expect(first.replayable).toBe(true);
    expect(first.fail_closed).toBe(true);
    expect(first.operator_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateProductionReadinessCertification(first).valid).toBe(true);
    expect(replayProductionReadinessCertification(first)).toBe(true);
  });

  it("validates every readiness domain", () => {
    const result = certifyProductionReadiness();

    expect(result.scalability_validation.multi_tenant_scalability_validated).toBe(true);
    expect(result.stability_validation.long_duration_operation_stable).toBe(true);
    expect(result.observability_validation.distributed_tracing_operational).toBe(true);
    expect(result.governance_validation.constitutional_enforcement_verified).toBe(true);
    expect(result.replay_validation.replay_services_continuously_available).toBe(true);
    expect(result.fail_closed_validation.deterministic_rollback_validated).toBe(true);
    expect(result.operator_workflow_validation.certification_review_validated).toBe(true);
    expect(result.certification_completeness_validation.all_phase_10_certifications_passed).toBe(true);
    expect(result.operational_recovery_validation.operational_recovery_validated).toBe(true);
  });

  it("emits complete readiness reports", () => {
    const result = certifyProductionReadiness();

    expect(result.certification_report.production_deployment_recommendation).toBe("APPROVE");
    expect(result.certification_report.certification_dependency_review).toBe("PASS");
    expect(result.operational_readiness_assessment.deployment_readiness_summary).toBe("READY");
    expect(result.operational_readiness_assessment.operational_health_score).toBe(1);
    expect(result.operational_readiness_assessment.certification_evidence_refs.length).toBeGreaterThan(8);
    expect(result.validation_tests).toHaveLength(24);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyProductionReadiness({ scenario });
    const validation = validateProductionReadinessCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayProductionReadinessCertification(result)).toBe(false);
  });

  it("detects tampering through integrity checks", () => {
    const result = certifyProductionReadiness();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        production_ready: false,
      },
    };

    expect(validateProductionReadinessCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayProductionReadinessCertification(tampered)).toBe(false);
  });
});
