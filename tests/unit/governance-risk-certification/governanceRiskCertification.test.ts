import { describe, expect, it } from "vitest";
import {
  buildGovernanceRiskCertificationDoctrine,
  buildGovernanceRiskCertificationRecord,
  buildGovernanceRiskCertificationReport,
  computeGovernanceRiskCertificationHash,
  generateGovernanceRiskCertificationId,
  replayGovernanceRiskCertification,
  runGovernanceRiskCertification,
  validateGovernanceRiskCertificationRecord,
} from "@/services/governance-risk-certification";
import { buildGovernanceRiskScoreRecord, validateGovernanceRiskScoreRecord } from "@/services/governance-risk-scoring";

describe("Mission Control Phase 7C.5 Governance Risk Certification Gate", () => {
  it("defines certification doctrine and required components", () => {
    const doctrine = buildGovernanceRiskCertificationDoctrine();
    expect(doctrine.principles).toContain("deterministic");
    expect(doctrine.principles).toContain("fail-closed");
    expect(doctrine.prohibited_behaviors).toContain("operator override");
    expect(doctrine.required_components).toContain("risk_scoring");
    expect(doctrine.allowed_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
  });

  it("runs a PASS certification across the full 7C stack", () => {
    const certification = runGovernanceRiskCertification();
    expect(certification.certification_state).toBe("PASS");
    expect(certification.validated_components.risk_contract).toBe("PASS");
    expect(certification.validated_components.source_registry).toBe("PASS");
    expect(certification.validated_components.pattern_detection).toBe("PASS");
    expect(certification.validated_components.weakness_analysis).toBe("PASS");
    expect(certification.validated_components.risk_scoring).toBe("PASS");
    expect(certification.validated_components.confidence_scoring).toBe("PASS");
    expect(certification.validated_components.replay).toBe("PASS");
    expect(certification.validated_components.lineage).toBe("PASS");
    expect(certification.validated_components.tenant_isolation).toBe("PASS");
    expect(certification.validated_components.hidden_state).toBe("PASS");
    expect(certification.validated_components.operator_visibility).toBe("PASS");
    expect(certification.recommended_next_action).toBe("PROCEED_TO_NEXT_GOVERNANCE_INTELLIGENCE_PHASE");
  }, 60000);

  it("supports CONDITIONAL_PASS only for non-critical conditions", () => {
    const certification = runGovernanceRiskCertification({ component_overrides: { operator_visibility: "CONDITIONAL_PASS" } });
    expect(certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(certification.recommended_next_action).toBe("LIMITED_PROGRESSION_WITH_REVIEW");
  }, 60000);

  it("fails closed when any critical component fails", () => {
    const certification = runGovernanceRiskCertification({ component_overrides: { replay: "FAIL" } });
    expect(certification.certification_state).toBe("FAIL");
    expect(certification.recommended_next_action).toBe("BLOCK_PHASE_PROGRESSION");
    expect(certification.test_results.failed).toBe(1);
  }, 60000);

  it("validates risk scoring certification probes for hidden state and cross-tenant leakage", () => {
    expect(validateGovernanceRiskScoreRecord({ ...buildGovernanceRiskScoreRecord(), hidden_scoring_state: true } as never).errors.some((error) => error.reason === "HIDDEN_SCORING_STATE")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(buildGovernanceRiskScoreRecord({ evidence_refs: ["evidence_tenant_beta_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  }, 60000);

  it("builds and validates certification records", () => {
    const record = buildGovernanceRiskCertificationRecord();
    const validation = validateGovernanceRiskCertificationRecord(record);
    expect(record.contract_version).toBe("GOV-RISK-CERT-CONTRACT-V1");
    expect(validation.validation_state).toBe("VALID");
    expect(validation.errors).toEqual([]);
  }, 60000);

  it("generates deterministic certification identity and hash", () => {
    const record = buildGovernanceRiskCertificationRecord();
    expect(generateGovernanceRiskCertificationId("tenant_alpha", "mission_query_layer")).toBe(generateGovernanceRiskCertificationId("tenant_alpha", "mission_query_layer"));
    expect(computeGovernanceRiskCertificationHash(record)).toBe(record.certification_hash);
  }, 60000);

  it("rejects missing required fields and invalid state", () => {
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ certification_state: "UNKNOWN" as never })).errors.some((error) => error.reason === "INVALID_CERTIFICATION_STATE")).toBe(true);
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ validated_components: undefined as never })).errors.some((error) => error.reason === "COMPONENT_VALIDATION_MISSING")).toBe(true);
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ test_results: undefined as never })).errors.some((error) => error.reason === "TEST_RESULTS_MISSING")).toBe(true);
  }, 60000);

  it("rejects missing evidence, lineage, replay, model, explanation, and action", () => {
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ evidence_refs: [] })).errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING")).toBe(true);
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ lineage_refs: [] })).validation_state).toBe("LINEAGE_REFERENCE_MISSING");
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ replay_refs: [] })).validation_state).toBe("REPLAY_REFERENCE_MISSING");
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ certification_model_version: "" as never })).errors.some((error) => error.reason === "CERTIFICATION_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ explanation: "" })).errors.some((error) => error.reason === "EXPLANATION_MISSING")).toBe(true);
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ recommended_next_action: "" as never })).errors.some((error) => error.reason === "RECOMMENDED_ACTION_MISSING")).toBe(true);
  }, 60000);

  it("enforces tenant isolation and replay package completeness", () => {
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ evidence_refs: ["evidence_tenant_beta_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateGovernanceRiskCertificationRecord(buildGovernanceRiskCertificationRecord({ certification_replay_package: undefined as never })).validation_state).toBe("REPLAY_REFERENCE_MISSING");
  }, 60000);

  it("replays certification records and detects tampering", () => {
    const record = buildGovernanceRiskCertificationRecord();
    expect(replayGovernanceRiskCertification(record).validation_state).toBe("PASS");
    expect(replayGovernanceRiskCertification(buildGovernanceRiskCertificationRecord({ certification_hash: "tampered" })).validation_state).toBe("FAIL");
  }, 60000);

  it("builds final certification report format", () => {
    const report = buildGovernanceRiskCertificationReport();
    expect(report.phase).toBe("7C");
    expect(report.certification_gate).toBe("7C.5");
    expect(report.certification_state).toBe("PASS");
    expect(report.summary.risk_contract_valid).toBe(true);
    expect(report.summary.operator_visibility_complete).toBe(true);
    expect(report.artifacts_validated).toContain("Governance Risk Scoring Engine");
  }, 60000);
});
