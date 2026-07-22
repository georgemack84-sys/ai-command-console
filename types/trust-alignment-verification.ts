export type TrustAlignmentVerificationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type AlignmentFinding = "FULLY_ALIGNED" | "SUBSTANTIALLY_ALIGNED" | "PARTIALLY_ALIGNED" | "MISALIGNED" | "CONSTITUTIONALLY_MISALIGNED" | "OBJECTIVE_CONFLICT" | "BEHAVIORAL_DIVERGENCE" | "INSUFFICIENT_EVIDENCE";
export type AlignmentStatus = "ALIGNED" | "ALIGNED_WITH_MONITORING" | "PARTIAL" | "MISALIGNED" | "INSUFFICIENT_EVIDENCE";

export type TrustAlignmentVerificationFailure =
  | "P5_4_AUTONOMY_CLASSIFICATION_INVALID"
  | "P5_5_TRUST_EVIDENCE_INVALID"
  | "P5_6_RISK_MODEL_INVALID"
  | "P5_7_TRUST_DECISION_INVALID"
  | "CONSTITUTIONAL_ALIGNMENT_ENGINE_MISSING"
  | "MISSION_ALIGNMENT_ENGINE_MISSING"
  | "BEHAVIORAL_VERIFICATION_ENGINE_MISSING"
  | "OBJECTIVE_VERIFICATION_ENGINE_MISSING"
  | "ALIGNMENT_EVIDENCE_REGISTRY_MISSING"
  | "ALIGNMENT_FINDINGS_REGISTRY_MISSING"
  | "ALIGNMENT_REPORT_MISSING"
  | "CONSTITUTIONAL_DOCTRINE_OVERRIDDEN"
  | "MISSION_OVERRIDES_CONSTITUTION"
  | "TRUST_DECISION_NOT_PRESERVED"
  | "VERIFICATION_NONDETERMINISTIC"
  | "FINDING_NOT_REPRODUCIBLE"
  | "EVIDENCE_NOT_VERIFIED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "EVIDENCE_MUTABLE"
  | "MISSING_EVIDENCE_TREATED_AS_ALIGNED"
  | "CONSTITUTIONAL_VIOLATION_NOT_MISALIGNED"
  | "TRUST_EVALUATION_DUPLICATED"
  | "AUTONOMY_CLASSIFICATION_REDEFINED"
  | "RISK_COMPUTATION_DUPLICATED"
  | "CERTIFICATION_ISSUED"
  | "CONTINUOUS_ASSESSMENT_MISSING"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustAlignmentVerificationScenario = "BASELINE" | TrustAlignmentVerificationFailure;
export type TrustAlignmentVerificationInput = Readonly<{ scenario?: TrustAlignmentVerificationScenario; trust_subject_id?: string; mission_id?: string; verification_scope?: string }>;
export type AlignmentEvidenceRecord = Readonly<{ evidence_id: string; evidence_type: "ALIGNMENT" | "VERIFICATION" | "BEHAVIORAL" | "CONSTITUTIONAL" | "MISSION"; source_ref: string; immutable: boolean; verified: boolean; lineage_refs: readonly string[]; trust_decision_refs: readonly string[]; timestamp: string; integrity_hash: string }>;
export type BehavioralVerificationRecord = Readonly<{ behavior_id: string; expected_behavior: string; observed_behavior: string; divergence_detected: boolean; divergence_summary: string; evidence_refs: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type MissionAlignmentRecord = Readonly<{ mission_id: string; objectives: readonly string[]; observed_outcomes: readonly string[]; alignment_status: AlignmentStatus; deviations: readonly string[]; evidence_refs: readonly string[]; constitutional_subordinate: boolean; integrity_hash: string }>;
export type ConstitutionalAlignmentRecord = Readonly<{ constitutional_requirements: readonly string[]; validated_requirements: readonly string[]; violated_requirements: readonly string[]; authority_validation: boolean; governance_validation: boolean; evidence_refs: readonly string[]; doctrine_supreme: boolean; integrity_hash: string }>;
export type ObjectiveVerificationRecord = Readonly<{ objective_id: string; objectives_completed: readonly string[]; objective_conflicts: readonly string[]; objective_drift_detected: boolean; prioritization_valid: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type AlignmentRecord = Readonly<{ alignment_id: string; trust_subject_id: string; verification_scope: string; constitutional_alignment: AlignmentStatus; mission_alignment: AlignmentStatus; behavioral_alignment: AlignmentStatus; objective_alignment: AlignmentStatus; evidence_refs: readonly string[]; findings: readonly AlignmentFinding[]; verification_timestamp: string; integrity_hash: string }>;
export type AlignmentRegistry = Readonly<{ registry_id: string; evidence_records: readonly AlignmentEvidenceRecord[]; finding_records: readonly AlignmentFinding[]; operational: boolean; integrity_hash: string }>;
export type AlignmentDecisionEngine = Readonly<{ engine_id: string; workflow_steps: readonly string[]; deterministic: boolean; evidence_based: boolean; preserves_trust_decisions: boolean; independent_of_trust_evaluation: boolean; integrity_hash: string }>;
export type AlignmentReport = Readonly<{ report_id: string; summaries: readonly string[]; detailed_findings: readonly AlignmentFinding[]; deviations: readonly string[]; recommendations: readonly string[]; supporting_evidence: readonly string[]; explainable: boolean; reproducible: boolean; integrity_hash: string }>;
export type ContinuousAlignmentAssessment = Readonly<{ assessment_id: string; supported: boolean; reassesses_on_new_evidence: boolean; monitors_deviation: boolean; preserves_lineage: boolean; integrity_hash: string }>;
export type AlignmentGovernance = Readonly<{ governance_id: string; constitutional_supremacy: boolean; mission_subordinate: boolean; missing_evidence_fails_closed: boolean; evidence_immutable: boolean; no_certification_issuance: boolean; no_policy_enforcement: boolean; integrity_hash: string }>;
export type TrustAlignmentVerificationCertification = Readonly<{ certification_id: string; outcome: TrustAlignmentVerificationOutcome; phase_ready: boolean; constitutional_alignment_implemented: boolean; mission_alignment_operational: boolean; behavioral_verification_deterministic_evidence_based: boolean; objective_verification_conflicts_detected: boolean; findings_reproducible: boolean; evidence_lineage_preserved: boolean; reports_generated: boolean; continuous_assessment_supported: boolean; invariants_valid: boolean; integrates_p5_4_to_p5_7: boolean; failures: readonly TrustAlignmentVerificationFailure[]; integrity_hash: string }>;
export type TrustAlignmentVerificationResult = Readonly<{ phase_version: "trust-alignment-verification/v5.8"; phase_identifier: "TrustAlignmentVerification"; autonomy_classification_ref: "autonomy-classification-framework/v5.4"; trust_evidence_confidence_ref: "trust-evidence-confidence/v5.5"; trust_risk_governance_ref: "trust-risk-governance/v5.6"; trust_evaluation_engine_ref: "trust-evaluation-engine/v5.7"; registry: AlignmentRegistry; constitutional: ConstitutionalAlignmentRecord; mission: MissionAlignmentRecord; behavioral: BehavioralVerificationRecord; objective: ObjectiveVerificationRecord; alignment: AlignmentRecord; engine: AlignmentDecisionEngine; report: AlignmentReport; continuous: ContinuousAlignmentAssessment; governance: AlignmentGovernance; certification: TrustAlignmentVerificationCertification; replay_hash: string; integrity_hash: string }>;
export type TrustAlignmentVerificationValidation = Readonly<{ valid: boolean; outcome: TrustAlignmentVerificationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; registry_valid: boolean; constitutional_valid: boolean; mission_valid: boolean; behavioral_valid: boolean; objective_valid: boolean; alignment_valid: boolean; engine_valid: boolean; report_valid: boolean; continuous_valid: boolean; governance_valid: boolean; certification_valid: boolean; failures: readonly TrustAlignmentVerificationFailure[]; integrity_hash: string }>;
export type TrustAlignmentVerificationBundle = Readonly<{ doctrine: Readonly<{ version: "trust-alignment-verification/v5.8"; owns_alignment_verification: true; owns_behavioral_verification: true; owns_objective_verification: true; owns_mission_alignment: true; owns_constitutional_alignment: true; owns_trust_evaluation: false; classifies_autonomy: false; computes_risk: false; issues_certification: false }>; result: TrustAlignmentVerificationResult; validation: TrustAlignmentVerificationValidation }>;
