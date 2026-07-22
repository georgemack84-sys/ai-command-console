import { describe, expect, it } from "vitest";

import { getTrustRecoveryRevocationStageTenBundle, replayTrustRecoveryRevocationStageTen, runTrustRecoveryRevocationStageTen, validateTrustRecoveryRevocationStageTen } from "@/services/trust-recovery-revocation-stage-ten";
import type { TrustRecoveryRevocationFailure } from "@/types/trust-recovery-revocation-stage-ten";

const conditionalFailures = ["RECOVERY_EVALUATION_ENGINE_MISSING", "RECOVERY_ELIGIBILITY_RULES_MISSING", "CONSTITUTIONAL_RECOVERY_VALIDATION_MISSING", "EVIDENCE_SUFFICIENCY_EVALUATION_MISSING", "RECOVERY_PRECONDITIONS_MISSING", "RECOVERY_RISK_REVIEW_MISSING", "ALIGNMENT_REVALIDATION_MISSING", "POLICY_REVALIDATION_MISSING", "SAFETY_REVALIDATION_MISSING", "RECOVERY_DECISION_LOGIC_MISSING", "RECOVERY_RECOMMENDATION_MISSING", "RECOVERY_WORKFLOW_MISSING", "STANDING_PROMOTION_RULES_MISSING", "RECOVERY_AUTHORIZATION_MISSING", "RECOVERY_QUALIFICATION_MISSING", "RECOVERY_VERIFICATION_MISSING", "RECOVERY_STATE_TRANSITION_MISSING", "RECOVERY_EVIDENCE_COLLECTION_MISSING", "STANDING_REINSTATEMENT_MISSING", "RECOVERY_NOTIFICATIONS_MISSING", "REVOCATION_EVALUATION_MISSING", "REVOCATION_CRITERIA_MISSING", "MANDATORY_REVOCATION_RULES_MISSING", "REVOCATION_AUTHORIZATION_MISSING", "REVOCATION_EVIDENCE_MISSING", "REVOCATION_RECORDING_MISSING", "DEPENDENCY_IMPACT_ANALYSIS_MISSING", "REVOCATION_NOTIFICATIONS_MISSING", "FEDERATION_REVOCATION_PROPAGATION_MISSING", "SUSPENSION_EVALUATION_MISSING", "SUSPENSION_CONDITIONS_MISSING", "TEMPORARY_RESTRICTIONS_MISSING", "SUSPENSION_DURATION_MISSING", "SUSPENSION_REVIEW_MISSING", "AUTOMATIC_REASSESSMENT_MISSING", "SUSPENSION_EVIDENCE_MISSING", "SUSPENSION_NOTIFICATIONS_MISSING", "EXPIRATION_DETECTION_MISSING", "SCHEDULED_EXPIRATION_MISSING", "RENEWAL_ELIGIBILITY_MISSING", "RENEWAL_EVALUATION_MISSING", "AUTOMATIC_EXPIRATION_MISSING", "EXPIRATION_NOTIFICATIONS_MISSING", "EXPIRATION_EVIDENCE_MISSING", "STANDING_TRANSITION_RULES_MISSING", "RECOVERY_EVIDENCE_PACKAGES_MISSING", "STANDING_TRANSITION_EVIDENCE_MISSING", "CONSTITUTIONAL_VALIDATION_EVIDENCE_MISSING", "RULE_EVALUATION_EVIDENCE_MISSING", "HUMAN_OVERSIGHT_REFERENCES_MISSING", "DECISION_LINEAGE_MISSING", "REPLAY_METADATA_MISSING", "AUDIT_RECORDS_MISSING", "STANDING_TRANSITION_ENGINE_MISSING", "TRANSITION_ELIGIBILITY_VALIDATION_MISSING", "TRANSITION_RULE_ENFORCEMENT_MISSING", "STANDING_EVENTS_MISSING", "STANDING_HISTORY_MISSING", "STANDING_LINEAGE_MISSING", "STANDING_REPLAY_MISSING"] as const satisfies readonly TrustRecoveryRevocationFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID", "STAGE_4_INDEPENDENT_EVALUATION_INVALID", "STAGE_5_TRUST_RESOLUTION_INVALID", "STAGE_6_EXPLAINABILITY_INVALID", "STAGE_7_HUMAN_OVERSIGHT_INVALID", "STAGE_8_CONTINUOUS_MONITORING_INVALID", "STAGE_9_DRIFT_DETECTION_INVALID", "RECOVERY_BYPASSED_CONSTITUTIONAL_EVALUATION", "REVOKED_IDENTITY_REINSTATED", "REVOCATION_REVERSED_WHEN_TERMINAL", "HUMAN_OVERSIGHT_OVERRIDES_REVOCATION", "STANDING_MODIFIED_OUTSIDE_GOVERNANCE", "TRANSITION_EVIDENCE_MUTABLE", "STANDING_HISTORY_REWRITTEN", "RECOVERY_REPLAY_DIVERGED"] as const satisfies readonly TrustRecoveryRevocationFailure[];

describe("Stage 10 Recovery and Revocation", () => {
  it("publishes constitutional recovery and revocation doctrine", () => {
    const bundle = getTrustRecoveryRevocationStageTenBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-recovery-revocation-stage-ten/stage-10", constitution_governs_all_standing_transitions: true, recovery_never_bypasses_constitutional_evaluation: true, revocation_irreversible_when_required: true, standing_history_permanent: true, immutable_transition_evidence_required: true, deterministic_replay_required: true, qualification_gate: "Stage 10 Recovery and Revocation Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("RECOVERY_REVOCATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes stages 1 through 9", () => {
    const first = runTrustRecoveryRevocationStageTen({ seed: "deterministic" });
    const second = runTrustRecoveryRevocationStageTen({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "trust-resolution-engine/stage-5", "trust-explainability-stage-six/stage-6", "trust-human-oversight-stage-seven/stage-7", "trust-continuous-monitoring-stage-eight/stage-8", "trust-drift-detection-stage-nine/stage-9"]);
    expect(first.provides).toEqual(["recovery-evaluation-engine", "standing-recovery-service", "revocation-service", "suspension-service", "expiration-service", "recovery-evidence-packages", "standing-lineage-records", "standing-history"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustRecoveryRevocationStageTen(first).valid).toBe(true);
    expect(replayTrustRecoveryRevocationStageTen()).toBe(true);
  });

  it("qualifies recovery only through constitutional evaluation", () => {
    const result = runTrustRecoveryRevocationStageTen();

    expect(result.recovery_evaluation).toMatchObject({ recovery_evaluation_engine: true, recovery_eligibility_rules: true, constitutional_recovery_validation: true, evidence_sufficiency_evaluation: true, recovery_preconditions: true, recovery_risk_review: true, alignment_revalidation: true, policy_revalidation: true, safety_revalidation: true, recovery_decision_logic: true, recovery_recommendation: true, deterministic: true });
    expect(result.standing_recovery.supported_paths).toEqual(["SUSPENDED_TO_RESTRICTED", "SUSPENDED_TO_TRUSTED", "EXPIRED_TO_RESTRICTED", "EXPIRED_TO_TRUSTED"]);
    expect(result.standing_recovery.non_recoverable_states).toEqual(["REVOKED"]);
    expect(result.standing_recovery).toMatchObject({ recovery_workflow: true, standing_promotion_rules: true, recovery_authorization: true, recovery_qualification: true, recovery_verification: true, recovery_state_transition: true, recovery_evidence_collection: true, standing_reinstatement: true, recovery_notifications: true, constitutional_only: true });
    expect(runTrustRecoveryRevocationStageTen({ scenario: "RECOVERY_BYPASSED_CONSTITUTIONAL_EVALUATION" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustRecoveryRevocationStageTen({ scenario: "REVOKED_IDENTITY_REINSTATED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("enforces revocation, suspension, and expiration workflows", () => {
    const result = runTrustRecoveryRevocationStageTen();

    expect(result.revocation).toMatchObject({ revocation_evaluation: true, revocation_criteria: true, mandatory_revocation_rules: true, revocation_authorization: true, revocation_evidence: true, revocation_recording: true, dependency_impact_analysis: true, revocation_notifications: true, federation_revocation_propagation: true, deterministic: true, irreversible_when_mandated: true });
    expect(result.suspension).toMatchObject({ suspension_evaluation: true, suspension_conditions: true, temporary_restrictions: true, suspension_duration: true, suspension_review: true, automatic_reassessment: true, suspension_evidence: true, suspension_notifications: true, recovery_eligibility_preserved: true, replayable: true });
    expect(result.expiration).toMatchObject({ expiration_detection: true, scheduled_expiration: true, renewal_eligibility: true, renewal_evaluation: true, automatic_expiration: true, expiration_notifications: true, expiration_evidence: true, standing_transition_rules: true, deterministic_processing: true });
    expect(runTrustRecoveryRevocationStageTen({ scenario: "REVOCATION_REVERSED_WHEN_TERMINAL" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustRecoveryRevocationStageTen({ scenario: "HUMAN_OVERSIGHT_OVERRIDES_REVOCATION" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("records immutable transition evidence and standing lineage", () => {
    const result = runTrustRecoveryRevocationStageTen();

    expect(result.evidence).toMatchObject({ recovery_evidence_packages: true, standing_transition_evidence: true, constitutional_validation_evidence: true, rule_evaluation_evidence: true, human_oversight_references: true, decision_lineage: true, replay_metadata: true, audit_records: true, immutable: true });
    expect(result.transition_engine.lifecycle_states).toEqual(["UNKNOWN", "TRUSTED", "RESTRICTED", "SUSPENDED", "RECOVERED", "REVOKED", "EXPIRED"]);
    expect(result.transition_engine.transition_rules).toHaveLength(12);
    expect(result.transition_engine).toMatchObject({ validate_constitutional_eligibility: true, verify_recovery_requirements: true, enforce_transition_rules: true, generate_immutable_evidence: true, record_complete_lineage: true, update_standing_deterministically: true, publish_standing_events: true, deterministic_replay: true });
    expect(runTrustRecoveryRevocationStageTen({ scenario: "TRANSITION_EVIDENCE_MUTABLE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustRecoveryRevocationStageTen({ scenario: "STANDING_HISTORY_REWRITTEN" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("declares readiness only when all standing transitions stay governed", () => {
    const result = runTrustRecoveryRevocationStageTen();

    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, recovery_evaluation_ready: true, standing_recovery_ready: true, revocation_ready: true, suspension_ready: true, expiration_ready: true, evidence_ready: true, transition_engine_ready: true, constitutional_governance: true, no_bypass: true, terminal_revocation_enforced: true, human_oversight_bounded: true, immutable_transitions: true, permanent_history: true, replayable: true, certification_ready: true });
    expect(runTrustRecoveryRevocationStageTen({ scenario: "STANDING_MODIFIED_OUTSIDE_GOVERNANCE" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runTrustRecoveryRevocationStageTen({ scenario: "RECOVERY_REPLAY_DIVERGED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustRecoveryRevocationStageTen({ scenario: failure });
    const validation = validateTrustRecoveryRevocationStageTen(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustRecoveryRevocationStageTen({ scenario: failure });
    const validation = validateTrustRecoveryRevocationStageTen(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustRecoveryRevocationStageTen({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustRecoveryRevocationStageTen({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustRecoveryRevocationStageTen({ scenario: "RECOVERY_REVOCATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustRecoveryRevocationStageTen(notQualified).valid).toBe(false);
  });
});
