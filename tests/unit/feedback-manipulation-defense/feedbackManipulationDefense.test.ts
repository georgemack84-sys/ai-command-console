import { describe, expect, it } from "vitest";
import {
  defendFeedbackIntegrity,
  getFeedbackManipulationFoundation,
  replayFeedbackManipulationDefense,
} from "@/services/feedback-manipulation-defense";
import type {
  FeedbackManipulationFailure,
  FeedbackManipulationScenario,
  FeedbackManipulationStatus,
} from "@/types/feedback-manipulation-defense";

describe("Mission Control Phase 10.12.6 Feedback Manipulation Defense", () => {
  it("publishes the feedback manipulation defense contract", () => {
    const foundation = getFeedbackManipulationFoundation();

    expect(foundation.feedback_manipulation_defense_version).toBe("feedback-manipulation-defense/v1");
    expect(foundation.api_surface.defend_feedback_integrity).toBe("POST /feedback-manipulation-defense/defend");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /feedback-manipulation-defense/baseline");
    expect(foundation.api_surface.retrieve_authentication_report).toBe("POST /feedback-manipulation-defense/authentication");
    expect(foundation.api_surface.retrieve_synthetic_assessment).toBe("POST /feedback-manipulation-defense/synthetic");
    expect(foundation.api_surface.retrieve_trust_impact).toBe("POST /feedback-manipulation-defense/trust-impact");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /feedback-manipulation-defense/contract");
    expect(foundation.api_surface.feedback_mutation_supported).toBe(false);
    expect(foundation.api_surface.learning_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.defense_identifier).toBe("FeedbackManipulationDefense");
    expect(foundation.result.status).toBe("PASS");
  });

  it("defends deterministically with stable replay and integrity hashes", () => {
    const first = defendFeedbackIntegrity();
    const second = defendFeedbackIntegrity();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.authentication_report.integrity_hash).toBe(second.authentication_report.integrity_hash);
    expect(first.approval_report.integrity_hash).toBe(second.approval_report.integrity_hash);
    expect(first.rejection_report.integrity_hash).toBe(second.rejection_report.integrity_hash);
    expect(first.synthetic_assessment.integrity_hash).toBe(second.synthetic_assessment.integrity_hash);
    expect(first.influence_report.integrity_hash).toBe(second.influence_report.integrity_hash);
    expect(first.integrity_score_report.integrity_hash).toBe(second.integrity_score_report.integrity_hash);
    expect(first.manipulation_assessment.integrity_hash).toBe(second.manipulation_assessment.integrity_hash);
    expect(first.trust_impact_analysis.integrity_hash).toBe(second.trust_impact_analysis.integrity_hash);
    expect(first.containment_decision.integrity_hash).toBe(second.containment_decision.integrity_hash);
    expect(first.manipulation_record.integrity_hash).toBe(second.manipulation_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayFeedbackManipulationDefense(first)).toBe(true);
  });

  it("maintains the authoritative feedback trust baseline", () => {
    const baseline = defendFeedbackIntegrity().baseline;

    expect(baseline.baseline_id).toBe("feedback_trust_baseline_v1");
    expect(baseline.feedback_policy_version).toBe("feedback-policy/v1");
    expect(baseline.authorized_roles).toContain("governance_reviewer");
    expect(baseline.authentication_requirements).toEqual(expect.arrayContaining(["authenticated_identity", "digital_signature", "replay_nonce"]));
    expect(baseline.trust_thresholds).toContain("quarantine_below:0.40");
    expect(baseline.feedback_limits).toContain("no_anonymous_feedback");
    expect(baseline.governance_requirements).toContain("feedback_is_evidence_not_authority");
    expect(baseline.constitutional_requirements).toContain("feedback_cannot_override_governance");
    expect(baseline.approval_reference).toBe("governance-approval:feedback-trust-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("authenticates and validates baseline feedback provenance", () => {
    const auth = defendFeedbackIntegrity().authentication_report;

    expect(auth.operator_identity_valid).toBe(true);
    expect(auth.authentication_status).toBe("AUTHENTICATED");
    expect(auth.authorization_scope_valid).toBe(true);
    expect(auth.session_integrity_valid).toBe(true);
    expect(auth.tenant_ownership_valid).toBe(true);
    expect(auth.digital_signature_valid).toBe(true);
    expect(auth.replay_authenticity_valid).toBe(true);
    expect(auth.feedback_provenance_valid).toBe(true);
    expect(auth.feedback_authenticity_status).toBe("trusted");
    expect(auth.rejected_feedback_refs).toEqual([]);
  });

  it("analyzes approval, rejection, synthetic feedback, and influence patterns", () => {
    const result = defendFeedbackIntegrity();

    expect(result.approval_report.approval_pattern_report).toContain("historically consistent");
    expect(result.approval_report.approval_frequency_score).toBe(0.96);
    expect(result.rejection_report.rejection_pattern_report).toContain("historically consistent");
    expect(result.rejection_report.rejection_frequency_score).toBe(0.96);
    expect(result.synthetic_assessment.synthetic_feedback_detected).toBe(false);
    expect(result.synthetic_assessment.automatic_blocks).toEqual([]);
    expect(result.influence_report.influence_distribution_analysis).toContain("distributed");
    expect(result.influence_report.influence_concentration_score).toBe(0.08);
  });

  it("generates feedback integrity score, manipulation assessment, and trust impact analysis", () => {
    const result = defendFeedbackIntegrity();

    expect(result.integrity_score_report.feedback_integrity_score).toBe(0.96);
    expect(result.integrity_score_report.authenticity_score).toBe(0.96);
    expect(result.integrity_score_report.manipulation_score).toBe(0.03);
    expect(result.integrity_score_report.trust_score).toBe(0.95);
    expect(result.manipulation_assessment.manipulation_detected).toBe(false);
    expect(result.manipulation_assessment.recommended_response).toBe("MONITOR");
    expect(result.trust_impact_analysis.trust_impact_summary).toContain("suitable");
    expect(result.trust_impact_analysis.production_readiness_impact).toContain("No production");
  });

  it("keeps baseline containment advisory and preserves governed learning boundaries", () => {
    const containment = defendFeedbackIntegrity().containment_decision;

    expect(containment.rejected_feedback_refs).toEqual([]);
    expect(containment.quarantined_feedback_refs).toEqual([]);
    expect(containment.excluded_from_learning_refs).toEqual([]);
    expect(containment.containment_actions).toEqual(["monitor_feedback_integrity"]);
    expect(containment.governance_review_required).toBe(false);
    expect(containment.operator_notification_required).toBe(false);
    expect(containment.forensic_evidence_preserved).toBe(true);
    expect(containment.fail_closed).toBe(false);
  });

  it("writes the canonical FeedbackManipulationRecord ledger entry", () => {
    const record = defendFeedbackIntegrity({ tenant_id: "tenant-alpha" }).manipulation_record;

    expect(record.drift_id).toMatch(/^feedback_manipulation_/);
    expect(record.tenant_id).toBe("tenant-alpha");
    expect(record.feedback_policy_version).toBe("feedback-policy/v1");
    expect(record.manipulation_type).toBe("FEEDBACK_MANIPULATION");
    expect(record.feedback_integrity_score).toBe(0.96);
    expect(record.trust_score).toBe(0.95);
    expect(record.severity).toBe("INFORMATIONAL");
    expect(record.affected_feedback_refs).toEqual([]);
    expect(record.affected_adaptations).toContain("adaptation:feedback-learning");
    expect(record.affected_recommendations).toContain("recommendation:operator-feedback-weighted");
    expect(record.supporting_evidence).toMatch(/[a-f0-9]{64}/);
    expect(record.recommended_response).toBe("MONITOR");
    expect(record.containment_required).toBe(false);
    expect(record.governance_impact).toBe("governance_preserved");
    expect(record.replay_refs).toContain("replay:feedback-manipulation-defense");
    expect(record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("preserves deterministic, replayable, governance, constitutional, operator, tenant, advisory, and no-learning-authorization invariants", () => {
    const result = defendFeedbackIntegrity();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_learning).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_TRUST_CHANGE", "UNAUTHORIZED_TRUST_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["ANONYMOUS_FEEDBACK", "ANONYMOUS_FEEDBACK_DETECTED", "QUARANTINED"],
    ["UNAUTHORIZED_OPERATOR", "UNAUTHORIZED_OPERATOR_DETECTED", "QUARANTINED"],
    ["SPOOFED_IDENTITY", "SPOOFED_IDENTITY_DETECTED", "QUARANTINED"],
    ["REPLAY_ATTACK", "REPLAY_ATTACK_DETECTED", "QUARANTINED"],
    ["EXPIRED_CREDENTIAL", "EXPIRED_CREDENTIAL_DETECTED", "QUARANTINED"],
    ["FORGED_FEEDBACK", "FORGED_FEEDBACK_DETECTED", "QUARANTINED"],
    ["COORDINATED_APPROVALS", "COORDINATED_APPROVALS_DETECTED", "MANIPULATION_DETECTED"],
    ["MALICIOUS_OVERRIDE", "MALICIOUS_OVERRIDE_DETECTED", "MANIPULATION_DETECTED"],
    ["REPEATED_BIAS", "REPEATED_BIASED_FEEDBACK", "MANIPULATION_DETECTED"],
    ["APPROVAL_GAMING", "APPROVAL_GAMING_DETECTED", "MANIPULATION_DETECTED"],
    ["REJECTION_MANIPULATION", "REJECTION_MANIPULATION_DETECTED", "MANIPULATION_DETECTED"],
    ["FEEDBACK_FLOODING", "FEEDBACK_FLOODING_DETECTED", "MANIPULATION_DETECTED"],
    ["SYNTHETIC_FEEDBACK", "SYNTHETIC_FEEDBACK_DETECTED", "QUARANTINED"],
    ["ADVERSARIAL_INFLUENCE", "ADVERSARIAL_OPERATOR_INFLUENCE", "MANIPULATION_DETECTED"],
    ["COLLUSIVE_APPROVAL", "COLLUSIVE_APPROVAL_BEHAVIOR", "MANIPULATION_DETECTED"],
    ["COORDINATED_REJECTION", "COORDINATED_REJECTION_CAMPAIGN", "MANIPULATION_DETECTED"],
    ["AUTOMATED_GENERATION", "AUTOMATED_FEEDBACK_GENERATION", "QUARANTINED"],
    ["EXCESSIVE_INFLUENCE", "EXCESSIVE_INFLUENCE_CONCENTRATION", "MANIPULATION_DETECTED"],
    ["GOVERNANCE_CIRCUMVENTION", "GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK", "REQUIRES_GOVERNANCE_REVIEW"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ASSESSMENT", "MANIPULATION_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_FEEDBACK_EVIDENCE", "MANIPULATION_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_FEEDBACK_BEHAVIOR", "FAIL_CLOSED"],
  ] as const)("classifies and replays %s", (scenario: FeedbackManipulationScenario, failure: FeedbackManipulationFailure, status: FeedbackManipulationStatus) => {
    const result = defendFeedbackIntegrity({ scenario });

    expect(result.status).toBe(status);
    expect(result.failures).toContain(failure);
    expect(result.manipulation_record.manipulation_type).toBe("FEEDBACK_MANIPULATION");
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_learning).toBe(false);
    expect(replayFeedbackManipulationDefense(result)).toBe(true);
  });

  it("rejects unauthenticated and forged feedback before learning", () => {
    const anonymous = defendFeedbackIntegrity({ scenario: "ANONYMOUS_FEEDBACK" });
    const forged = defendFeedbackIntegrity({ scenario: "FORGED_FEEDBACK" });

    expect(anonymous.authentication_report.authentication_status).toBe("REJECTED");
    expect(anonymous.containment_decision.rejected_feedback_refs).toContain("feedback:rejected-authentication");
    expect(anonymous.containment_decision.excluded_from_learning_refs).toContain("feedback:rejected-authentication");
    expect(forged.authentication_report.digital_signature_valid).toBe(false);
    expect(forged.status).toBe("QUARANTINED");
  });

  it("suppresses synthetic, replayed, and automated feedback", () => {
    const synthetic = defendFeedbackIntegrity({ scenario: "SYNTHETIC_FEEDBACK" });
    const replay = defendFeedbackIntegrity({ scenario: "REPLAY_ATTACK" });
    const automated = defendFeedbackIntegrity({ scenario: "AUTOMATED_GENERATION" });

    expect(synthetic.synthetic_assessment.synthetic_feedback_detected).toBe(true);
    expect(synthetic.synthetic_assessment.automatic_blocks).toContain("suppress_synthetic_feedback");
    expect(replay.synthetic_assessment.replayed_feedback_detected).toBe(true);
    expect(automated.synthetic_assessment.automated_responses_detected).toBe(true);
    expect(synthetic.containment_decision.containment_actions).toContain("exclude_from_adaptive_learning");
  });

  it("detects coordinated approvals, coordinated rejections, and excessive influence", () => {
    const approvals = defendFeedbackIntegrity({ scenario: "COORDINATED_APPROVALS" });
    const rejections = defendFeedbackIntegrity({ scenario: "COORDINATED_REJECTION" });
    const influence = defendFeedbackIntegrity({ scenario: "EXCESSIVE_INFLUENCE" });

    expect(approvals.approval_report.detected_approval_anomalies).toContain("COORDINATED_APPROVALS_DETECTED");
    expect(rejections.rejection_report.detected_rejection_anomalies).toContain("COORDINATED_REJECTION_CAMPAIGN");
    expect(influence.influence_report.detected_influence_anomalies).toContain("EXCESSIVE_INFLUENCE_CONCENTRATION");
    expect(influence.influence_report.influence_concentration_score).toBe(0.72);
  });

  it("marks degraded determinism, replay, governance, constitutional, and tenant guarantees", () => {
    expect(defendFeedbackIntegrity({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    expect(defendFeedbackIntegrity({ scenario: "NONREPLAYABLE_EVIDENCE" }).replayable).toBe(false);
    expect(defendFeedbackIntegrity({ scenario: "NONREPLAYABLE_EVIDENCE" }).evidence_backed).toBe(false);
    expect(defendFeedbackIntegrity({ scenario: "GOVERNANCE_CIRCUMVENTION" }).governance_preserved).toBe(false);
    expect(defendFeedbackIntegrity({ scenario: "TENANT_BREACH" }).constitutional_preserved).toBe(false);
    expect(defendFeedbackIntegrity({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("detects nested feedback containment tampering", () => {
    const result = defendFeedbackIntegrity();
    const tampered = {
      ...result,
      containment_decision: {
        ...result.containment_decision,
        containment_actions: ["learn_anyway"],
      },
    };

    expect(replayFeedbackManipulationDefense(tampered)).toBe(false);
  });
});
