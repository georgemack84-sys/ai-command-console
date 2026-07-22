export type TrustHumanOversightOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type ReviewType = "OPERATOR_REVIEW" | "GOVERNANCE_REVIEW" | "TRUST_RESTORATION" | "AMBIGUITY_REVIEW" | "INTERVENTION_REVIEW" | "APPEAL_REVIEW";
export type ReviewStatus = "NOT_STARTED" | "ASSIGNED" | "IN_PROGRESS" | "AWAITING_EVIDENCE" | "AWAITING_GOVERNANCE" | "AWAITING_OPERATOR" | "APPROVED" | "CONDITIONALLY_APPROVED" | "DENIED" | "RETURNED_FOR_REVIEW" | "ESCALATED" | "CANCELLED" | "CLOSED";
export type GovernanceDecision = "APPROVE" | "APPROVE_WITH_CONDITIONS" | "DENY" | "ESCALATE" | "REQUIRE_MORE_EVIDENCE" | "REQUIRE_REPLAY" | "REQUIRE_ALIGNMENT_REVIEW" | "REQUIRE_POLICY_REVIEW" | "REQUIRE_SAFETY_REVIEW" | "MAINTAIN_FAIL_CLOSED";
export type TrustRestorationDecision = "RESTORE" | "RESTORE_WITH_RESTRICTIONS" | "DEFER" | "DENY" | "REQUIRE_MORE_EVIDENCE" | "REQUIRE_RECERTIFICATION";
export type InterventionAction = "SUSPEND_TRUST" | "RESTORE_TRUST" | "LOCK_TRUST" | "FREEZE_AUTONOMY" | "REQUIRE_GOVERNANCE" | "REQUIRE_OPERATOR" | "REQUIRE_REPLAY" | "REQUEST_INVESTIGATION" | "MAINTAIN_FAIL_CLOSED";

export type TrustHumanOversightFailure =
  | "P5_11_EXPLAINABILITY_INVALID"
  | "OVERSIGHT_FRAMEWORK_MISSING"
  | "OPERATOR_REVIEW_WORKFLOW_MISSING"
  | "REVIEW_ASSIGNMENT_ENGINE_MISSING"
  | "REVIEW_STATUS_TRACKING_MISSING"
  | "GOVERNANCE_REVIEW_PROCESS_MISSING"
  | "TRUST_RESTORATION_APPROVAL_MISSING"
  | "AMBIGUITY_REVIEW_PROCESS_MISSING"
  | "INTERVENTION_GOVERNANCE_MISSING"
  | "REVIEW_REQUIRED_NOT_DETECTED"
  | "OPERATOR_REVIEW_INCOMPLETE"
  | "GOVERNANCE_REVIEW_INCOMPLETE"
  | "TRUST_RESTORATION_AUTO_APPROVED"
  | "AMBIGUITY_AUTO_APPROVED"
  | "INTERVENTION_NOT_GOVERNED"
  | "JUSTIFICATION_REPORT_MISSING"
  | "UNVERIFIABLE_EVIDENCE_USED"
  | "IMMUTABLE_AUDIT_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "FAIL_CLOSED_NOT_MAINTAINED"
  | "SILENT_INTERVENTION"
  | "AUTHORITY_GATE_MISSING"
  | "POLICY_GATE_MISSING"
  | "SAFETY_GATE_MISSING"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "REVIEW_RECORD_MISSING"
  | "GOVERNANCE_DECISION_MISSING"
  | "TRUST_COMPUTATION_EXECUTED"
  | "EVIDENCE_GENERATED"
  | "CONFIDENCE_MODELING_EXECUTED"
  | "RISK_MODELING_EXECUTED"
  | "POLICY_EVALUATION_EXECUTED"
  | "CONSTITUTIONAL_EVALUATION_EXECUTED"
  | "SAFETY_QUALIFICATION_EXECUTED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustHumanOversightScenario = "BASELINE" | TrustHumanOversightFailure;
export type TrustHumanOversightInput = Readonly<{ scenario?: TrustHumanOversightScenario; trust_id?: string; tenant_id?: string; review_type?: ReviewType; review_reason?: string }>;

export type HumanOversightRecord = Readonly<{
  oversight_id: string;
  trust_id: string;
  tenant_id: string;
  review_type: ReviewType;
  review_reason: string;
  initiated_by: string;
  assigned_reviewer: string;
  review_status: ReviewStatus;
  supporting_evidence_refs: readonly string[];
  trust_decision_refs: readonly string[];
  alignment_refs: readonly string[];
  constitutional_refs: readonly string[];
  policy_refs: readonly string[];
  safety_refs: readonly string[];
  justification_refs: readonly string[];
  review_comments: readonly string[];
  decision: GovernanceDecision;
  decision_rationale: string;
  conditions: readonly string[];
  approval_timestamp: string;
  audit_hash: string;
  integrity_hash: string;
}>;

export type OversightWorkflowState = Readonly<{ workflow_id: string; review_required_detected: boolean; operator_review_operational: boolean; governance_review_operational: boolean; restoration_approval_required: boolean; ambiguity_review_deterministic: boolean; intervention_governed: boolean; assignment_engine_operational: boolean; status_tracking_operational: boolean; integrity_hash: string }>;
export type OperatorReviewState = Readonly<{ review_id: string; assigned: boolean; status: ReviewStatus; approval_required: boolean; completed: boolean; override_requests_governed: boolean; escalation_handling: boolean; integrity_hash: string }>;
export type GovernanceReviewState = Readonly<{ review_id: string; board_review_required: boolean; constitutional_exceptions_governed: boolean; policy_disputes_governed: boolean; authority_conflicts_governed: boolean; decision: GovernanceDecision; evidence_refs: readonly string[]; completed: boolean; integrity_hash: string }>;
export type TrustRestorationApproval = Readonly<{ restoration_id: string; restoration_decision: TrustRestorationDecision; evidence_verified: boolean; safety_validated: boolean; policy_compliant: boolean; constitutional_compliant: boolean; governance_approved: boolean; operator_approved_when_required: boolean; automatic_restoration: boolean; integrity_hash: string }>;
export type AmbiguityResolution = Readonly<{ ambiguity_id: string; ambiguous_condition_refs: readonly string[]; deterministic_resolution_path: boolean; escalated: boolean; automatically_approved: boolean; fail_closed_maintained: boolean; integrity_hash: string }>;
export type InterventionGovernanceRecord = Readonly<{ intervention_id: string; action: InterventionAction; governed: boolean; immutable_governance_evidence_ref: string; silent_intervention: boolean; integrity_hash: string }>;
export type OversightAuthorityBinding = Readonly<{ binding_id: string; program_2_governance_services: boolean; program_3_authority_gate: boolean; program_3_policy_gate: boolean; program_3_safety_gate: boolean; human_authority_supreme: boolean; tenant_isolation_preserved: boolean; integrity_hash: string }>;
export type OversightBoundary = Readonly<{ boundary_id: string; trust_computation_executed: boolean; evidence_generation_executed: boolean; confidence_modeling_executed: boolean; risk_modeling_executed: boolean; policy_evaluation_executed: boolean; constitutional_evaluation_executed: boolean; safety_qualification_executed: boolean; integrity_hash: string }>;
export type TrustHumanOversightCertification = Readonly<{ certification_id: string; outcome: TrustHumanOversightOutcome; phase_ready: boolean; workflows_operational: boolean; operator_reviews_operational: boolean; governance_reviews_operational: boolean; restoration_formal_approval_required: boolean; ambiguity_resolution_deterministic: boolean; interventions_governed: boolean; immutable_records_produced: boolean; decisions_justified: boolean; tenant_isolation_preserved: boolean; fail_closed_enforced: boolean; boundary_respected: boolean; failures: readonly TrustHumanOversightFailure[]; integrity_hash: string }>;
export type TrustHumanOversightResult = Readonly<{ phase_version: "trust-human-oversight-governance/v5.12"; phase_identifier: "TrustHumanOversightGovernance"; explainability_ref: "trust-explainability-justification/v5.11"; workflow: OversightWorkflowState; operator_review: OperatorReviewState; governance_review: GovernanceReviewState; restoration: TrustRestorationApproval; ambiguity: AmbiguityResolution; intervention: InterventionGovernanceRecord; authority: OversightAuthorityBinding; record: HumanOversightRecord; boundary: OversightBoundary; certification: TrustHumanOversightCertification; replay_hash: string; integrity_hash: string }>;
export type TrustHumanOversightValidation = Readonly<{ valid: boolean; outcome: TrustHumanOversightOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; workflow_valid: boolean; operator_review_valid: boolean; governance_review_valid: boolean; restoration_valid: boolean; ambiguity_valid: boolean; intervention_valid: boolean; authority_valid: boolean; record_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustHumanOversightFailure[]; integrity_hash: string }>;
export type TrustHumanOversightBundle = Readonly<{ doctrine: Readonly<{ version: "trust-human-oversight-governance/v5.12"; owns_operator_review: true; owns_governance_review: true; owns_trust_restoration_approval: true; owns_ambiguity_review: true; owns_intervention_governance: true; computes_trust: false; generates_evidence: false; models_confidence: false; models_risk: false; evaluates_policy: false; evaluates_constitution: false; qualifies_safety: false }>; result: TrustHumanOversightResult; validation: TrustHumanOversightValidation }>;
