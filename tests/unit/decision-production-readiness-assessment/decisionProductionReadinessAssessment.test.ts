import { describe, expect, it } from "vitest";
import {
  computeProductionReadinessHash,
  getProductionReadinessFoundation,
  PRODUCTION_READINESS_CHECKS,
  PRODUCTION_READINESS_DOMAINS,
  replayProductionReadinessAssessment,
  runProductionReadinessAssessment,
} from "@/services/decision-production-readiness-assessment";
import type { ProductionReadinessFailure, ProductionReadinessInput } from "@/types/decision-production-readiness-assessment";

describe("Mission Control Phase 9.12.11 Production Readiness Assessment", () => {
  it("publishes the production readiness foundation", () => {
    const foundation = getProductionReadinessFoundation();

    expect(foundation.certification_version).toBe("decision-production-readiness-assessment/v1");
    expect(foundation.domains).toEqual(PRODUCTION_READINESS_DOMAINS);
    expect(foundation.checks).toEqual(PRODUCTION_READINESS_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates the production readiness checklist", () => {
    const result = runProductionReadinessAssessment();

    expect(computeProductionReadinessHash(result.checklist)).toBe(result.checklist.integrity_hash);
    expect(result.checklist.validation_state).toBe("PASS");
    expect(result.checklist.security_certification_passed).toBe(true);
    expect(result.checklist.operational_procedures_approved).toBe(true);
  });

  it("validates performance, scalability, and reliability readiness", () => {
    const result = runProductionReadinessAssessment();

    expect(result.performance_report.validation_state).toBe("PASS");
    expect(result.scalability_report.validation_state).toBe("PASS");
    expect(result.reliability_report.validation_state).toBe("PASS");
    expect(result.validation.performance_ready).toBe(true);
    expect(result.validation.scalability_ready).toBe(true);
    expect(result.validation.reliability_ready).toBe(true);
  });

  it("validates explainability, replay, governance, and advisory readiness", () => {
    const result = runProductionReadinessAssessment();

    expect(result.explainability_report.validation_state).toBe("PASS");
    expect(result.scorecard.replay_readiness).toBe("PASS");
    expect(result.scorecard.governance_readiness).toBe("PASS");
    expect(result.validation.explainability_ready).toBe(true);
    expect(result.validation.replay_ready).toBe(true);
    expect(result.validation.governance_ready).toBe(true);
  });

  it("validates monitoring and disaster recovery readiness", () => {
    const result = runProductionReadinessAssessment();

    expect(result.monitoring_report.validation_state).toBe("PASS");
    expect(result.disaster_recovery_report.validation_state).toBe("PASS");
    expect(result.validation.monitoring_ready).toBe(true);
    expect(result.validation.disaster_recovery_ready).toBe(true);
    expect(result.validation.backup_validated).toBe(true);
    expect(result.validation.recovery_validated).toBe(true);
  });

  it("collects immutable evidence and writes readiness ledger entries", () => {
    const result = runProductionReadinessAssessment();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.readiness_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.readiness_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves controlled production when every readiness domain passes", () => {
    const result = runProductionReadinessAssessment();

    expect(result.scorecard.overall_score).toBe(100);
    expect(result.scorecard.final_recommendation).toBe("APPROVE_CONTROLLED_PRODUCTION");
    expect(result.operational_report.certification_decision).toBe("PASS");
    expect(result.operational_report.production_approval_recommendation).toBe("APPROVE_CONTROLLED_PRODUCTION");
    expect(result.approved_for_controlled_production).toBe(true);
  });

  it("remains replayable, advisory-only, and non-mutating", () => {
    const result = runProductionReadinessAssessment();

    expect(replayProductionReadinessAssessment(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["SECURITY_INVALID", "SECURITY_CERTIFICATION_INVALID"],
    ["PERFORMANCE_MISS", "PERFORMANCE_OBJECTIVES_NOT_ACHIEVED"],
    ["LATENCY_UNACCEPTABLE", "ORCHESTRATION_LATENCY_UNACCEPTABLE"],
    ["SCALABILITY_NONDETERMINISM", "SCALABILITY_NONDETERMINISM"],
    ["CONCURRENT_LIMIT", "CONCURRENT_WORKLOAD_LIMITATION"],
    ["RUNTIME_INSTABILITY", "RUNTIME_INSTABILITY"],
    ["RELIABILITY_FAILURE", "RELIABILITY_FAILURE"],
    ["MISSING_EXPLANATIONS", "MISSING_RECOMMENDATION_EXPLANATIONS"],
    ["REPLAY_NOT_READY", "REPLAY_NOT_PRODUCTION_READY"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["GOVERNANCE_INCOMPLETE", "GOVERNANCE_ENFORCEMENT_INCOMPLETE"],
    ["CONSTITUTIONAL_INCOMPLETE", "CONSTITUTIONAL_ENFORCEMENT_INCOMPLETE"],
    ["AUTHORITY_FAILURE", "AUTHORITY_VALIDATION_FAILURE"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["ADVISORY_ONLY_FAILURE", "ADVISORY_ONLY_FAILURE"],
    ["MONITORING_GAP", "MONITORING_GAPS"],
    ["MISSING_PROCEDURES", "MISSING_OPERATIONAL_PROCEDURES"],
    ["DR_NOT_VALIDATED", "DISASTER_RECOVERY_NOT_VALIDATED"],
    ["BACKUP_FAILURE", "BACKUP_FAILURE"],
    ["RECOVERY_FAILURE", "RECOVERY_FAILURE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILURE"],
    ["HIDDEN_DEPENDENCY", "HIDDEN_OPERATIONAL_DEPENDENCY"],
    ["FAIL_OPEN", "FAIL_OPEN_OPERATIONAL_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<ProductionReadinessInput["scenario"]>, ProductionReadinessFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runProductionReadinessAssessment({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.scorecard.final_recommendation).toBe("BLOCK_PRODUCTION");
    expect(result.operational_report.production_approval_recommendation).toBe("BLOCK_PRODUCTION");
    expect(result.approved_for_controlled_production).toBe(false);
  });

  it("fails closed when the role lacks production readiness visibility", () => {
    const result = runProductionReadinessAssessment({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects production readiness tampering", () => {
    const result = runProductionReadinessAssessment();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayProductionReadinessAssessment(tampered)).toBe(false);
  });
});
