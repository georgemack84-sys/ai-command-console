import { describe, expect, it } from "vitest";
import {
  buildGovernanceLineageDoctrine,
  buildGovernanceLineageObservabilitySurface,
  computeGovernanceLineageHash,
  explainGovernanceConclusion,
  getGovernanceLineage,
  getGovernanceLineageContract,
  registerGovernanceLineage,
  resolveInfluenceChain,
  transitionGovernanceLineageState,
  validateGovernanceLineage,
  verifyGovernanceReplay,
} from "@/services/governance-lineage";

describe("Mission Control Phase 7G.1 Governance Lineage Contract", () => {
  it("defines governance lineage doctrine, supported types, relationships, states, and a valid baseline contract", () => {
    const doctrine = buildGovernanceLineageDoctrine();
    const contract = getGovernanceLineageContract();
    expect(doctrine.contract_version).toBe("GOVERNANCE-LINEAGE-CONTRACT-V1");
    expect(doctrine.supported_lineage_types).toEqual(["POLICY", "CONSTITUTION", "AUTHORITY", "EVIDENCE", "RISK", "COMPLIANCE", "RECOMMENDATION", "ESCALATION", "DECISION", "GOVERNANCE"]);
    expect(doctrine.supported_relationships).toContain("SUPPORTED_BY");
    expect(doctrine.supported_states).toEqual(["CREATED", "VALIDATED", "CERTIFIED", "SUPERSEDED", "ARCHIVED"]);
    expect(validateGovernanceLineage(contract.baseline_lineage).validation_state).toBe("VALID");
    expect(verifyGovernanceReplay(contract.baseline_lineage).replay_state).toBe("REPRODUCED");
  });

  it("registers deterministic immutable lineage identity and hashes for identical inputs", () => {
    const a = registerGovernanceLineage();
    const b = registerGovernanceLineage();
    expect(a.governance_lineage_id).toBe(b.governance_lineage_id);
    expect(a.root_lineage_id).toBe(b.root_lineage_id);
    expect(a.created_timestamp).toBe(b.created_timestamp);
    expect(a.lineage_hash).toBe(b.lineage_hash);
    expect(computeGovernanceLineageHash(a)).toBe(a.lineage_hash);
  });

  it("supports all canonical lineage types and object mappings", () => {
    expect(registerGovernanceLineage({ scenario: "POLICY" }).governance_object.object_type).toBe("PolicyEvaluation");
    expect(registerGovernanceLineage({ scenario: "CONSTITUTION" }).lineage_type).toBe("CONSTITUTION");
    expect(registerGovernanceLineage({ scenario: "AUTHORITY" }).lineage_type).toBe("AUTHORITY");
    expect(registerGovernanceLineage({ scenario: "EVIDENCE" }).lineage_type).toBe("EVIDENCE");
    expect(registerGovernanceLineage({ scenario: "RISK" }).governance_object.object_type).toBe("RiskAssessment");
    expect(registerGovernanceLineage({ scenario: "COMPLIANCE" }).governance_object.object_type).toBe("ComplianceFinding");
    expect(registerGovernanceLineage({ scenario: "RECOMMENDATION" }).governance_object.object_type).toBe("Recommendation");
    expect(registerGovernanceLineage({ scenario: "ESCALATION" }).governance_object.object_type).toBe("EscalationDecision");
    expect(registerGovernanceLineage({ scenario: "DECISION" }).governance_object.object_type).toBe("GovernanceDecision");
  });

  it("standardizes governance references across policy, constitution, authority, evidence, risk, compliance, recommendations, and escalations", () => {
    const record = registerGovernanceLineage();
    expect(record.references.policy_ids.length).toBeGreaterThan(0);
    expect(record.references.constitutional_rule_ids.length).toBeGreaterThan(0);
    expect(record.references.authority_ids.length).toBeGreaterThan(0);
    expect(record.references.evidence_ids.length).toBeGreaterThan(0);
    expect(record.references.risk_ids.length).toBeGreaterThan(0);
    expect(record.references.compliance_ids.length).toBeGreaterThan(0);
    expect(record.references.recommendation_ids.length).toBeGreaterThan(0);
    expect(record.references.escalation_ids.length).toBeGreaterThan(0);
  });

  it("captures deterministic influence chains with relationship, weight, confidence, and reason", () => {
    const record = registerGovernanceLineage();
    expect(record.influence_chain.length).toBeGreaterThan(0);
    expect(record.influence_chain.map((item) => item.relationship)).toEqual(expect.arrayContaining(["SUPPORTED_BY", "REQUIRED_BY", "VALIDATED_BY"]));
    expect(record.influence_chain.every((item) => item.weight > 0 && item.confidence > 0 && item.reason)).toBe(true);
    expect(record.confidence.confidence_method).toBe("EVIDENCE_WEIGHTED_LINEAGE_V1");
    expect(record.confidence.supporting_lineage_refs).toContain(record.governance_lineage_id);
  });

  it("enforces state machine transitions and prohibits reverse transitions", () => {
    expect(transitionGovernanceLineageState("CREATED", "VALIDATED").allowed).toBe(true);
    expect(transitionGovernanceLineageState("VALIDATED", "CERTIFIED").allowed).toBe(true);
    expect(transitionGovernanceLineageState("CERTIFIED", "SUPERSEDED").allowed).toBe(true);
    expect(transitionGovernanceLineageState("SUPERSEDED", "ARCHIVED").allowed).toBe(true);
    expect(transitionGovernanceLineageState("CERTIFIED", "VALIDATED").allowed).toBe(false);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "INVALID_TRANSITION" })).errors.some((error) => error.reason === "INVALID_STATE_TRANSITION")).toBe(true);
  });

  it("fails closed on missing identity, unsupported type, missing object, missing policy/evidence, and missing replay metadata", () => {
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_ID" })).errors.some((error) => error.error_code === "GLC-001")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_TENANT" })).errors.some((error) => error.error_code === "GLC-003")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_MISSION" })).errors.some((error) => error.error_code === "GLC-004")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "INVALID_TYPE" })).errors.some((error) => error.error_code === "GLC-005")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_OBJECT" })).errors.some((error) => error.error_code === "GLC-006")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_POLICY" })).errors.some((error) => error.error_code === "GLC-007")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_EVIDENCE" })).errors.some((error) => error.error_code === "GLC-008")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "MISSING_REPLAY" })).errors.some((error) => error.error_code === "GLC-009")).toBe(true);
  });

  it("detects hidden influence, duplicate identifiers, cross-tenant references, immutable mutation, and hash mismatches", () => {
    const duplicate = registerGovernanceLineage({ scenario: "DUPLICATE_IDENTIFIER" });
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "HIDDEN_INFLUENCE" })).validation_state).toBe("CERTIFICATION_BLOCKED");
    expect(validateGovernanceLineage(duplicate).errors.some((error) => error.error_code === "GLC-002")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "CROSS_TENANT" })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "IMMUTABLE_MUTATION" })).errors.some((error) => error.error_code === "GLC-013")).toBe(true);
    expect(validateGovernanceLineage(registerGovernanceLineage({ scenario: "HASH_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
  });

  it("verifies replay and detects deterministic reconstruction mismatches", () => {
    const record = registerGovernanceLineage();
    expect(verifyGovernanceReplay(record).replay_state).toBe("REPRODUCED");
    expect(verifyGovernanceReplay({ ...record, lineage_hash: "tampered" }).replay_state).toBe("MISMATCH");
    expect(verifyGovernanceReplay(registerGovernanceLineage({ scenario: "MISSING_REPLAY" })).replay_state).toBe("INCOMPLETE");
  });

  it("retrieves lineage, resolves influence chains, and explains governance conclusions", () => {
    const record = registerGovernanceLineage();
    const retrieved = getGovernanceLineage(record);
    const resolution = resolveInfluenceChain(record);
    const explanation = explainGovernanceConclusion(record);
    expect(retrieved.governance_lineage_id).toBe(record.governance_lineage_id);
    expect(resolution.upstream_influences).toEqual(record.influence_chain);
    expect(resolution.downstream_lineage_ids).toEqual(record.child_lineage_ids);
    expect(resolution.influence_hash).toBeTruthy();
    expect(explanation.why_it_exists).toContain("SUPPORTED_BY");
    expect(explanation.policy_basis.length).toBeGreaterThan(0);
    expect(explanation.evidence_basis.length).toBeGreaterThan(0);
    expect(explanation.operator_visible).toBe(true);
  });

  it("preserves advisory-only boundaries and exposes operator observability", () => {
    const record = registerGovernanceLineage();
    const surface = buildGovernanceLineageObservabilitySurface(record);
    expect(record.advisory_boundary.advisory_only).toBe(true);
    expect(record.advisory_boundary.execution_authority).toBe(false);
    expect(record.advisory_boundary.mutation_authority).toBe(false);
    expect(surface.governance_lineage_id).toBe(record.governance_lineage_id);
    expect(surface.influence_count).toBe(record.influence_chain.length);
    expect(surface.replay_state).toBe("REPRODUCED");
    expect(surface.advisory_only_notice).toContain("advisory-only");
    expect(surface.validation_failures).toEqual([]);
  });
});
