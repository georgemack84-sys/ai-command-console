import { describe, expect, it } from "vitest";
import {
  DECISION_AUDIT_STATES,
  generateDecisionAudit,
  getDecisionAuditEngineFoundation,
} from "@/services/decision-audit-engine";

describe("Mission Control Phase 9.10.6 Decision Audit Engine", () => {
  it("publishes the audit engine foundation", () => {
    const foundation = getDecisionAuditEngineFoundation();

    expect(foundation.audit_engine_version).toBe("decision-audit-engine/v1");
    expect(foundation.audit_states).toEqual(DECISION_AUDIT_STATES);
    expect(foundation.result.validation.certification_ready).toBe(true);
  });

  it("generates every required audit section", () => {
    const result = generateDecisionAudit();

    expect(result.audit_package.orchestration_summary.summary).toContain("Orchestration");
    expect(result.audit_package.considered_decisions.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.rejected_decisions.summary).toContain("Rejected");
    expect(result.audit_package.evidence_summary.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.governance_validation.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.constitutional_validation.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.priority_explanation.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.conflict_resolution.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.operator_actions.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.final_outcome.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.replay_verification.evidence_refs.length).toBeGreaterThan(0);
    expect(result.audit_package.integrity_verification.evidence_refs.length).toBeGreaterThan(0);
  });

  it("generates compliance summary and certification evidence package", () => {
    const result = generateDecisionAudit();

    expect(result.compliance_summary.overall_compliance).toBe("COMPLIANT");
    expect(result.certification_evidence.certification_ready).toBe(true);
    expect(result.certification_evidence.replay_refs.length).toBeGreaterThan(0);
    expect(result.certification_evidence.governance_refs.length).toBeGreaterThan(0);
    expect(result.certification_evidence.constitutional_refs.length).toBeGreaterThan(0);
    expect(result.certification_evidence.operator_refs.length).toBeGreaterThan(0);
    expect(result.certification_evidence.integrity_refs.length).toBeGreaterThan(0);
  });

  it("is deterministic, immutable, append-only, and non-mutating", () => {
    const first = generateDecisionAudit();
    const second = generateDecisionAudit();

    expect(second).toEqual(first);
    expect(Object.isFrozen(first.audit_package)).toBe(true);
    expect(first.ledger[0]?.append_only).toBe(true);
    expect(first.ledger[0]?.deleted).toBe(false);
    expect(first.advisory_only).toBe(true);
    expect(first.mutates_orchestration_outcomes).toBe(false);
  });

  it.each([
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_DOCUMENTATION_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_DOCUMENTATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_VERIFICATION_MISSING"],
    ["MISSING_INTEGRITY", "INTEGRITY_VERIFICATION_MISSING"],
    ["MISSING_CERTIFICATION_EVIDENCE", "CERTIFICATION_EVIDENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_MISMATCH"],
    ["CROSS_TENANT", "TENANT_MISMATCH"],
    ["UNSUPPORTED_SCHEMA", "UNSUPPORTED_SCHEMA"],
    ["REPORT_FAILURE", "AUDIT_REPORT_INCOMPLETE"],
    ["AUDIT_VALIDATION_FAILURE", "AUDIT_VALIDATION_FAILURE"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const result = generateDecisionAudit({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.certification_ready).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_ready).toBe(false);
  });

  it("preserves replay, governance, constitutional, operator, integrity, and lineage traceability", () => {
    const result = generateDecisionAudit();

    expect(result.audit_record.lineage_refs.length).toBeGreaterThan(0);
    expect(result.audit_record.replay_summary_ref).toBe(result.audit_package.replay_verification.section_id);
    expect(result.audit_record.governance_summary_ref).toBe(result.audit_package.governance_validation.section_id);
    expect(result.audit_record.constitutional_summary_ref).toBe(result.audit_package.constitutional_validation.section_id);
    expect(result.audit_record.operator_summary_ref).toBe(result.audit_package.operator_actions.section_id);
    expect(result.audit_record.integrity_summary_ref).toBe(result.audit_package.integrity_verification.section_id);
  });
});
