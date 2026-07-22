export type RehearsalOutcome = "PASS" | "PASS_WITH_FINDINGS" | "CONDITIONAL_PASS" | "FAIL" | "REHEARSAL_INCOMPLETE";
export type ReadinessLevel = "NOT_READY" | "PARTIALLY_READY" | "CONDITIONALLY_READY" | "READY" | "REHEARSAL_COMPLETE";
export type RehearsalFailure =
  | "P6_11_OPERATIONAL_EXERCISE_INVALID"
  | "CERTIFICATION_REHEARSAL_ENGINE_MISSING"
  | "QUALIFICATION_REHEARSAL_ENGINE_MISSING"
  | "EVIDENCE_REHEARSAL_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "EVIDENCE_INVALID"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "EVIDENCE_SIGNATURE_INVALID"
  | "EVIDENCE_TIMESTAMP_INVALID"
  | "EVIDENCE_NOT_REPLAYABLE"
  | "EVIDENCE_NONDETERMINISTIC"
  | "EVIDENCE_MUTATED"
  | "GOVERNANCE_REHEARSAL_MISSING"
  | "GOVERNANCE_FAILURE"
  | "GOVERNANCE_DECISION_UNSUPPORTED"
  | "PACKAGE_VALIDATION_MISSING"
  | "QUALIFICATION_PACKAGE_INCOMPLETE"
  | "CERTIFICATION_PACKAGE_INCOMPLETE"
  | "DEPENDENCY_VALIDATION_FAILED"
  | "PACKAGE_CONSISTENCY_FAILED"
  | "ASSESSOR_READINESS_MISSING"
  | "ASSESSOR_FAILURE"
  | "OPERATIONAL_READINESS_MISSING"
  | "OPERATIONAL_FAILURE"
  | "REPORT_GENERATION_MISSING"
  | "DOCUMENTATION_FAILURE"
  | "UNRESOLVED_CRITICAL_FINDINGS"
  | "UNRESOLVED_FAIL_CLOSED_CONDITION"
  | "READINESS_DECLARED_AFTER_CONDITIONAL_PASS"
  | "CERTIFICATION_DECISION_ATTEMPTED"
  | "APPLICATION_CERTIFICATION_ATTEMPTED"
  | "PLATFORM_CERTIFICATION_ATTEMPTED"
  | "PROGRAM_QUALIFICATION_ATTEMPTED"
  | "OPERATIONAL_CERTIFICATION_ATTEMPTED"
  | "TRUST_CERTIFICATION_ATTEMPTED"
  | "PRODUCTION_READINESS_ATTEMPTED";
export type RehearsalScenario = "BASELINE" | "PASS_WITH_FINDINGS" | "CONDITIONAL_REMEDIATION" | RehearsalFailure;
export type RehearsalInput = Readonly<{ scenario?: RehearsalScenario; seed?: string }>;
export type RehearsalReport = Readonly<{ report_id: string; outcome: RehearsalOutcome; exercises_complete: boolean; evidence_submission: boolean; assessor_workflow: boolean; governance_review: boolean; verification: boolean; decision_documentation: boolean; report_generated: boolean; findings: readonly string[]; integrity_hash: string }>;
export type EvidenceReadinessReport = Readonly<{ report_id: string; evidence_complete: boolean; lineage_complete: boolean; signatures_verified: boolean; timestamps_verified: boolean; replayable: boolean; deterministic: boolean; immutable: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type GovernanceRehearsalReport = Readonly<{ report_id: string; approvals: boolean; constitutional_review: boolean; policy_review: boolean; authority_review: boolean; exception_handling: boolean; escalation: boolean; rejection_workflows: boolean; auditable_decisions: boolean; integrity_hash: string }>;
export type PackageValidationReport = Readonly<{ report_id: string; qualification_package_complete: boolean; certification_package_complete: boolean; consistency_verified: boolean; dependency_verified: boolean; lineage_verified: boolean; evidence_references_verified: boolean; signatures_verified: boolean; integrity_hash: string }>;
export type AssessorReadinessReport = Readonly<{ report_id: string; review_workflow: boolean; evidence_inspection: boolean; replay_execution: boolean; governance_interpretation: boolean; report_generation: boolean; ready: boolean; integrity_hash: string }>;
export type OperationalReadinessReport = Readonly<{ report_id: string; operators_ready: boolean; governance_boards_ready: boolean; certification_authorities_ready: boolean; qualification_authorities_ready: boolean; audit_personnel_ready: boolean; ready: boolean; integrity_hash: string }>;
export type ReadinessDashboard = Readonly<{ dashboard_id: string; readiness_level: ReadinessLevel; deficiencies: readonly string[]; blockers: readonly string[]; rehearsal_progress: number; qualification_readiness: boolean; certification_readiness: boolean; integrity_hash: string }>;
export type FinalRehearsalReport = Readonly<{ report_id: string; final_report_generated: boolean; executive_summary: boolean; readiness_summary: boolean; observations: readonly string[]; recommendations: readonly string[]; unresolved_issues: readonly string[]; integrity_hash: string }>;
export type RehearsalEvidence = Readonly<{ evidence_id: string; certification_evidence: readonly string[]; qualification_evidence: readonly string[]; governance_evidence: readonly string[]; replay_evidence: readonly string[]; operational_evidence: readonly string[]; integration_evidence: readonly string[]; performance_evidence: readonly string[]; recovery_evidence: readonly string[]; exercise_evidence: readonly string[]; audit_evidence: readonly string[]; readiness_evidence: readonly string[]; immutable: boolean; deterministic: boolean; replayable: boolean; lineage_complete: boolean; integrity_hash: string }>;
export type RehearsalGates = Readonly<{ gate_id: string; evidence_completeness: boolean; deterministic_replay: boolean; governance_readiness: boolean; cross_program_dependencies: boolean; readiness_authorization: boolean; passed: boolean; integrity_hash: string }>;
export type RehearsalBoundaries = Readonly<{ boundary_id: string; owns_certification_decisions: false; owns_application_certification: false; owns_platform_certification: false; owns_program_qualification: false; owns_operational_certification: false; owns_trust_certification: false; owns_production_readiness: false; integrity_hash: string }>;
export type RehearsalReadiness = Readonly<{ readiness_id: string; level: ReadinessLevel; outcome: RehearsalOutcome; phase_ready: boolean; certification_ready: boolean; qualification_ready: boolean; evidence_ready: boolean; governance_ready: boolean; assessor_ready: boolean; operational_ready: boolean; packages_ready: boolean; reports_ready: boolean; gates_passed: boolean; boundaries_respected: boolean; failures: readonly RehearsalFailure[]; integrity_hash: string }>;
export type RehearsalResult = Readonly<{ phase_version: "proving-certification-rehearsal-qualification-preparation/v6.12"; phase_identifier: "ProvingCertificationRehearsalQualificationPreparation"; operational_exercise_ref: "proving-operational-exercise-framework/v6.11"; certification_rehearsal: RehearsalReport; qualification_rehearsal: RehearsalReport; evidence_report: EvidenceReadinessReport; governance_report: GovernanceRehearsalReport; package_report: PackageValidationReport; assessor_report: AssessorReadinessReport; operational_report: OperationalReadinessReport; dashboard: ReadinessDashboard; final_report: FinalRehearsalReport; evidence: RehearsalEvidence; gates: RehearsalGates; boundaries: RehearsalBoundaries; readiness: RehearsalReadiness; replay_hash: string; integrity_hash: string }>;
export type RehearsalValidation = Readonly<{ valid: boolean; outcome: RehearsalOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; certification_valid: boolean; qualification_valid: boolean; evidence_valid: boolean; governance_valid: boolean; package_valid: boolean; assessor_valid: boolean; operational_valid: boolean; dashboard_valid: boolean; final_report_valid: boolean; gates_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly RehearsalFailure[]; integrity_hash: string }>;
export type RehearsalBundle = Readonly<{ doctrine: Readonly<{ version: "proving-certification-rehearsal-qualification-preparation/v6.12"; owns_certification_rehearsal: true; owns_qualification_rehearsal: true; owns_evidence_rehearsal: true; owns_governance_rehearsal: true; owns_certification_decisions: false; owns_application_certification: false; owns_platform_certification: false; owns_program_qualification: false; owns_operational_certification: false; owns_trust_certification: false; owns_production_readiness: false }>; result: RehearsalResult; validation: RehearsalValidation }>;
