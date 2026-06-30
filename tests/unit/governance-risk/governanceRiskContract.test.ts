import { describe, expect, it } from "vitest";
import {
  buildGovernanceRiskDoctrine,
  buildGovernanceRiskObservabilitySurface,
  buildGovernanceRiskRecord,
  buildGovernanceRiskSourceRegistry,
  computeGovernanceRiskHash,
  generateGovernanceRiskId,
  replayGovernanceRisk,
  transitionGovernanceRiskState,
  validateGovernanceRiskRecord,
} from "@/services/governance-risk";
import type { GovernanceRiskRecord } from "@/types/governance-risk";

function valid(overrides: Partial<GovernanceRiskRecord> = {}) {
  return buildGovernanceRiskRecord(overrides);
}

describe("Mission Control Phase 7C.1 Governance Risk Contract", () => {
  it("defines advisory-only governance risk doctrine", () => {
    const doctrine = buildGovernanceRiskDoctrine();
    expect(doctrine.principles).toContain("advisory-only");
    expect(doctrine.principles).toContain("fail-closed");
    expect(doctrine.allowed_categories).toContain("GOVERNANCE_DRIFT_RISK");
    expect(doctrine.prohibited_behaviors).toContain("risk enforcement");
  });

  it("registers approved risk sources", () => {
    const registry = buildGovernanceRiskSourceRegistry();
    expect(registry.map((source) => source.risk_source_type)).toContain("REPLAY_MISMATCH");
    expect(registry.every((source) => source.tenant_scoped && source.enabled)).toBe(true);
  });

  it("builds and validates a complete risk record", () => {
    const record = valid();
    const result = validateGovernanceRiskRecord(record);
    expect(record.contract_version).toBe("GOV-RISK-CONTRACT-V1");
    expect(result.validation_state).toBe("VALID");
    expect(result.errors).toEqual([]);
  }, 20000);

  it("generates deterministic tenant-bound identities and hashes", () => {
    expect(generateGovernanceRiskId("tenant_alpha", "mission_query_layer", ["POLICY_CONFLICT"])).toBe(generateGovernanceRiskId("tenant_alpha", "mission_query_layer", ["POLICY_CONFLICT"]));
    expect(computeGovernanceRiskHash(valid())).toBe(valid().risk_hash);
  }, 20000);

  it("rejects missing required fields", () => {
    expect(validateGovernanceRiskRecord(valid({ governance_risk_id: "" })).errors.some((error) => error.reason === "GOVERNANCE_RISK_ID_MISSING")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ mission_id: "" })).errors.some((error) => error.reason === "MISSION_ID_MISSING")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ risk_source_refs: [] })).errors.some((error) => error.reason === "REQUIRED_FIELD_MISSING")).toBe(true);
  }, 30000);

  it("rejects invalid schema, source, category, severity, and severity basis", () => {
    expect(validateGovernanceRiskRecord(valid({ contract_version: "bad" as never })).errors.some((error) => error.reason === "UNSUPPORTED_SCHEMA_VERSION")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ risk_source_refs: ["UNKNOWN" as never] })).validation_state).toBe("UNKNOWN_SOURCE");
    expect(validateGovernanceRiskRecord(valid({ risk_category: "UNKNOWN" as never })).errors.some((error) => error.reason === "INVALID_CATEGORY")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ risk_severity: "SEVERE" as never })).errors.some((error) => error.reason === "INVALID_SEVERITY")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ severity_basis: { ...valid().severity_basis, threshold_result: "LOW" } })).errors.some((error) => error.reason === "SEVERITY_BASIS_MISSING")).toBe(true);
  });

  it("enforces confidence requirements separately from severity", () => {
    expect(validateGovernanceRiskRecord(valid({ confidence_score: undefined as never })).errors.some((error) => error.reason === "CONFIDENCE_SCORE_MISSING")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ confidence_score: 1.2 })).errors.some((error) => error.reason === "CONFIDENCE_OUT_OF_RANGE")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ confidence_basis: { ...valid().confidence_basis, replay_status: undefined as never } })).errors.some((error) => error.reason === "CONFIDENCE_BASIS_MISSING")).toBe(true);
  });

  it("requires evidence, lineage, replay, explanation, and operator review flag", () => {
    expect(validateGovernanceRiskRecord(valid({ evidence_refs: [] })).errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ lineage_refs: [] })).validation_state).toBe("LINEAGE_REFERENCE_MISSING");
    expect(validateGovernanceRiskRecord(valid({ replay_refs: [] })).validation_state).toBe("REPLAY_REFERENCE_MISSING");
    expect(validateGovernanceRiskRecord(valid({ explanation: "" })).errors.some((error) => error.reason === "EXPLANATION_MISSING")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ recommended_operator_review: undefined as never })).errors.some((error) => error.reason === "OPERATOR_REVIEW_FLAG_MISSING")).toBe(true);
  }, 30000);

  it("enforces tenant isolation and identity immutability", () => {
    const record = valid();
    expect(validateGovernanceRiskRecord(valid({ evidence_refs: ["evidence_tenant_beta_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateGovernanceRiskRecord({ ...record, governance_risk_id: "GRISK-MUTATED" }, { original_record: record }).errors.some((error) => error.reason === "IDENTITY_MUTATION")).toBe(true);
    expect(validateGovernanceRiskRecord({ ...record, tenant_id: "tenant_beta" }, { original_record: record }).errors.some((error) => error.reason === "IDENTITY_MUTATION")).toBe(true);
  }, 20000);

  it("validates lifecycle transitions and blocks invalid transitions", () => {
    expect(transitionGovernanceRiskState(valid(), "UNDER_REVIEW").validation_state).toBe("VALID");
    expect(transitionGovernanceRiskState(valid({ risk_state: "ARCHIVED" }), "DETECTED").errors.some((error) => error.reason === "INVALID_STATE_TRANSITION")).toBe(true);
    expect(validateGovernanceRiskRecord(valid({ risk_state: "ACTIVE" as never })).validation_state).toBe("INVALID_STATE");
  });

  it("replays risk records deterministically and detects tampering", () => {
    const record = valid();
    expect(replayGovernanceRisk(record).validation_state).toBe("PASS");
    expect(validateGovernanceRiskRecord({ ...record, risk_hash: "tampered" }).errors.some((error) => error.field_path === "risk_hash")).toBe(true);
  });

  it("builds operator observability surface", () => {
    const surface = buildGovernanceRiskObservabilitySurface(valid());
    expect(surface.risk_severity).toBe("HIGH");
    expect(surface.recommended_operator_review).toBe(true);
    expect(surface.validation_failures).toEqual([]);
  });
});
