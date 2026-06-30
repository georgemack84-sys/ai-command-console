import { describe, expect, it } from "vitest";
import {
  buildComplianceEvaluationContract,
  buildComplianceEvaluationDoctrine,
  buildComplianceEvaluationObservabilitySurface,
  buildComplianceEvaluationRecord,
  buildComplianceEvaluationRequest,
  computeComplianceEvaluationHash,
  decideCompliance,
  evaluateCompliance,
  processComplianceThreshold,
  replayComplianceEvaluation,
  scoreCompliance,
  validateComplianceEvaluationRecord,
} from "@/services/compliance-evaluation";

describe("Mission Control Phase 7D.2 Compliance Evaluation Engine", () => {
  it("defines the evaluation engine, pipeline, rule evaluator, threshold processor, scoring engine, and ledger", () => {
    const doctrine = buildComplianceEvaluationDoctrine();
    const contract = buildComplianceEvaluationContract();
    const evaluation = evaluateCompliance();
    expect(doctrine.contract_version).toBe("COMPLIANCE-EVALUATION-V1");
    expect(doctrine.pipeline_stages).toContain("rules");
    expect(doctrine.pipeline_stages).toContain("ledger_recording");
    expect(contract.rule_registry_size).toBeGreaterThan(0);
    expect(contract.threshold_registry_size).toBeGreaterThan(0);
    expect(evaluation.rule_evaluation_result.rule_evaluation_hash).toBeTruthy();
    expect(evaluation.threshold_result.threshold_hash).toBeTruthy();
    expect(evaluation.score_result.score_calculation_hash).toBeTruthy();
    expect(evaluation.ledger_record.evaluation_ledger_id).toBeTruthy();
  });

  it("evaluates valid rules and fails closed for missing rules", () => {
    expect(validateComplianceEvaluationRecord(evaluateCompliance()).validation_state).toBe("VALID");
    const missing = evaluateCompliance({ rule_reference: "RULE-UNKNOWN" });
    expect(missing.rule_evaluation_result.rule_result).toBe("UNKNOWN");
    expect(validateComplianceEvaluationRecord(missing).errors.some((error) => error.reason === "RULE_UNRESOLVED")).toBe(true);
  });

  it("evaluates policy compliance, violations, supersession, and approved exceptions", () => {
    expect(evaluateCompliance({ compliance_type: "POLICY_COMPLIANCE" }).policy_result).toBe("POLICY_SATISFIED");
    const violated = evaluateCompliance({ compliance_type: "POLICY_COMPLIANCE", scenario: "POLICY_VIOLATION" });
    expect(violated.policy_result).toBe("POLICY_VIOLATED");
    expect(violated.evaluation_status).toBe("FAIL");
    expect(evaluateCompliance({ scenario: "POLICY_SUPERSEDED" }).policy_result).toBe("POLICY_SUPERSEDED");
    const exception = evaluateCompliance({ scenario: "POLICY_EXCEPTION" });
    expect(exception.policy_result).toBe("POLICY_EXCEPTION_APPLIED");
    expect(exception.requirement_match_result.exception_references.length).toBe(1);
  });

  it("evaluates constitutional compliance and critical constitutional overrides", () => {
    expect(evaluateCompliance({ compliance_type: "CONSTITUTIONAL_COMPLIANCE" }).constitutional_result).toBe("CONSTITUTION_ALIGNED");
    expect(evaluateCompliance({ compliance_type: "CONSTITUTIONAL_COMPLIANCE", scenario: "CONSTITUTIONAL_VIOLATION" }).evaluation_status).toBe("CRITICAL");
    expect(evaluateCompliance({ scenario: "GOVERNANCE_BYPASS" }).constitutional_result).toBe("GOVERNANCE_SUPREMACY_VIOLATED");
    expect(evaluateCompliance({ scenario: "GOVERNANCE_BYPASS" }).evaluation_status).toBe("CRITICAL");
    expect(evaluateCompliance({ scenario: "OPERATOR_BYPASS" }).constitutional_result).toBe("OPERATOR_SUPREMACY_VIOLATED");
    expect(evaluateCompliance({ scenario: "OPERATOR_BYPASS" }).evaluation_status).toBe("CRITICAL");
  });

  it("evaluates authority compliance, unauthorized behavior, privilege escalation, and boundaries", () => {
    expect(evaluateCompliance({ compliance_type: "AUTHORITY_COMPLIANCE" }).authority_result).toBe("AUTHORITY_RESPECTED");
    expect(evaluateCompliance({ compliance_type: "AUTHORITY_COMPLIANCE", scenario: "UNAUTHORIZED_BEHAVIOR" }).authority_result).toBe("UNAUTHORIZED_BEHAVIOR_DETECTED");
    expect(evaluateCompliance({ scenario: "PRIVILEGE_ESCALATION" }).authority_result).toBe("PRIVILEGE_ESCALATION_DETECTED");
    const breach = evaluateCompliance({ scenario: "BOUNDARY_BREACH" });
    expect(breach.authority_result).toBe("BOUNDARY_BREACHED");
    expect(breach.evaluation_status).toBe("CRITICAL");
  });

  it("evaluates operational compliance, workflow deviation, missing checkpoints, and execution restrictions", () => {
    expect(evaluateCompliance({ compliance_type: "OPERATIONAL_COMPLIANCE" }).operational_result).toBe("WORKFLOW_ADHERED");
    expect(evaluateCompliance({ scenario: "WORKFLOW_DEVIATION" }).operational_result).toBe("WORKFLOW_DEVIATION_DETECTED");
    const checkpoint = evaluateCompliance({ scenario: "GOVERNANCE_CHECKPOINT_MISSING" });
    expect(checkpoint.operational_result).toBe("GOVERNANCE_CHECKPOINT_MISSING");
    expect(checkpoint.evaluation_status).toBe("FAIL");
    expect(evaluateCompliance({ scenario: "EXECUTION_RESTRICTION_VIOLATED" }).evaluation_status).toBe("CRITICAL");
  });

  it("collects evidence and blocks PASS for missing, invalid, and tampered evidence", () => {
    expect(evaluateCompliance().supporting_evidence.length).toBeGreaterThan(0);
    const missing = evaluateCompliance({ scenario: "MISSING_EVIDENCE" });
    expect(missing.evaluation_status).toBe("UNKNOWN");
    expect(validateComplianceEvaluationRecord(missing).validation_state).toBe("UNKNOWN");
    const invalid = evaluateCompliance({ scenario: "INVALID_EVIDENCE" });
    expect(invalid.evaluation_status).toBe("FAIL");
    expect(validateComplianceEvaluationRecord(invalid).errors.some((error) => error.reason === "EVIDENCE_INVALID")).toBe(true);
    const tampered = evaluateCompliance({ scenario: "TAMPERED_EVIDENCE" });
    expect(tampered.evaluation_status).toBe("CRITICAL");
    expect(validateComplianceEvaluationRecord(tampered).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("keeps score, threshold, and decision generation deterministic and detects mismatches", () => {
    const evaluation = evaluateCompliance();
    expect(scoreCompliance(evaluation.compliance_measurement, evaluation.evidence_validation_result, evaluation.violation_result).score_calculation_hash).toBe(evaluation.score_result.score_calculation_hash);
    expect(processComplianceThreshold(evaluation.replay_snapshot.threshold_snapshot, evaluation.score_result, evaluation.violation_result).threshold_hash).toBe(evaluation.threshold_result.threshold_hash);
    const request = buildComplianceEvaluationRequest();
    expect(decideCompliance(evaluation.threshold_result, evaluation.evidence_validation_result, evaluation.rule_evaluation_result, request).decision_hash).toBe(evaluation.decision_result.decision_hash);
    expect(validateComplianceEvaluationRecord(buildComplianceEvaluationRecord({ compliance_score: 12 })).errors.some((error) => error.reason === "SCORE_MISMATCH")).toBe(true);
    expect(validateComplianceEvaluationRecord(buildComplianceEvaluationRecord({ threshold_result: { ...evaluation.threshold_result, status_output: "FAIL" } })).errors.some((error) => error.reason === "THRESHOLD_MISMATCH")).toBe(true);
    expect(validateComplianceEvaluationRecord(buildComplianceEvaluationRecord({ decision_result: { ...evaluation.decision_result, evaluation_status: "FAIL" } })).errors.some((error) => error.reason === "DECISION_MISMATCH")).toBe(true);
  });

  it("writes ledger records and blocks certification on ledger write failure", () => {
    const evaluation = evaluateCompliance();
    expect(evaluation.ledger_record.truth_ledger_reference).toBe(evaluation.truth_ledger_reference);
    const failed = evaluateCompliance({ scenario: "LEDGER_WRITE_FAILURE" });
    expect(validateComplianceEvaluationRecord(failed).errors.some((error) => error.reason === "LEDGER_WRITE_FAILED")).toBe(true);
    expect(validateComplianceEvaluationRecord(failed).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("creates replay snapshots, reproduces evaluations, and detects replay mismatch", () => {
    const evaluation = evaluateCompliance();
    expect(evaluation.replay_snapshot.replay_hash).toBeTruthy();
    expect(replayComplianceEvaluation(evaluation).replay_state).toBe("REPRODUCED");
    expect(replayComplianceEvaluation(buildComplianceEvaluationRecord({ evaluation_hash: "tampered" })).replay_state).toBe("MISMATCH");
    const mismatch = evaluateCompliance({ scenario: "REPLAY_MISMATCH" });
    expect(validateComplianceEvaluationRecord(mismatch).validation_state).toBe("REPLAY_MISMATCH");
  });

  it("preserves tenant isolation and blocks cross-tenant evidence", () => {
    expect(validateComplianceEvaluationRecord(evaluateCompliance()).checks.tenant_isolation_valid).toBe(true);
    const leaked = evaluateCompliance({ scenario: "CROSS_TENANT_EVIDENCE" });
    expect(leaked.evaluation_status).toBe("CRITICAL");
    expect(validateComplianceEvaluationRecord(leaked).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("prohibits hidden state", () => {
    const record = evaluateCompliance();
    const validation = validateComplianceEvaluationRecord({ ...record, hidden_state: true } as never);
    expect(validation.errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED")).toBe(true);
    expect(validation.validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("generates deterministic hashes and operator visibility", () => {
    const record = evaluateCompliance();
    expect(computeComplianceEvaluationHash(record)).toBe(record.evaluation_hash);
    const surface = buildComplianceEvaluationObservabilitySurface(record);
    expect(surface.evaluation_status).toBe("PASS");
    expect(surface.rule_evaluated).toBe(record.rule_reference);
    expect(surface.threshold_applied).toBe(record.threshold_reference);
    expect(surface.replay_state).toBe("REPRODUCED");
    expect(surface.validation_failures).toEqual([]);
  });
});
