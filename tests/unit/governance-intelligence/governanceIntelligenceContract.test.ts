import { describe, expect, it } from "vitest";
import {
  assertGovernanceIntelligenceActionBlocked,
  buildGovernanceIntelligenceDoctrine,
  buildGovernanceIntelligenceRecord,
  computeGovernanceIntelligenceHash,
  validateGovernanceIntelligenceRecord,
} from "@/services/governance-intelligence";
import type { GovernanceIntelligenceRecord } from "@/types/governance-intelligence";

function valid(overrides: Partial<GovernanceIntelligenceRecord> = {}) {
  return buildGovernanceIntelligenceRecord(overrides);
}

function invalid(overrides: Partial<GovernanceIntelligenceRecord>) {
  return validateGovernanceIntelligenceRecord({ ...valid(), ...overrides });
}

describe("Mission Control Phase 7A.1 Governance Intelligence Contract", () => {
  it("defines the contract doctrine", () => {
    const doctrine = buildGovernanceIntelligenceDoctrine();
    expect(doctrine.principles).toContain("advisory-only");
    expect(doctrine.principles).toContain("evidence-bound");
    expect(doctrine.prohibited_behaviors).toContain("execute actions");
  });

  it("builds a valid governance intelligence record", () => {
    const record = valid();
    expect(record.governance_intelligence_id).toBe("gov_intel_7a1_000001");
    expect(record.metadata.schema_version).toBe("governance-intelligence-contract/v7A.1");
    expect(record.metadata.contract_hash).toBeTruthy();
  });

  it("validates a complete contract", () => {
    const result = validateGovernanceIntelligenceRecord(valid());
    expect(result.state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.advisoryOnly).toBe(true);
    expect(result.executionAllowed).toBe(false);
  });

  it("requires governance_intelligence_id", () => {
    expect(invalid({ governance_intelligence_id: "" }).failures.some((failure) => failure.field_path === "governance_intelligence_id")).toBe(true);
  });

  it("requires tenant_id", () => {
    expect(invalid({ tenant_id: "" }).failures.some((failure) => failure.field_path === "tenant_id")).toBe(true);
  });

  it("requires mission_id", () => {
    expect(invalid({ mission_id: "" }).failures.some((failure) => failure.field_path === "mission_id")).toBe(true);
  });

  it("requires policy_scope", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), policy_scope: undefined }).state).toBe("FAIL");
  });

  it("requires governance_scope", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), governance_scope: undefined }).state).toBe("FAIL");
  });

  it("requires evidence_requirements", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), evidence_requirements: undefined }).state).toBe("FAIL");
  });

  it("requires confidence_requirements", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), confidence_requirements: undefined }).state).toBe("FAIL");
  });

  it("requires lineage_requirements", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), lineage_requirements: undefined }).state).toBe("FAIL");
  });

  it("requires replay_requirements", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), replay_requirements: undefined }).state).toBe("FAIL");
  });

  it("requires recommendation_requirements", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), recommendation_requirements: undefined }).state).toBe("FAIL");
  });

  it("rejects invalid intelligence_state", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), intelligence_state: "INVALID" as never }).failures.some((failure) => failure.field_path === "intelligence_state")).toBe(true);
  });

  it("rejects invalid certification_status", () => {
    expect(validateGovernanceIntelligenceRecord({ ...valid(), certification_status: "MAYBE" as never }).failures.some((failure) => failure.field_path === "certification_status")).toBe(true);
  });

  it("preserves tenant isolation", () => {
    expect(validateGovernanceIntelligenceRecord(valid()).state).toBe("PASS");
  });

  it("detects cross-tenant policy references", () => {
    const record = valid({ policy_scope: { ...valid().policy_scope, policy_refs: ["tenant_beta_policy"] } });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.reason.includes("cross-tenant"))).toBe(true);
  });

  it("preserves advisory-only boundary", () => {
    expect(valid().governance_scope.authority_mode).toBe("advisory_only");
  });

  it("detects execution authority", () => {
    const record = valid({ governance_scope: { ...valid().governance_scope, execution_authority: "allowed" as never } });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.reason === "execution authority detected")).toBe(true);
  });

  it("requires operator supremacy", () => {
    const record = valid({ governance_scope: { ...valid().governance_scope, operator_supremacy: "missing" as never } });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.field_path === "governance_scope.operator_supremacy")).toBe(true);
  });

  it("requires evidence refs when evidence is required", () => {
    const record = valid({ evidence_refs: [] });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.field_path === "evidence_refs")).toBe(true);
  });

  it("rejects unsupported claims", () => {
    const record = valid({ evidence_requirements: { ...valid().evidence_requirements, unsupported_claims_allowed: true } });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.reason === "unsupported claims allowed")).toBe(true);
  });

  it("requires confidence score", () => {
    const record = { ...valid(), confidence_score: undefined } as Partial<GovernanceIntelligenceRecord>;
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.field_path === "confidence_score")).toBe(true);
  });

  it("rejects low confidence", () => {
    expect(invalid({ confidence_score: 0.2 }).failures.some((failure) => failure.reason === "confidence below threshold")).toBe(true);
  });

  it("requires lineage refs", () => {
    expect(invalid({ lineage_refs: [] }).failures.some((failure) => failure.field_path === "lineage_refs")).toBe(true);
  });

  it("detects lineage breaks", () => {
    expect(invalid({ lineage_refs: ["broken_lineage"] }).failures.some((failure) => failure.reason === "lineage break detected")).toBe(true);
  });

  it("requires replay refs", () => {
    expect(invalid({ replay_refs: [] }).failures.some((failure) => failure.field_path === "replay_refs")).toBe(true);
  });

  it("detects replay mismatch", () => {
    expect(invalid({ replay_refs: ["replay_mismatch"] }).failures.some((failure) => failure.reason === "replay mismatch")).toBe(true);
  });

  it("requires recommendation evidence", () => {
    expect(invalid({ evidence_refs: [] }).failures.some((failure) => failure.reason === "recommendation without evidence")).toBe(true);
  });

  it("requires recommendation policy support", () => {
    expect(invalid({ policy_refs: [] }).failures.some((failure) => failure.reason === "recommendation without policy scope")).toBe(true);
  });

  it("requires escalation on policy conflict", () => {
    const record = valid({ policy_refs: ["policy_conflict"], escalation_refs: [] });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.reason === "policy conflict without escalation")).toBe(true);
  });

  it("produces reproducible contract hashes", () => {
    expect(computeGovernanceIntelligenceHash(valid())).toBe(computeGovernanceIntelligenceHash(valid()));
  });

  it("changes hash when contract input changes", () => {
    expect(computeGovernanceIntelligenceHash(valid())).not.toBe(computeGovernanceIntelligenceHash(valid({ mission_id: "mission_other" })));
  });

  it("detects contract hash mismatch", () => {
    const record = valid({ metadata: { ...valid().metadata, contract_hash: "bad_hash" } });
    expect(validateGovernanceIntelligenceRecord(record).failures.some((failure) => failure.reason === "contract hash mismatch")).toBe(true);
  });

  it.each([
    "EXECUTE_ACTION",
    "OVERRIDE_OPERATOR",
    "BYPASS_GOVERNANCE",
    "MUTATE_IDENTITY",
    "DROP_EVIDENCE",
    "DROP_LINEAGE",
    "SELF_CERTIFY",
  ] as const)("blocks prohibited governance intelligence action %s", (action) => {
    expect(() => assertGovernanceIntelligenceActionBlocked(action)).toThrow("advisory-only");
  });
});
