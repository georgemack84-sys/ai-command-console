import { describe, expect, it } from "vitest";
import { getTrustHumanOversightGovernanceBundle, replayTrustHumanOversightGovernance, runTrustHumanOversightGovernance, validateTrustHumanOversightGovernance } from "@/services/trust-human-oversight-governance";
import type { TrustHumanOversightFailure } from "@/types/trust-human-oversight-governance";

const FAILURE_MATRIX: readonly TrustHumanOversightFailure[] = [
  "P5_11_EXPLAINABILITY_INVALID",
  "OVERSIGHT_FRAMEWORK_MISSING",
  "OPERATOR_REVIEW_WORKFLOW_MISSING",
  "REVIEW_ASSIGNMENT_ENGINE_MISSING",
  "REVIEW_STATUS_TRACKING_MISSING",
  "GOVERNANCE_REVIEW_PROCESS_MISSING",
  "TRUST_RESTORATION_APPROVAL_MISSING",
  "AMBIGUITY_REVIEW_PROCESS_MISSING",
  "INTERVENTION_GOVERNANCE_MISSING",
  "REVIEW_REQUIRED_NOT_DETECTED",
  "OPERATOR_REVIEW_INCOMPLETE",
  "GOVERNANCE_REVIEW_INCOMPLETE",
  "TRUST_RESTORATION_AUTO_APPROVED",
  "AMBIGUITY_AUTO_APPROVED",
  "INTERVENTION_NOT_GOVERNED",
  "JUSTIFICATION_REPORT_MISSING",
  "UNVERIFIABLE_EVIDENCE_USED",
  "IMMUTABLE_AUDIT_MISSING",
  "TENANT_ISOLATION_VIOLATED",
  "FAIL_CLOSED_NOT_MAINTAINED",
  "SILENT_INTERVENTION",
  "AUTHORITY_GATE_MISSING",
  "POLICY_GATE_MISSING",
  "SAFETY_GATE_MISSING",
  "GOVERNANCE_EVIDENCE_MISSING",
  "REVIEW_RECORD_MISSING",
  "GOVERNANCE_DECISION_MISSING",
  "TRUST_COMPUTATION_EXECUTED",
  "EVIDENCE_GENERATED",
  "CONFIDENCE_MODELING_EXECUTED",
  "RISK_MODELING_EXECUTED",
  "POLICY_EVALUATION_EXECUTED",
  "CONSTITUTIONAL_EVALUATION_EXECUTED",
  "SAFETY_QUALIFICATION_EXECUTED",
];

describe("P5.12 Trust Human Oversight & Governance", () => {
  it("publishes the human oversight doctrine without taking over prior phase ownership", () => {
    const bundle = getTrustHumanOversightGovernanceBundle();

    expect(bundle.doctrine.version).toBe("trust-human-oversight-governance/v5.12");
    expect(bundle.doctrine.owns_operator_review).toBe(true);
    expect(bundle.doctrine.owns_governance_review).toBe(true);
    expect(bundle.doctrine.owns_trust_restoration_approval).toBe(true);
    expect(bundle.doctrine.owns_ambiguity_review).toBe(true);
    expect(bundle.doctrine.owns_intervention_governance).toBe(true);
    expect(bundle.doctrine.computes_trust).toBe(false);
    expect(bundle.doctrine.generates_evidence).toBe(false);
    expect(bundle.doctrine.models_confidence).toBe(false);
    expect(bundle.doctrine.models_risk).toBe(false);
    expect(bundle.doctrine.evaluates_policy).toBe(false);
    expect(bundle.doctrine.evaluates_constitution).toBe(false);
    expect(bundle.doctrine.qualifies_safety).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic oversight records, approvals, and governed interventions", () => {
    const first = runTrustHumanOversightGovernance();
    const second = runTrustHumanOversightGovernance();

    expect(first.phase_identifier).toBe("TrustHumanOversightGovernance");
    expect(first.explainability_ref).toBe("trust-explainability-justification/v5.11");
    expect(first.workflow.review_required_detected).toBe(true);
    expect(first.workflow.operator_review_operational).toBe(true);
    expect(first.workflow.governance_review_operational).toBe(true);
    expect(first.workflow.restoration_approval_required).toBe(true);
    expect(first.operator_review.status).toBe("APPROVED");
    expect(first.governance_review.decision).toBe("APPROVE_WITH_CONDITIONS");
    expect(first.restoration.restoration_decision).toBe("RESTORE_WITH_RESTRICTIONS");
    expect(first.restoration.automatic_restoration).toBe(false);
    expect(first.ambiguity.escalated).toBe(true);
    expect(first.ambiguity.fail_closed_maintained).toBe(true);
    expect(first.intervention.action).toBe("MAINTAIN_FAIL_CLOSED");
    expect(first.intervention.governed).toBe(true);
    expect(first.authority.human_authority_supreme).toBe(true);
    expect(first.authority.tenant_isolation_preserved).toBe(true);
    expect(first.record.audit_hash.length).toBeGreaterThan(0);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustHumanOversightGovernance(first).valid).toBe(true);
    expect(replayTrustHumanOversightGovernance(first)).toBe(true);
  });

  it("passes only when all human oversight exit criteria are satisfied", () => {
    const result = runTrustHumanOversightGovernance();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.workflows_operational).toBe(true);
    expect(result.certification.operator_reviews_operational).toBe(true);
    expect(result.certification.governance_reviews_operational).toBe(true);
    expect(result.certification.restoration_formal_approval_required).toBe(true);
    expect(result.certification.ambiguity_resolution_deterministic).toBe(true);
    expect(result.certification.interventions_governed).toBe(true);
    expect(result.certification.immutable_records_produced).toBe(true);
    expect(result.certification.decisions_justified).toBe(true);
    expect(result.certification.tenant_isolation_preserved).toBe(true);
    expect(result.certification.fail_closed_enforced).toBe(true);
    expect(result.certification.boundary_respected).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails oversight certification for %s", (failure) => {
    const result = runTrustHumanOversightGovernance({ scenario: failure });
    const validation = validateTrustHumanOversightGovernance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without oversight readiness", () => {
    const result = runTrustHumanOversightGovernance({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustHumanOversightGovernance(result).valid).toBe(false);
  });

  it("never allows trust restoration to proceed automatically", () => {
    const result = runTrustHumanOversightGovernance({ scenario: "TRUST_RESTORATION_AUTO_APPROVED" });

    expect(result.restoration.automatic_restoration).toBe(true);
    expect(result.certification.restoration_formal_approval_required).toBe(false);
    expect(result.certification.failures).toContain("TRUST_RESTORATION_AUTO_APPROVED");
  });

  it("maintains fail-closed state when ambiguity cannot be safely resolved", () => {
    const result = runTrustHumanOversightGovernance({ scenario: "AMBIGUITY_AUTO_APPROVED" });

    expect(result.ambiguity.automatically_approved).toBe(true);
    expect(result.certification.ambiguity_resolution_deterministic).toBe(false);
    expect(result.certification.failures).toContain("AMBIGUITY_AUTO_APPROVED");
  });

  it("records silent interventions as constitutional failures", () => {
    const result = runTrustHumanOversightGovernance({ scenario: "SILENT_INTERVENTION" });

    expect(result.intervention.silent_intervention).toBe(true);
    expect(result.intervention.immutable_governance_evidence_ref).toBe("");
    expect(result.certification.immutable_records_produced).toBe(false);
    expect(result.certification.failures).toContain("SILENT_INTERVENTION");
  });
});
