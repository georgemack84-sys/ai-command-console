export type TrustEvaluationOutcome = "PASS" | "FAIL" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW";
export type TrustStanding = "TRUSTED" | "CONDITIONALLY_TRUSTED" | "RESTRICTED" | "SUSPENDED" | "UNTRUSTED";
export type TrustDecisionValue = "APPROVE" | "APPROVE_WITH_RESTRICTIONS" | "REQUIRE_OPERATOR_REVIEW" | "REQUIRE_GOVERNANCE_REVIEW" | "DENY";
export type EvidenceCompletenessStatus = "COMPLETE" | "INCOMPLETE" | "STALE" | "CONFLICTING" | "UNVERIFIABLE" | "CORRUPTED" | "OUTSIDE_BOUNDARY";

export type TrustEvaluationFailure =
  | "P5_1_TRUST_ARCHITECTURE_INVALID"
  | "P5_2_TRUST_REGISTRY_INVALID"
  | "P5_3_RESTRICTION_POLICY_INVALID"
  | "P5_4_AUTONOMY_CLASSIFICATION_INVALID"
  | "P5_5_EVIDENCE_CONFIDENCE_INVALID"
  | "P5_6_RISK_GOVERNANCE_INVALID"
  | "EVALUATION_ENGINE_MISSING"
  | "EVIDENCE_PACKAGE_MISSING"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_STALE"
  | "EVIDENCE_CONFLICTING"
  | "EVIDENCE_UNVERIFIABLE"
  | "EVIDENCE_CORRUPTED"
  | "EVIDENCE_OUTSIDE_BOUNDARY"
  | "CONFIDENCE_INTEGRATION_INVALID"
  | "RISK_INTEGRATION_INVALID"
  | "TRUST_RULE_EVALUATION_INVALID"
  | "GOVERNANCE_RESTRICTIONS_IGNORED"
  | "RESTRICTION_POLICIES_IGNORED"
  | "HIGH_TRUST_NEGATES_UNACCEPTABLE_RISK"
  | "CONFIDENCE_TREATED_AS_TRUST"
  | "TRUST_STANDING_ARBITRARY"
  | "TRUST_STANDING_NONDETERMINISTIC"
  | "AUTONOMY_ELIGIBILITY_INVALID"
  | "TRUST_DECISION_MISSING"
  | "TRUST_DECISION_NONDETERMINISTIC"
  | "TRUST_DECISION_AUTHORIZES_WITHOUT_EVIDENCE"
  | "TRUST_DECISION_VIOLATES_CONSTITUTION"
  | "EXPLANATION_INCOMPLETE"
  | "REPLAY_PACKAGE_INVALID"
  | "OBSERVABILITY_MISSING"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE";

export type TrustEvaluationScenario = "BASELINE" | TrustEvaluationFailure;
export type TrustEvaluationInput = Readonly<{ scenario?: TrustEvaluationScenario; subject_id?: string; tenant_id?: string; trust_domain?: string; trust_boundary?: string }>;
export type EvaluationArchitecture = Readonly<{ architecture_id: string; deterministic: boolean; contracts_defined: boolean; interfaces_defined: boolean; integrity_hash: string }>;
export type EvaluationEvidencePackage = Readonly<{ package_id: string; evidence_refs: readonly string[]; confidence_refs: readonly string[]; risk_refs: readonly string[]; contract_refs: readonly string[]; classification_refs: readonly string[]; governance_refs: readonly string[]; completeness_status: EvidenceCompletenessStatus; integrity_hash: string }>;
export type ConfidenceAssessment = Readonly<{ assessment_id: string; confidence_score: number; uncertainty: number; confidence_validated: boolean; confidence_weighting: string; integrity_hash: string }>;
export type RiskAssessmentIntegration = Readonly<{ assessment_id: string; risk_score: number; risk_level: string; risk_validated: boolean; unacceptable_risk: boolean; integrity_hash: string }>;
export type TrustRuleEvaluationResult = Readonly<{ rule_evaluation_id: string; trust_contracts_valid: boolean; restriction_policies_honored: boolean; trust_boundaries_valid: boolean; trust_domains_valid: boolean; authority_constraints_honored: boolean; constitutional_doctrine_honored: boolean; governance_supremacy_enforced: boolean; integrity_hash: string }>;
export type TrustStandingRecord = Readonly<{ standing_id: string; subject_id: string; standing: TrustStanding; effective_time: string; expiration_time: string; justification: string; restriction_refs: readonly string[]; evidence_refs: readonly string[]; derived_from_evidence: boolean; deterministic: boolean; integrity_hash: string }>;
export type AutonomyEligibilityDecision = Readonly<{ eligibility_id: string; subject_id: string; autonomy_eligible: boolean; authority_class_valid: boolean; autonomy_classification_valid: boolean; standing_restrictions_honored: boolean; governance_constraints_honored: boolean; trust_standing: TrustStanding; confidence_score: number; risk_score: number; decision: "ELIGIBLE" | "ELIGIBLE_WITH_RESTRICTIONS" | "INELIGIBLE" | "FAIL_CLOSED"; integrity_hash: string }>;
export type TrustDecision = Readonly<{ decision_id: string; subject_id: string; evaluation_timestamp: string; trust_domain: string; trust_boundary: string; trust_standing: TrustStanding; confidence_score: number; risk_score: number; autonomy_eligible: boolean; decision: TrustDecisionValue; restriction_refs: readonly string[]; evidence_refs: readonly string[]; explanation_ref: string; replay_ref: string; non_authorizing: boolean; integrity_hash: string }>;
export type EvaluationExplanation = Readonly<{ explanation_id: string; evidence_refs: readonly string[]; rule_trace: readonly string[]; decision_trace: readonly string[]; confidence_trace: readonly string[]; risk_trace: readonly string[]; replay_package_ref: string; complete: boolean; integrity_hash: string }>;
export type EvaluationReplayPackage = Readonly<{ replay_id: string; input_refs: readonly string[]; decision_hash: string; explanation_hash: string; deterministic: boolean; reproducible: boolean; integrity_hash: string }>;
export type EvaluationObservability = Readonly<{ dashboard_id: string; metrics: readonly string[]; monitors_latency: boolean; monitors_rule_failures: boolean; monitors_evidence_freshness: boolean; monitors_confidence_distribution: boolean; monitors_standing_changes: boolean; monitors_decision_statistics: boolean; monitors_replay_success: boolean; integrity_hash: string }>;
export type TrustEvaluationCertification = Readonly<{ certification_id: string; outcome: TrustEvaluationOutcome; phase_ready: boolean; engine_implemented: boolean; deterministic_evaluation_operational: boolean; decisions_replayable_explainable: boolean; standing_deterministic: boolean; autonomy_eligibility_operational: boolean; constitutional_rules_enforced: boolean; governance_restrictions_honored: boolean; fail_closed_verified: boolean; certification_evidence_complete: boolean; failures: readonly TrustEvaluationFailure[]; integrity_hash: string }>;
export type TrustEvaluationResult = Readonly<{ phase_version: "trust-evaluation-engine/v5.7"; phase_identifier: "TrustEvaluationEngine"; trust_architecture_ref: "trust-architecture-alignment-foundation/v5.1"; trust_identity_boundary_ref: "trust-identity-domains-boundaries/v5.2"; trust_restriction_policy_ref: "trust-contracts-restriction-policy/v5.3"; autonomy_classification_ref: "autonomy-classification-framework/v5.4"; trust_evidence_confidence_ref: "trust-evidence-confidence/v5.5"; trust_risk_governance_ref: "trust-risk-governance/v5.6"; architecture: EvaluationArchitecture; evidence_package: EvaluationEvidencePackage; confidence: ConfidenceAssessment; risk: RiskAssessmentIntegration; rules: TrustRuleEvaluationResult; standing: TrustStandingRecord; autonomy_eligibility: AutonomyEligibilityDecision; decision: TrustDecision; explanation: EvaluationExplanation; replay_package: EvaluationReplayPackage; observability: EvaluationObservability; certification: TrustEvaluationCertification; replay_hash: string; integrity_hash: string }>;
export type TrustEvaluationValidation = Readonly<{ valid: boolean; outcome: TrustEvaluationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; evidence_package_valid: boolean; confidence_valid: boolean; risk_valid: boolean; rules_valid: boolean; standing_valid: boolean; autonomy_eligibility_valid: boolean; decision_valid: boolean; explanation_valid: boolean; replay_package_valid: boolean; observability_valid: boolean; certification_valid: boolean; failures: readonly TrustEvaluationFailure[]; integrity_hash: string }>;
export type TrustEvaluationBundle = Readonly<{ doctrine: Readonly<{ version: "trust-evaluation-engine/v5.7"; owns_trust_evaluation: true; owns_trust_decisions: true; owns_trust_standing: true; owns_autonomy_eligibility_evaluation: true; creates_evidence: false; modifies_evidence: false; overrides_governance: false }>; result: TrustEvaluationResult; validation: TrustEvaluationValidation }>;
