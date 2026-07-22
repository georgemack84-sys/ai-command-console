import { describe, expect, it } from "vitest";
import {
  getAdaptationQualificationServiceBundle,
  replayAdaptationQualificationService,
  runAdaptationQualificationService,
  validateAdaptationQualificationService,
} from "@/services/adaptation-qualification-service";
import type { AdaptationQualificationFailure, AdaptationQualificationResult } from "@/types/adaptation-qualification-service";

const failureScenarios: AdaptationQualificationFailure[] = [
  "QUALIFICATION_NOT_DETERMINISTIC",
  "EVIDENCE_INCOMPLETE",
  "REPLAY_NOT_REPRODUCIBLE",
  "QUALIFICATION_LINEAGE_NOT_PRESERVED",
  "GOVERNANCE_VALIDATION_INCOMPLETE",
  "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED",
  "TENANT_ISOLATION_NOT_PRESERVED",
  "QUALIFICATION_AUDIT_INCOMPLETE",
  "RECOMMENDATION_ELIGIBILITY_NOT_GOVERNED",
  "IMPLEMENTATION_AUTHORITY_GRANTED",
  "QUALIFICATION_RECORD_MUTABLE",
  "UNKNOWN_RULE_NOT_FAIL_CLOSED",
  "PHASE_18_5_SIMULATION_NOT_VALID",
];

describe("adaptation qualification service", () => {
  it("publishes the Phase 18.6 doctrine and validates the baseline bundle", () => {
    const bundle = getAdaptationQualificationServiceBundle();

    expect(bundle.doctrine.version).toBe("adaptation-qualification-service/v18.6");
    expect(bundle.doctrine.upstream_phase).toBe("adaptation-simulation-engine/v18.5");
    expect(bundle.doctrine.workflow_states).toEqual([
      "SIMULATION_COMPLETED",
      "EVIDENCE_COLLECTION",
      "EVIDENCE_VALIDATION",
      "CONSTITUTIONAL_EVALUATION",
      "GOVERNANCE_EVALUATION",
      "REPLAY_VERIFICATION",
      "OPERATIONAL_IMPACT_EVALUATION",
      "QUALIFICATION_DECISION",
      "IMMUTABLE_QUALIFICATION_RECORD",
    ]);
    expect(bundle.doctrine.evaluation_domains).toHaveLength(10);
    expect(bundle.doctrine.decision_outcomes).toEqual([
      "QUALIFIED",
      "CONDITIONALLY_QUALIFIED",
      "REQUIRES_MORE_EVIDENCE",
      "REQUIRES_GOVERNANCE_REVIEW",
      "REJECTED",
    ]);
    expect(bundle.result.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
  });

  it("keeps qualification deterministic, evidentiary-only, and non-authorizing", () => {
    const result = runAdaptationQualificationService();

    expect(result.qualification_service.deterministic).toBe(true);
    expect(result.qualification_service.evidentiary_only).toBe(true);
    expect(result.qualification_service.implementation_authority_granted).toBe(false);
    expect(result.qualification_service.qualification_outcome_determined).toBe(true);
    expect(result.qualification_service.immutable_lineage_preserved).toBe(true);
  });

  it("evaluates governed policies and rules deterministically", () => {
    const result = runAdaptationQualificationService();

    expect(result.policy_engine.domains).toHaveLength(10);
    expect(result.policy_engine.constitutional_requirements).toBe(true);
    expect(result.policy_engine.governance_requirements).toBe(true);
    expect(result.policy_engine.replay_requirements).toBe(true);
    expect(result.policy_engine.evidence_requirements).toBe(true);
    expect(result.policy_engine.deterministic_policy_evaluation).toBe(true);
    expect(result.policy_engine.unknown_rules_fail_closed).toBe(true);
    expect(result.rule_evaluator.replay_validated).toBe(true);
    expect(result.rule_evaluator.operational_impact_acceptable).toBe(true);
  });

  it("records an immutable qualified decision", () => {
    const result = runAdaptationQualificationService();
    const [decision] = result.decision_registry.decisions;

    expect(result.decision_registry.immutable_records).toBe(true);
    expect(result.decision_registry.evidence_lineage_tracked).toBe(true);
    expect(decision.qualification_outcome).toBe("QUALIFIED");
    expect(decision.constitutional_result).toBe("PASS");
    expect(decision.governance_result).toBe("PASS");
    expect(decision.replay_result).toBe("PASS");
    expect(decision.operational_result).toBe("PASS");
    expect(decision.evidence_refs.length).toBeGreaterThan(0);
    expect(decision.simulation_refs.length).toBeGreaterThan(0);
  });

  it("maintains complete qualification evidence and lineage", () => {
    const result = runAdaptationQualificationService();

    expect(result.evidence_ledger.simulation_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_ledger.replay_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_ledger.governance_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_ledger.operational_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_ledger.constitutional_evidence.length).toBeGreaterThan(0);
    expect(result.evidence_ledger.integrity_verification).toBe(true);
    expect(result.evidence_ledger.append_only).toBe(true);
    expect(result.qualification_lineage.no_lineage_removed).toBe(true);
    expect(result.qualification_lineage.simulation_executions.length).toBeGreaterThan(0);
    expect(result.qualification_lineage.certification_evidence.length).toBeGreaterThan(0);
  });

  it("preserves qualification workflow ordering and replay reproducibility", () => {
    const result = runAdaptationQualificationService();

    expect(result.workflow_manager.transitions_deterministic).toBe(true);
    expect(result.workflow_manager.qualification_precedes_recommendation).toBe(true);
    expect(result.workflow_manager.validation_order_preserved).toBe(true);
    expect(result.workflow_manager.immutable_record_committed).toBe(true);
    expect(result.replay_validator.identical_evidence_selection).toBe(true);
    expect(result.replay_validator.identical_rule_execution).toBe(true);
    expect(result.replay_validator.identical_qualification_outcome).toBe(true);
    expect(result.replay_validator.replay_divergence_fails_qualification).toBe(true);
  });

  it("keeps qualification audit complete and authority boundaries auditable", () => {
    const result = runAdaptationQualificationService();

    expect(result.audit_service.audit_complete).toBe(true);
    expect(result.audit_service.immutable_audit).toBe(true);
    expect(result.audit_service.decision_auditable).toBe(true);
    expect(result.audit_service.supersession_additive).toBe(true);
    expect(result.audit_service.tenant_boundary_audited).toBe(true);
    expect(result.audit_service.authority_boundary_audited).toBe(true);
  });

  it("certifies the Phase 18.6 exit criteria", () => {
    const result = runAdaptationQualificationService();

    expect(result.certification_package.qualification_deterministic).toBe(true);
    expect(result.certification_package.evidence_complete).toBe(true);
    expect(result.certification_package.replay_reproducible).toBe(true);
    expect(result.certification_package.qualification_lineage_preserved).toBe(true);
    expect(result.certification_package.governance_validation_complete).toBe(true);
    expect(result.certification_package.constitutional_compliance_verified).toBe(true);
    expect(result.certification_package.tenant_isolation_preserved).toBe(true);
    expect(result.certification_package.qualification_audit_complete).toBe(true);
    expect(result.certification_package.recommendation_eligibility_governed).toBe(true);
    expect(result.certification_package.adaptation_qualification_certified).toBe(true);
    expect(result.certification_tests).toHaveLength(9);
    expect(result.certification_tests.every((test) => test.passed)).toBe(true);
  });

  it("is deterministic and replayable", { timeout: 300_000 }, () => {
    const first = runAdaptationQualificationService();
    const second = runAdaptationQualificationService();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAdaptationQualificationService(first).valid).toBe(true);
    expect(replayAdaptationQualificationService(first)).toBe(true);
  });

  it("allows a non-constitutional warning only as a conditional non-valid pass", () => {
    const result = runAdaptationQualificationService({
      scenario: "NON_CONSTITUTIONAL_QUALIFICATION_WARNING",
    });
    const validation = validateAdaptationQualificationService(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual(["NON_CONSTITUTIONAL_QUALIFICATION_WARNING"]);
    expect(validation.valid).toBe(false);
    expect(validation.certification_valid).toBe(true);
  });

  it.each(failureScenarios)("fails deterministically for %s", (scenario) => {
    const result = runAdaptationQualificationService({ scenario });
    const validation = validateAdaptationQualificationService(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(scenario);
  });

  it("detects component and replay tampering", () => {
    const result = runAdaptationQualificationService();
    const tamperedDecision: AdaptationQualificationResult = {
      ...result,
      decision_registry: {
        ...result.decision_registry,
        immutable_records: false,
      },
    };
    const tamperedReplay: AdaptationQualificationResult = {
      ...result,
      replay_hash: "tampered-replay-hash",
    };
    const decisionValidation = validateAdaptationQualificationService(tamperedDecision);
    const replayValidation = validateAdaptationQualificationService(tamperedReplay);

    expect(decisionValidation.valid).toBe(false);
    expect(decisionValidation.decision_valid).toBe(false);
    expect(replayValidation.valid).toBe(false);
    expect(replayValidation.result_replay_valid).toBe(false);
  });
});
