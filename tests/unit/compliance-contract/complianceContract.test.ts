import { describe, expect, it } from "vitest";
import {
  buildComplianceCategoryRegistry,
  buildComplianceContractDoctrine,
  buildComplianceObservabilitySurface,
  buildComplianceRecord,
  buildComplianceRuleRegistry,
  buildComplianceThresholdRegistry,
  calculateComplianceConfidence,
  calculateComplianceStatus,
  computeComplianceHash,
  generateComplianceId,
  replayComplianceRecord,
  transitionComplianceContractLifecycle,
  validateComplianceRecord,
} from "@/services/compliance-contract";

describe("Mission Control Phase 7D.1 Compliance Contract", () => {
  it("defines the compliance contract, required fields, categories, and scopes", () => {
    const doctrine = buildComplianceContractDoctrine();
    expect(doctrine.contract_version).toBe("COMPLIANCE-CONTRACT-V1");
    expect(doctrine.principles).toContain("deterministic");
    expect(doctrine.principles).toContain("fail-closed");
    expect(doctrine.required_fields).toContain("compliance_id");
    expect(doctrine.required_fields).toContain("truth_ledger_reference");
    expect(doctrine.allowed_types).toContain("POLICY_COMPLIANCE");
    expect(doctrine.allowed_types).toContain("CERTIFICATION_COMPLIANCE");
    expect(doctrine.allowed_scopes).toContain("COMPONENT_SCOPE");
    expect(doctrine.allowed_scopes).toContain("CERTIFICATION_SCOPE");
  });

  it("builds a complete valid compliance record", () => {
    const record = buildComplianceRecord();
    const validation = validateComplianceRecord(record);
    expect(record.contract_version).toBe("COMPLIANCE-CONTRACT-V1");
    expect(record.evaluation_scope.scope_type).toBe("COMPONENT_SCOPE");
    expect(record.evaluation_status).toBe("PASS");
    expect(record.certification_state).toBe("CERTIFIED");
    expect(validation.validation_state).toBe("VALID");
    expect(validation.errors).toEqual([]);
  });

  it("rejects missing required fields fail-closed", () => {
    expect(validateComplianceRecord(buildComplianceRecord({ compliance_id: "" })).errors.some((error) => error.reason === "COMPLIANCE_ID_MISSING")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ rule_reference: "" })).errors.some((error) => error.reason === "RULE_REFERENCE_MISSING")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ threshold_reference: "" })).errors.some((error) => error.reason === "THRESHOLD_REFERENCE_MISSING")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ supporting_evidence: [] })).validation_state).toBe("UNKNOWN");
    expect(validateComplianceRecord(buildComplianceRecord({ lineage_reference: "" })).errors.some((error) => error.reason === "LINEAGE_REFERENCE_MISSING")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ replay_reference: "" })).errors.some((error) => error.reason === "REPLAY_REFERENCE_MISSING")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ truth_ledger_reference: "" })).errors.some((error) => error.reason === "TRUTH_LEDGER_REFERENCE_MISSING")).toBe(true);
  });

  it("enforces registered compliance categories and evaluation scopes", () => {
    expect(buildComplianceCategoryRegistry()).toContain("RUNTIME_COMPLIANCE");
    expect(validateComplianceRecord(buildComplianceRecord({ compliance_type: "INFORMAL_COMPLIANCE" as never })).errors.some((error) => error.reason === "UNKNOWN_COMPLIANCE_CATEGORY")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ evaluation_scope: { scope_type: "MISSION_SCOPE", tenant_id: "tenant_alpha", mission_id: "mission_compliance_intelligence" } })).validation_state).toBe("VALID");
    expect(validateComplianceRecord(buildComplianceRecord({ evaluation_scope: { scope_type: "UNKNOWN_SCOPE" as never, tenant_id: "tenant_alpha" } })).errors.some((error) => error.reason === "INVALID_EVALUATION_SCOPE")).toBe(true);
  });

  it("validates rule and threshold schemas", () => {
    const rules = buildComplianceRuleRegistry();
    const thresholds = buildComplianceThresholdRegistry();
    expect(rules[0].rule_type).toBe("EVIDENCE_BASED");
    expect(rules[0].required_evidence.length).toBeGreaterThan(0);
    expect(thresholds.map((item) => item.status_output)).toEqual(["PASS", "WARNING", "FAIL", "CRITICAL"]);
    expect(validateComplianceRecord(buildComplianceRecord({ rule_reference: "RULE-UNKNOWN" })).errors.some((error) => error.reason === "INVALID_RULE_REFERENCE")).toBe(true);
    expect(validateComplianceRecord(buildComplianceRecord({ threshold_reference: "THRESHOLD-UNKNOWN" })).errors.some((error) => error.reason === "INVALID_THRESHOLD_REFERENCE")).toBe(true);
  });

  it("keeps scoring deterministic and detects status mismatch", () => {
    expect(calculateComplianceStatus(100)).toBe("PASS");
    expect(calculateComplianceStatus(75)).toBe("WARNING");
    expect(calculateComplianceStatus(25)).toBe("FAIL");
    expect(calculateComplianceStatus(100, true)).toBe("CRITICAL");
    expect(validateComplianceRecord(buildComplianceRecord({ compliance_score: 100, evaluation_status: "FAIL" })).errors.some((error) => error.reason === "SCORE_STATUS_MISMATCH")).toBe(true);
  });

  it("keeps confidence deterministic and detects mismatch", () => {
    const record = buildComplianceRecord();
    const confidence = calculateComplianceConfidence({
      supporting_evidence: record.supporting_evidence,
      rule_reference: record.rule_reference,
      threshold_reference: record.threshold_reference,
      lineage_reference: record.lineage_reference,
      replay_reference: record.replay_reference,
      policy_reference: record.policy_reference,
      constitution_reference: record.constitution_reference,
      authority_reference: record.authority_reference,
    });
    expect(confidence.confidence_score).toBe(record.confidence_score);
    expect(confidence.confidence_calculation_hash).toBe(record.confidence_basis.confidence_calculation_hash);
    expect(validateComplianceRecord(buildComplianceRecord({ confidence_score: 1 })).errors.some((error) => error.reason === "CONFIDENCE_MISMATCH")).toBe(true);
  });

  it("validates corrective actions and rejects missing compliance reference", () => {
    const failed = buildComplianceRecord({ compliance_score: 55, evaluation_status: "FAIL", certification_state: "NOT_CERTIFIED" });
    expect(failed.corrective_actions[0].compliance_id).toBe(failed.compliance_id);
    expect(validateComplianceRecord(failed).errors.some((error) => error.reason === "CORRECTIVE_ACTION_INVALID")).toBe(false);
    expect(validateComplianceRecord(buildComplianceRecord({ corrective_actions: [{ ...failed.corrective_actions[0], compliance_id: "" }] })).errors.some((error) => error.reason === "CORRECTIVE_ACTION_INVALID")).toBe(true);
  });

  it("requires replay, lineage, and truth ledger references", () => {
    const record = buildComplianceRecord();
    expect(record.replay_package.calculation_hash).toBeTruthy();
    expect(record.lineage_reference).toContain("tenant_alpha");
    expect(record.truth_ledger_reference).toContain("tenant_alpha");
    expect(validateComplianceRecord(buildComplianceRecord({ replay_package: undefined as never })).validation_state).toBe("REPLAY_MISMATCH");
  });

  it("enforces tenant isolation and blocks cross-tenant references", () => {
    expect(validateComplianceRecord(buildComplianceRecord({ policy_reference: "policy_tenant_beta_shadow" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateComplianceRecord(buildComplianceRecord({ supporting_evidence: [{ ...buildComplianceRecord().supporting_evidence[0], tenant_id: "tenant_beta" }] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("protects immutable fields and blocks hidden state", () => {
    const original = buildComplianceRecord();
    const mutated = buildComplianceRecord({ ...original, compliance_id: "COMP-MUTATED" });
    expect(validateComplianceRecord(mutated, { original_record: original }).errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION")).toBe(true);
    expect(validateComplianceRecord({ ...original, hidden_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("generates deterministic identity and hash, and replay detects tampering", () => {
    const record = buildComplianceRecord();
    expect(generateComplianceId("tenant_alpha", "mission_compliance_intelligence", "RECOMMENDATION_COMPLIANCE", "RULE-REC-EVIDENCE-V1")).toBe(record.compliance_id);
    expect(computeComplianceHash(record)).toBe(record.compliance_hash);
    expect(replayComplianceRecord(record).replay_state).toBe("REPRODUCED");
    expect(replayComplianceRecord(buildComplianceRecord({ compliance_hash: "tampered" })).replay_state).toBe("MISMATCH");
  });

  it("blocks invalid contract lifecycle transitions", () => {
    expect(transitionComplianceContractLifecycle("DRAFT", "ACTIVE").allowed).toBe(true);
    expect(transitionComplianceContractLifecycle("ACTIVE", "ARCHIVED").allowed).toBe(false);
    expect(transitionComplianceContractLifecycle("SUPERSEDED", "ARCHIVED").allowed).toBe(true);
  });

  it("builds operator visibility for compliance results", () => {
    const surface = buildComplianceObservabilitySurface();
    expect(surface.evaluation_status).toBe("PASS");
    expect(surface.rule_evaluated).toBe("RULE-REC-EVIDENCE-V1");
    expect(surface.threshold_applied).toBe("THRESHOLD-COMPLIANCE-PASS-V1");
    expect(surface.replay_state).toBe("REPRODUCED");
    expect(surface.evidence_summary.supporting_evidence_count).toBe(1);
  });
});
