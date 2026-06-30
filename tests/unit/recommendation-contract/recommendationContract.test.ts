import { describe, expect, it } from "vitest";
import {
  buildRecommendationContractDoctrine,
  buildRecommendationContractRecord,
  buildRecommendationObservabilitySurface,
  certifyRecommendationContract,
  computeRecommendationHash,
  getRecommendationContract,
  replayRecommendationContract,
  transitionRecommendationLifecycle,
  validateRecommendationContractRecord,
} from "@/services/recommendation-contract";

describe("Mission Control Phase 7E.1 Recommendation Contract", () => {
  it("defines the recommendation doctrine, type registry, scope registry, lifecycle states, and baseline contract", () => {
    const doctrine = buildRecommendationContractDoctrine();
    const contract = getRecommendationContract();
    expect(doctrine.contract_version).toBe("RECOMMENDATION-CONTRACT-V1");
    expect(doctrine.recommendation_types).toContain("COMPLIANCE_IMPROVEMENT");
    expect(doctrine.scope_types).toContain("CERTIFICATION_LEVEL");
    expect(doctrine.prohibited_actions).toContain("mutate Truth Ledger records");
    expect(contract.record.recommendation_id).toBeTruthy();
    expect(contract.certification.certification_state).toBe("PASS");
  });

  it("builds a valid typed, scoped, evidence-backed, risk-aware, confidence-justified advisory recommendation contract", () => {
    const record = buildRecommendationContractRecord();
    const validation = validateRecommendationContractRecord(record);
    expect(record.recommendation_type).toBe("COMPLIANCE_IMPROVEMENT");
    expect(record.recommendation_scope.scope_type).toBe("COMPLIANCE_LEVEL");
    expect(record.evidence_refs.length).toBeGreaterThanOrEqual(record.evidence_requirements.minimum_evidence_count);
    expect(record.risk_requirements.required_risk_assessment).toBe(true);
    expect(record.confidence_requirements.confidence_band).toBe("HIGH_CONFIDENCE");
    expect(validation.validation_state).toBe("VALID");
  });

  it("fails closed when the recommendation contract is missing", () => {
    const validation = validateRecommendationContractRecord(undefined);
    expect(validation.validation_state).toBe("INVALID");
    expect(validation.errors.some((error) => error.reason === "CONTRACT_MISSING")).toBe(true);
  });

  it("rejects unsupported recommendation types and missing identity fields", () => {
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ recommendation_type: "BAD_TYPE" as never })).errors.some((error) => error.reason === "UNSUPPORTED_RECOMMENDATION_TYPE")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ recommendation_id: "" })).errors.some((error) => error.reason === "RECOMMENDATION_ID_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ governance_intelligence_id: "" })).errors.some((error) => error.reason === "GOVERNANCE_INTELLIGENCE_ID_MISSING")).toBe(true);
  });

  it("requires explicit bounded recommendation scope", () => {
    const record = buildRecommendationContractRecord();
    expect(validateRecommendationContractRecord(record).checks.scope_valid).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ recommendation_scope: undefined as never })).errors.some((error) => error.reason === "RECOMMENDATION_SCOPE_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ recommendation_scope: { ...record.recommendation_scope, affected_tenant: "tenant_beta" } })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("requires evidence requirements, evidence references, and evidence lineage", () => {
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord()).checks.evidence_supported).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ evidence_requirements: undefined as never })).errors.some((error) => error.reason === "EVIDENCE_REQUIREMENTS_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ evidence_refs: [] })).errors.some((error) => error.reason === "EVIDENCE_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ evidence_lineage_hash: "" })).errors.some((error) => error.reason === "EVIDENCE_LINEAGE_MISSING")).toBe(true);
  });

  it("requires risk requirements, risk references, severity, residual risk, escalation state, and rationale", () => {
    const record = buildRecommendationContractRecord({ risk_score: 92 });
    expect(record.severity_level).toBe("CRITICAL");
    expect(record.risk_requirements.escalation_required).toBe(true);
    expect(validateRecommendationContractRecord(record).checks.risk_assessed).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ risk_requirements: undefined as never })).errors.some((error) => error.reason === "RISK_REQUIREMENTS_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ risk_requirements: { ...record.risk_requirements, risk_rationale: "" } })).errors.some((error) => error.reason === "RISK_RATIONALE_MISSING")).toBe(true);
  });

  it("requires confidence score, confidence band, rationale, inputs, and replay hash", () => {
    const record = buildRecommendationContractRecord();
    expect(record.confidence_score).toBe(record.confidence_requirements.confidence_score);
    expect(record.confidence_requirements.confidence_replay_hash).toBeTruthy();
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ confidence_requirements: undefined as never })).errors.some((error) => error.reason === "CONFIDENCE_REQUIREMENTS_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ confidence_requirements: { ...record.confidence_requirements, confidence_score: 99 } })).errors.some((error) => error.reason === "CONFIDENCE_UNSUPPORTED")).toBe(true);
  });

  it("requires governance constraints, constitutional constraints, and authority limits", () => {
    const record = buildRecommendationContractRecord();
    expect(record.governance_constraints.applicable_policies.length).toBeGreaterThan(0);
    expect(record.constitutional_constraints).toContain("constitution_operator_supremacy_v1");
    expect(record.governance_constraints.authority_limits).toContain("no_execution_authority");
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ governance_constraints: undefined as never })).errors.some((error) => error.reason === "GOVERNANCE_CONSTRAINTS_MISSING")).toBe(true);
  });

  it("enforces advisory-only authority and rejects execution or mutation authority", () => {
    const record = buildRecommendationContractRecord();
    expect(record.advisory_boundary.execution_authority).toBe(false);
    expect(record.advisory_boundary.mutation_authority).toBe(false);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ advisory_only: false as true })).errors.some((error) => error.reason === "ADVISORY_ONLY_BOUNDARY_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ advisory_boundary: { ...record.advisory_boundary, execution_authority: true as false } })).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ advisory_boundary: { ...record.advisory_boundary, mutation_authority: true as false } })).errors.some((error) => error.reason === "MUTATION_AUTHORITY_DETECTED")).toBe(true);
  });

  it("requires alternative path definitions for preferred, conservative, escalation, and remediation paths when risk is high", () => {
    const record = buildRecommendationContractRecord({ risk_score: 91 });
    expect(record.alternative_path_required.alternatives_required).toBe(true);
    expect(record.alternative_path_required.required_path_types).toEqual(["PREFERRED_PATH", "CONSERVATIVE_PATH", "ESCALATION_PATH", "REMEDIATION_PATH"]);
  });

  it("requires replay references and detects replay/hash mismatches", () => {
    const record = buildRecommendationContractRecord();
    expect(replayRecommendationContract(record).replay_state).toBe("REPRODUCED");
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ replay_requirements: undefined as never })).validation_state).toBe("REPLAY_MISMATCH");
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ recommendation_hash: "tampered" })).validation_state).toBe("REPLAY_MISMATCH");
    expect(replayRecommendationContract(buildRecommendationContractRecord({ recommendation_hash: "tampered" })).replay_state).toBe("MISMATCH");
  });

  it("requires tenant isolation and blocks cross-tenant evidence, policy, risk, replay, and lineage references", () => {
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord()).checks.tenant_isolated).toBe(true);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ evidence_refs: ["evidence_tenant_beta_policy_001", "evidence_tenant_alpha_risk_001", "evidence_tenant_alpha_truth_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ target_policy_refs: ["policy_tenant_beta_recommendation_governance_v1"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("requires Truth Ledger linkage and append-only identity semantics", () => {
    const original = buildRecommendationContractRecord();
    expect(original.truth_ledger_refs.length).toBeGreaterThan(0);
    expect(validateRecommendationContractRecord(buildRecommendationContractRecord({ truth_ledger_refs: [] })).errors.some((error) => error.reason === "TRUTH_LEDGER_LINKAGE_MISSING")).toBe(true);
    expect(validateRecommendationContractRecord({ ...original, created_timestamp: "2026-06-27T00:00:00.000Z" }, { original_record: original }).errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION")).toBe(true);
  });

  it("prohibits hidden or nondeterministic recommendation state", () => {
    const record = buildRecommendationContractRecord();
    expect(validateRecommendationContractRecord({ ...record, hidden_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateRecommendationContractRecord({ ...record, random_seed: "not allowed" } as never).errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED")).toBe(true);
  });

  it("exposes operator visibility over summary, evidence, risk, confidence, constraints, alternatives, validation, replay, and advisory notice", () => {
    const surface = buildRecommendationObservabilitySurface();
    expect(surface.recommendation_summary).toContain("Advisory recommendation");
    expect(surface.evidence_basis.length).toBeGreaterThan(0);
    expect(surface.risk_basis.length).toBeGreaterThan(0);
    expect(surface.confidence_basis.score).toBeGreaterThanOrEqual(85);
    expect(surface.validation_result).toBe("VALID");
    expect(surface.replay_status).toBe("REPRODUCED");
    expect(surface.advisory_only_notice).toContain("may not execute action");
  });

  it("supports deterministic lifecycle transitions and blocks invalid progression", () => {
    expect(transitionRecommendationLifecycle("DRAFT", "EVIDENCE_BOUND").allowed).toBe(true);
    expect(transitionRecommendationLifecycle("EVIDENCE_BOUND", "RISK_BOUND").allowed).toBe(true);
    expect(transitionRecommendationLifecycle("GOVERNANCE_CONSTRAINED", "VALIDATED").allowed).toBe(true);
    expect(transitionRecommendationLifecycle("DRAFT", "VALIDATED").allowed).toBe(false);
    expect(transitionRecommendationLifecycle("ARCHIVED", "DRAFT").allowed).toBe(false);
  });

  it("certifies 7E.1 as PASS, CONDITIONAL_PASS, or FAIL according to contract state", () => {
    const pass = certifyRecommendationContract(buildRecommendationContractRecord());
    const conditional = certifyRecommendationContract(buildRecommendationContractRecord({ lifecycle_state: "GOVERNANCE_CONSTRAINED" }));
    const fail = certifyRecommendationContract(buildRecommendationContractRecord({ advisory_boundary: { ...buildRecommendationContractRecord().advisory_boundary, execution_authority: true as false } }));
    expect(pass.certification_state).toBe("PASS");
    expect(conditional.certification_state).toBe("CONDITIONAL_PASS");
    expect(fail.certification_state).toBe("FAIL");
    expect(fail.failed_tests).toContain("EXECUTION_AUTHORITY_DETECTED");
  });

  it("computes stable recommendation hashes", () => {
    const record = buildRecommendationContractRecord();
    expect(computeRecommendationHash(record)).toBe(record.recommendation_hash);
    expect(buildRecommendationContractRecord().recommendation_hash).toBe(record.recommendation_hash);
  });
});
