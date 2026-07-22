import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type FeedbackManipulationStatus = "PASS" | "MANIPULATION_DETECTED" | "QUARANTINED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type FeedbackManipulationFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_TRUST_CHANGE"
  | "ANONYMOUS_FEEDBACK_DETECTED"
  | "UNAUTHORIZED_OPERATOR_DETECTED"
  | "SPOOFED_IDENTITY_DETECTED"
  | "REPLAY_ATTACK_DETECTED"
  | "EXPIRED_CREDENTIAL_DETECTED"
  | "FORGED_FEEDBACK_DETECTED"
  | "COORDINATED_APPROVALS_DETECTED"
  | "MALICIOUS_OVERRIDE_DETECTED"
  | "REPEATED_BIASED_FEEDBACK"
  | "APPROVAL_GAMING_DETECTED"
  | "REJECTION_MANIPULATION_DETECTED"
  | "FEEDBACK_FLOODING_DETECTED"
  | "SYNTHETIC_FEEDBACK_DETECTED"
  | "ADVERSARIAL_OPERATOR_INFLUENCE"
  | "COLLUSIVE_APPROVAL_BEHAVIOR"
  | "COORDINATED_REJECTION_CAMPAIGN"
  | "AUTOMATED_FEEDBACK_GENERATION"
  | "EXCESSIVE_INFLUENCE_CONCENTRATION"
  | "GOVERNANCE_CIRCUMVENTION_THROUGH_FEEDBACK"
  | "NONDETERMINISTIC_ASSESSMENT"
  | "NONREPLAYABLE_FEEDBACK_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_FEEDBACK_BEHAVIOR";

export type FeedbackManipulationScenario =
  | "BASELINE"
  | "UNAUTHORIZED_TRUST_CHANGE"
  | "ANONYMOUS_FEEDBACK"
  | "UNAUTHORIZED_OPERATOR"
  | "SPOOFED_IDENTITY"
  | "REPLAY_ATTACK"
  | "EXPIRED_CREDENTIAL"
  | "FORGED_FEEDBACK"
  | "COORDINATED_APPROVALS"
  | "MALICIOUS_OVERRIDE"
  | "REPEATED_BIAS"
  | "APPROVAL_GAMING"
  | "REJECTION_MANIPULATION"
  | "FEEDBACK_FLOODING"
  | "SYNTHETIC_FEEDBACK"
  | "ADVERSARIAL_INFLUENCE"
  | "COLLUSIVE_APPROVAL"
  | "COORDINATED_REJECTION"
  | "AUTOMATED_GENERATION"
  | "EXCESSIVE_INFLUENCE"
  | "GOVERNANCE_CIRCUMVENTION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type FeedbackTrustBaseline = Readonly<{
  baseline_id: string;
  feedback_policy_version: string;
  authorized_roles: readonly string[];
  authentication_requirements: readonly string[];
  trust_thresholds: readonly string[];
  feedback_limits: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type FeedbackAuthenticationReport = Readonly<{
  report_id: string;
  operator_identity_valid: boolean;
  authentication_status: "AUTHENTICATED" | "REJECTED" | "REQUIRES_REVIEW";
  authorization_scope_valid: boolean;
  session_integrity_valid: boolean;
  tenant_ownership_valid: boolean;
  digital_signature_valid: boolean;
  replay_authenticity_valid: boolean;
  feedback_provenance_valid: boolean;
  operator_verification_summary: string;
  feedback_authenticity_status: string;
  rejected_feedback_refs: readonly string[];
  integrity_hash: string;
}>;

export type ApprovalPatternReport = Readonly<{
  report_id: string;
  approval_frequency_score: number;
  approval_consistency_score: number;
  approval_timing_score: number;
  approval_clustering_score: number;
  approval_sequencing_score: number;
  operator_agreement_score: number;
  historical_approval_trend_score: number;
  approval_pattern_report: string;
  approval_integrity_assessment: string;
  detected_approval_anomalies: readonly FeedbackManipulationFailure[];
  integrity_hash: string;
}>;

export type RejectionPatternReport = Readonly<{
  report_id: string;
  rejection_frequency_score: number;
  rejection_timing_score: number;
  rejection_clustering_score: number;
  rejection_consistency_score: number;
  historical_rejection_trend_score: number;
  operator_disagreement_score: number;
  recommendation_targeting_score: number;
  rejection_pattern_report: string;
  rejection_integrity_assessment: string;
  detected_rejection_anomalies: readonly FeedbackManipulationFailure[];
  integrity_hash: string;
}>;

export type SyntheticFeedbackAssessment = Readonly<{
  assessment_id: string;
  synthetic_feedback_detected: boolean;
  duplicated_submissions_detected: boolean;
  automated_responses_detected: boolean;
  replayed_feedback_detected: boolean;
  generated_feedback_detected: boolean;
  forged_operator_comments_detected: boolean;
  anomalous_behavioral_signatures: readonly string[];
  authenticity_report: string;
  evidence_integrity_summary: string;
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type OperatorInfluenceReport = Readonly<{
  report_id: string;
  operator_influence_score: number;
  influence_concentration_score: number;
  feedback_diversity_score: number;
  historical_trust_score: number;
  governance_compliance_score: number;
  adaptation_impact_score: number;
  recommendation_influence_score: number;
  influence_distribution_analysis: string;
  governance_impact_summary: string;
  detected_influence_anomalies: readonly FeedbackManipulationFailure[];
  integrity_hash: string;
}>;

export type FeedbackIntegrityScoreReport = Readonly<{
  score_id: string;
  feedback_integrity_score: number;
  authenticity_score: number;
  manipulation_score: number;
  trust_score: number;
  diversity_score: number;
  consistency_score: number;
  governance_compliance_score: number;
  historical_reliability_score: number;
  integrity_hash: string;
}>;

export type ManipulationAssessment = Readonly<{
  assessment_id: string;
  manipulation_detected: boolean;
  manipulation_types: readonly FeedbackManipulationFailure[];
  affected_operators: readonly string[];
  affected_feedback_refs: readonly string[];
  supporting_evidence: readonly string[];
  severity: DriftSeverity;
  recommended_containment_actions: readonly string[];
  recommended_response: DriftResponse;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type TrustImpactAnalysis = Readonly<{
  analysis_id: string;
  adaptation_reliability_score: number;
  recommendation_reliability_score: number;
  governance_confidence_score: number;
  evidence_integrity_score: number;
  operator_trust_score: number;
  certification_readiness_score: number;
  replay_reliability_score: number;
  trust_impact_summary: string;
  production_readiness_impact: string;
  integrity_hash: string;
}>;

export type FeedbackContainmentDecision = Readonly<{
  containment_id: string;
  rejected_feedback_refs: readonly string[];
  quarantined_feedback_refs: readonly string[];
  excluded_from_learning_refs: readonly string[];
  containment_actions: readonly string[];
  governance_review_required: boolean;
  operator_notification_required: boolean;
  forensic_evidence_preserved: true;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type FeedbackManipulationRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  feedback_policy_version: string;
  manipulation_type: "FEEDBACK_MANIPULATION";
  feedback_integrity_score: number;
  trust_score: number;
  severity: DriftSeverity;
  affected_feedback_refs: readonly string[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  operator_refs: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  containment_required: boolean;
  governance_impact: string;
  trust_impact: string;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type FeedbackManipulationMetrics = Readonly<{
  feedback_integrity_score: number;
  trust_score: number;
  authenticity_score: number;
  manipulation_score: number;
  containment_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly FeedbackManipulationFailure[];
  integrity_hash: string;
}>;

export type FeedbackManipulationApiSurface = Readonly<{
  api_id: string;
  defend_feedback_integrity: "POST /feedback-manipulation-defense/defend";
  retrieve_baseline: "POST /feedback-manipulation-defense/baseline";
  retrieve_authentication_report: "POST /feedback-manipulation-defense/authentication";
  retrieve_approval_report: "POST /feedback-manipulation-defense/approval-patterns";
  retrieve_rejection_report: "POST /feedback-manipulation-defense/rejection-patterns";
  retrieve_synthetic_assessment: "POST /feedback-manipulation-defense/synthetic";
  retrieve_influence_report: "POST /feedback-manipulation-defense/influence";
  retrieve_integrity_score: "POST /feedback-manipulation-defense/integrity-score";
  retrieve_manipulation_assessment: "POST /feedback-manipulation-defense/assessment";
  retrieve_trust_impact: "POST /feedback-manipulation-defense/trust-impact";
  retrieve_containment: "POST /feedback-manipulation-defense/containment";
  retrieve_ledger_record: "POST /feedback-manipulation-defense/ledger";
  retrieve_metrics: "POST /feedback-manipulation-defense/metrics";
  replay_defense: "POST /feedback-manipulation-defense/replay";
  inspect_defense: "POST /feedback-manipulation-defense/inspect";
  retrieve_contract: "GET /feedback-manipulation-defense/contract";
  feedback_mutation_supported: false;
  learning_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type FeedbackManipulationInput = Readonly<{
  scenario?: FeedbackManipulationScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type FeedbackManipulationResult = Readonly<{
  feedback_manipulation_defense_version: "feedback-manipulation-defense/v1";
  defense_identifier: "FeedbackManipulationDefense";
  status: FeedbackManipulationStatus;
  api_surface: FeedbackManipulationApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: FeedbackTrustBaseline;
  authentication_report: FeedbackAuthenticationReport;
  approval_report: ApprovalPatternReport;
  rejection_report: RejectionPatternReport;
  synthetic_assessment: SyntheticFeedbackAssessment;
  influence_report: OperatorInfluenceReport;
  integrity_score_report: FeedbackIntegrityScoreReport;
  manipulation_assessment: ManipulationAssessment;
  trust_impact_analysis: TrustImpactAnalysis;
  containment_decision: FeedbackContainmentDecision;
  manipulation_record: FeedbackManipulationRecord;
  metrics: FeedbackManipulationMetrics;
  failures: readonly FeedbackManipulationFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_behavior: false;
  authorizes_learning: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type FeedbackManipulationFoundation = Readonly<{
  feedback_manipulation_defense_version: "feedback-manipulation-defense/v1";
  api_surface: FeedbackManipulationApiSurface;
  result: FeedbackManipulationResult;
}>;
