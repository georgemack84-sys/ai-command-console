import { describe, expect, it } from "vitest";
import {
  computeFinalCertificationHash,
  FINAL_CERTIFICATION_CHECKS,
  FINAL_CERTIFICATION_SCOPES,
  getFinalOrchestratorCertificationFoundation,
  replayFinalOrchestratorCertification,
  runFinalOrchestratorCertification,
} from "@/services/decision-final-orchestrator-certification";
import type { FinalCertificationFailure, FinalOrchestratorCertificationInput } from "@/types/decision-final-orchestrator-certification";

describe("Mission Control Phase 9.12.12 Final Decision Orchestrator Certification", () => {
  it("publishes the final orchestrator certification foundation", () => {
    const foundation = getFinalOrchestratorCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-final-orchestrator-certification/v1");
    expect(foundation.scopes).toEqual(FINAL_CERTIFICATION_SCOPES);
    expect(foundation.checks).toEqual(FINAL_CERTIFICATION_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates integrated certification coverage across all Phase 9 scopes", () => {
    const result = runFinalOrchestratorCertification();

    expect(computeFinalCertificationHash(result.integrated_validation_report)).toBe(result.integrated_validation_report.integrity_hash);
    expect(result.integrated_validation_report.validation_state).toBe("PASS");
    expect(result.integrated_validation_report.complete_suite_executed).toBe(true);
    expect(result.integrated_validation_report.production_readiness_approved).toBe(true);
  });

  it("validates end-to-end replay and lineage", () => {
    const result = runFinalOrchestratorCertification();

    expect(result.final_replay_report.validation_state).toBe("PASS");
    expect(result.final_replay_report.end_to_end_replay_verified).toBe(true);
    expect(result.final_replay_report.complete_reconstruction_verified).toBe(true);
    expect(result.final_replay_report.replay_lineage_complete).toBe(true);
  });

  it("validates governance, constitutional, authority, operator, ledger, observability, and security outcomes", () => {
    const result = runFinalOrchestratorCertification();

    expect(result.decision_matrix.governance_constitutional).toBe("PASS");
    expect(result.decision_matrix.operator_workflow).toBe("PASS");
    expect(result.decision_matrix.ledger_integrity).toBe("PASS");
    expect(result.decision_matrix.observability_dashboard).toBe("PASS");
    expect(result.decision_matrix.security_isolation_boundary).toBe("PASS");
  });

  it("collects immutable final evidence and ledger entries", () => {
    const result = runFinalOrchestratorCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.final_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.final_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves production and marks Phase 9 complete on pass", () => {
    const result = runFinalOrchestratorCertification();

    expect(result.decision_matrix.outcome).toBe("PASS");
    expect(result.final_report.final_certification_decision).toBe("PASS");
    expect(result.final_report.production_approval_recommendation).toBe("APPROVE_PRODUCTION");
    expect(result.production_approval_decision.production_approval_status).toBe("APPROVED");
    expect(result.phase_9_completion_report.next_phase_readiness).toBe("READY");
    expect(result.production_approved).toBe(true);
    expect(result.phase_9_complete).toBe(true);
  });

  it("remains replayable, advisory-only, and non-mutating", () => {
    const result = runFinalOrchestratorCertification();

    expect(replayFinalOrchestratorCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_state).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("records conditional pass while blocking production for documentation-only deficiencies", () => {
    const result = runFinalOrchestratorCertification({ scenario: "DOCUMENTATION_DEFICIENCY" });

    expect(result.final_report.final_certification_decision).toBe("CONDITIONAL_PASS");
    expect(result.production_approval_decision.production_approval_status).toBe("BLOCKED");
    expect(result.production_approval_decision.outstanding_conditions.length).toBeGreaterThan(0);
    expect(result.production_approved).toBe(false);
  });

  it.each([
    ["PRODUCTION_INVALID", "PRECEDING_CERTIFICATION_CRITICAL_FAILURE"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ORCHESTRATION"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_FAILURE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_BOUNDARY_VIOLATION"],
    ["UNAUTHORIZED_EXECUTION", "UNAUTHORIZED_EXECUTION"],
    ["TENANT_LEAKAGE", "TENANT_LEAKAGE"],
    ["CROSS_TENANT_DATA", "CROSS_TENANT_DATA_EXPOSURE"],
    ["HIDDEN_DECISION_LOGIC", "HIDDEN_DECISION_LOGIC"],
    ["HIDDEN_ORCHESTRATION_STATE", "HIDDEN_ORCHESTRATION_STATE"],
    ["MISSING_OPERATOR_APPROVAL", "MISSING_OPERATOR_APPROVAL"],
    ["MISSING_AUDIT", "MISSING_AUDIT_EVIDENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["INCOMPLETE_REPLAY_LINEAGE", "INCOMPLETE_REPLAY_LINEAGE"],
    ["DASHBOARD_GAP", "DASHBOARD_VISIBILITY_GAP"],
    ["SECURITY_BOUNDARY_VIOLATION", "SECURITY_BOUNDARY_VIOLATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<FinalOrchestratorCertificationInput["scenario"]>, FinalCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runFinalOrchestratorCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.final_report.final_certification_decision).toBe("FAIL");
    expect(result.production_approval_decision.production_approval_status).toBe("BLOCKED");
    expect(result.production_approved).toBe(false);
  });

  it("fails closed when the role lacks final certification visibility", () => {
    const result = runFinalOrchestratorCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects final certification tampering", () => {
    const result = runFinalOrchestratorCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayFinalOrchestratorCertification(tampered)).toBe(false);
  });
});
