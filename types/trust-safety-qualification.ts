export type TrustSafetyQualificationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type SafetyQualificationResult = "QUALIFIED" | "QUALIFIED_WITH_RESTRICTIONS" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type SafetyFindingSeverity = "INFO" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type SafetyEvidenceStatus = "COMPLETE" | "MISSING" | "STALE" | "CONFLICTING" | "UNVERIFIABLE";

export type TrustSafetyQualificationFailure =
  | "P5_9_COMPLIANCE_INVALID"
  | "PROGRAM_3_SAFETY_EVIDENCE_MISSING"
  | "SAFETY_QUALIFICATION_ARCHITECTURE_MISSING"
  | "SAFETY_VOCABULARY_MISSING"
  | "EVIDENCE_ASSESSMENT_INCOMPLETE"
  | "SAFETY_EVIDENCE_INAUTHENTIC"
  | "SAFETY_EVIDENCE_INCOMPLETE"
  | "SAFETY_EVIDENCE_NONDETERMINISTIC"
  | "SAFETY_EVIDENCE_NOT_REPRODUCIBLE"
  | "SAFETY_EVIDENCE_NOT_REPLAYABLE"
  | "SAFETY_EVIDENCE_MUTABLE"
  | "TRUST_SAFETY_ASSESSMENT_INCOMPLETE"
  | "AUTONOMY_SAFETY_ASSESSMENT_INCOMPLETE"
  | "MISSION_SAFETY_ASSESSMENT_INCOMPLETE"
  | "GOVERNANCE_SAFETY_ASSESSMENT_INCOMPLETE"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "AUTHORITY_COMPLIANCE_INVALID"
  | "POLICY_COMPLIANCE_INVALID"
  | "GOVERNANCE_COMPLIANCE_INVALID"
  | "FAIL_CLOSED_INVALID"
  | "QUALIFICATION_DECISION_NONDETERMINISTIC"
  | "MISSING_EVIDENCE_QUALIFIED"
  | "STALE_EVIDENCE_QUALIFIED"
  | "CONFLICTING_EVIDENCE_QUALIFIED"
  | "UNVERIFIABLE_EVIDENCE_QUALIFIED"
  | "SAFETY_FINDINGS_MISSING"
  | "QUALIFICATION_REPORT_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "OBSERVABILITY_MISSING"
  | "GOVERNANCE_INTEGRATION_MISSING"
  | "RUNTIME_SAFETY_ENFORCEMENT_EXECUTED"
  | "SAFETY_POLICY_EXECUTED"
  | "SAFETY_EVIDENCE_GENERATED"
  | "OPERATIONAL_MONITORING_OWNED"
  | "CERTIFICATION_GATE_INCOMPLETE"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustSafetyQualificationScenario = "BASELINE" | TrustSafetyQualificationFailure;
export type TrustSafetyQualificationInput = Readonly<{ scenario?: TrustSafetyQualificationScenario; trust_domain_id?: string; autonomy_classification?: string; safety_scope?: string }>;
export type SafetyEvidenceAssessment = Readonly<{ assessment_id: string; evidence_status: SafetyEvidenceStatus; evidence_refs: readonly string[]; authentic: boolean; complete: boolean; deterministic: boolean; reproducible: boolean; replayable: boolean; immutable: boolean; traceable: boolean; quality_score: number; integrity_hash: string }>;
export type TrustSafetyAssessment = Readonly<{ assessment_id: string; trust_safety: boolean; autonomy_safety: boolean; mission_safety: boolean; governance_safety: boolean; authority_boundaries: boolean; operational_boundaries: boolean; mission_boundaries: boolean; constitutional_boundaries: boolean; trust_boundaries: boolean; integrity_hash: string }>;
export type ConstitutionalSafetyCompliance = Readonly<{ compliance_id: string; constitutional_validation: boolean; authority_validation: boolean; policy_validation: boolean; governance_validation: boolean; fail_closed_behavior: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type SafetyFinding = Readonly<{ finding_id: string; qualification_id: string; finding_category: string; severity: SafetyFindingSeverity; affected_scope: string; supporting_evidence: readonly string[]; constitutional_reference: string; recommended_action: string; integrity_hash: string }>;
export type SafetyQualificationRecord = Readonly<{ qualification_id: string; trust_domain_id: string; autonomy_classification: string; safety_scope: string; evidence_references: readonly string[]; constitutional_validation: boolean; authority_validation: boolean; policy_validation: boolean; governance_validation: boolean; safety_assessment: string; qualification_result: SafetyQualificationResult; findings: readonly SafetyFinding[]; evaluator: "P5.10 Safety Qualification"; evaluation_timestamp: string; integrity_hash: string }>;
export type SafetyQualificationReport = Readonly<{ report_id: string; qualification_scope: string; evaluated_entities: readonly string[]; evidence_summary: string; constitutional_summary: string; safety_summary: string; qualification_result: SafetyQualificationResult; findings: readonly string[]; recommendations: readonly string[]; lineage_reference: string; integrity_hash: string }>;
export type SafetyQualificationLineage = Readonly<{ lineage_id: string; evidence_lineage: readonly string[]; report_lineage: readonly string[]; qualification_lineage: readonly string[]; complete: boolean; deterministic_replay_refs: readonly string[]; integrity_hash: string }>;
export type SafetyQualificationObservability = Readonly<{ dashboard_id: string; metrics: readonly string[]; monitors_qualification: boolean; monitors_evaluation: boolean; monitors_evidence: boolean; monitors_constitutional: boolean; integrity_hash: string }>;
export type SafetyQualificationGovernance = Readonly<{ governance_id: string; constitutional_governance_integrated: boolean; trust_governance_integrated: boolean; qualification_governance_integrated: boolean; runtime_enforcement_executed: boolean; policy_execution_executed: boolean; evidence_generated: boolean; operational_monitoring_owned: boolean; integrity_hash: string }>;
export type SafetyQualificationCertificationGate = Readonly<{ gate_id: string; program_3_safety_evidence_consumed: boolean; trust_safety_evaluation_completed: boolean; autonomy_safety_evaluation_completed: boolean; constitutional_compliance_verified: boolean; authority_compliance_verified: boolean; policy_compliance_verified: boolean; governance_compliance_verified: boolean; deterministic_results_produced: boolean; evidence_lineage_preserved: boolean; reports_generated: boolean; findings_replayable: boolean; fail_closed_demonstrated: boolean; integrity_hash: string }>;
export type TrustSafetyQualificationCertification = Readonly<{ certification_id: string; outcome: TrustSafetyQualificationOutcome; phase_ready: boolean; evidence_consumed: boolean; trust_safety_completed: boolean; autonomy_safety_completed: boolean; constitutional_compliance_verified: boolean; authority_compliance_verified: boolean; policy_compliance_verified: boolean; governance_compliance_verified: boolean; deterministic_qualification: boolean; lineage_preserved: boolean; reports_generated: boolean; findings_replayable: boolean; fail_closed_verified: boolean; boundary_respected: boolean; failures: readonly TrustSafetyQualificationFailure[]; integrity_hash: string }>;
export type TrustSafetyQualificationResult = Readonly<{ phase_version: "trust-safety-qualification/v5.10"; phase_identifier: "TrustSafetyQualification"; trust_compliance_ref: "trust-compliance-verification/v5.9"; evidence: SafetyEvidenceAssessment; safety: TrustSafetyAssessment; compliance: ConstitutionalSafetyCompliance; qualification: SafetyQualificationRecord; report: SafetyQualificationReport; lineage: SafetyQualificationLineage; observability: SafetyQualificationObservability; governance: SafetyQualificationGovernance; gate: SafetyQualificationCertificationGate; certification: TrustSafetyQualificationCertification; replay_hash: string; integrity_hash: string }>;
export type TrustSafetyQualificationValidation = Readonly<{ valid: boolean; outcome: TrustSafetyQualificationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; evidence_valid: boolean; safety_valid: boolean; compliance_valid: boolean; qualification_valid: boolean; report_valid: boolean; lineage_valid: boolean; observability_valid: boolean; governance_valid: boolean; gate_valid: boolean; certification_valid: boolean; failures: readonly TrustSafetyQualificationFailure[]; integrity_hash: string }>;
export type TrustSafetyQualificationBundle = Readonly<{ doctrine: Readonly<{ version: "trust-safety-qualification/v5.10"; owns_trust_safety: true; owns_autonomy_safety: true; owns_safety_qualification: true; executes_runtime_safety_enforcement: false; executes_safety_policy: false; generates_safety_evidence: false; owns_operational_safety_monitoring: false }>; result: TrustSafetyQualificationResult; validation: TrustSafetyQualificationValidation }>;
