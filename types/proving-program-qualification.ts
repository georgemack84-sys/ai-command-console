export type ProgramQualificationDecision = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED";
export type QualificationDomain = "CONSTITUTIONAL" | "ARCHITECTURE" | "DETERMINISTIC_PROVING" | "SYNTHETIC_ENVIRONMENT" | "VALIDATION_CAPABILITY" | "CONTINUOUS_PROVING" | "GOVERNANCE" | "SAFETY" | "EXPLAINABILITY" | "HUMAN_OVERSIGHT" | "EVIDENCE" | "READINESS" | "FEDERATION" | "CERTIFICATION_REHEARSAL" | "ECOSYSTEM";
export type QualificationEvidenceCategory = "QUALIFICATION_FINDINGS" | "QUALIFICATION_REPORTS" | "VALIDATION_EVIDENCE" | "PROVING_EVIDENCE" | "GOVERNANCE_EVIDENCE" | "BENCHMARK_EVIDENCE" | "READINESS_EVIDENCE" | "FEDERATION_EVIDENCE" | "LINEAGE_EVIDENCE";
export type ProgramQualificationFailure =
  | "P6_17_FEDERATION_INVALID"
  | "PREVIOUS_PHASE_INCOMPLETE"
  | "REQUIRED_ARTIFACT_MISSING"
  | "CONSTITUTIONAL_QUALIFICATION_FAILED"
  | "ARCHITECTURE_QUALIFICATION_FAILED"
  | "DETERMINISTIC_PROVING_FAILED"
  | "DETERMINISTIC_REPLAY_FAILED"
  | "SIMULATION_CORRECTNESS_FAILED"
  | "SYNTHETIC_ENVIRONMENT_FIDELITY_FAILED"
  | "DIGITAL_TWIN_ACCURACY_FAILED"
  | "VALIDATION_CAPABILITY_FAILED"
  | "ADVERSARIAL_TESTING_CAPABILITY_FAILED"
  | "RESILIENCE_VALIDATION_FAILED"
  | "INTEROPERABILITY_VALIDATION_FAILED"
  | "BENCHMARK_COMPLETENESS_FAILED"
  | "OPERATIONAL_EXERCISE_CAPABILITY_FAILED"
  | "CONTINUOUS_PROVING_FAILED"
  | "REGRESSION_VALIDATION_FAILED"
  | "GOVERNANCE_COMPLIANCE_FAILED"
  | "AUTHORITY_COMPLIANCE_FAILED"
  | "POLICY_ENFORCEMENT_FAILED"
  | "SAFETY_QUALIFICATION_FAILED"
  | "TRUST_QUALIFICATION_FAILED"
  | "EXPLAINABILITY_QUALIFICATION_FAILED"
  | "HUMAN_OVERSIGHT_FAILED"
  | "EVIDENCE_INCOMPLETE"
  | "EVIDENCE_NOT_IMMUTABLE"
  | "LINEAGE_NOT_IMMUTABLE"
  | "TRACEABILITY_INCOMPLETE"
  | "REPRODUCIBILITY_FAILED"
  | "READINESS_QUALIFICATION_FAILED"
  | "OPERATIONAL_READINESS_FAILED"
  | "CONSUMER_READINESS_FAILED"
  | "ECOSYSTEM_READINESS_FAILED"
  | "FEDERATION_QUALIFICATION_FAILED"
  | "CERTIFICATION_REHEARSAL_FAILED"
  | "ECOSYSTEM_QUALIFICATION_FAILED"
  | "CROSS_PROGRAM_VERIFICATION_FAILED"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "INDEPENDENT_QUALIFICATION_VIOLATED"
  | "FINAL_APPROVAL_RECORD_MISSING";
export type ProgramQualificationScenario = "BASELINE" | "CONDITIONALLY_QUALIFIED" | ProgramQualificationFailure;
export type ProgramQualificationInput = Readonly<{ scenario?: ProgramQualificationScenario; seed?: string }>;
export type QualificationDomainReport = Readonly<{ report_id: string; domain: QualificationDomain; verified: boolean; evidence_refs: readonly string[]; findings: readonly string[]; integrity_hash: string }>;
export type QualificationEvidenceLedger = Readonly<{ ledger_id: string; categories: readonly QualificationEvidenceCategory[]; immutable: boolean; lineage_immutable: boolean; reproducible: boolean; complete: boolean; integrity_hash: string }>;
export type QualificationTraceabilityMatrix = Readonly<{ matrix_id: string; domains: readonly QualificationDomain[]; p6_phases: readonly string[]; programs: readonly string[]; evidence_lineage_complete: boolean; independent_qualification: boolean; integrity_hash: string }>;
export type CrossProgramQualificationMatrix = Readonly<{ matrix_id: string; program_1: boolean; program_2: boolean; program_3: boolean; program_4: boolean; program_5: boolean; compatibility_verified: boolean; trust_verified: boolean; safety_verified: boolean; integrity_hash: string }>;
export type ProgramQualificationReport = Readonly<{ report_id: string; domains_verified: number; constitutional_requirements_verified: boolean; proving_authority_verified: boolean; maturity_verified: boolean; certification_readiness_verified: boolean; integrity_hash: string }>;
export type FinalConstitutionalApprovalRecord = Readonly<{ approval_id: string; governance_approved: boolean; authority_granted: boolean; production_ecosystem_use_authorized: boolean; supersession_or_revocation_required_for_change: boolean; integrity_hash: string }>;
export type ProgramQualificationDecisionRecord = Readonly<{ decision_id: string; decision: ProgramQualificationDecision; proving_authority_granted: boolean; production_use_authorized: boolean; restrictions: readonly string[]; rationale: readonly string[]; integrity_hash: string }>;
export type ProgramQualificationGates = Readonly<{ gate_id: string; precondition_gate: boolean; constitutional_gate: boolean; architecture_gate: boolean; deterministic_gate: boolean; validation_gate: boolean; continuous_gate: boolean; governance_gate: boolean; safety_trust_gate: boolean; explainability_oversight_gate: boolean; evidence_gate: boolean; readiness_gate: boolean; federation_gate: boolean; certification_rehearsal_gate: boolean; ecosystem_gate: boolean; approval_gate: boolean; passed: boolean; integrity_hash: string }>;
export type ProgramQualificationReadiness = Readonly<{ readiness_id: string; decision: ProgramQualificationDecision; phase_ready: boolean; qualification_ready: boolean; evidence_ready: boolean; traceability_ready: boolean; cross_program_ready: boolean; final_approval_ready: boolean; gates_passed: boolean; failures: readonly ProgramQualificationFailure[]; integrity_hash: string }>;
export type ProgramQualificationResult = Readonly<{ phase_version: "proving-program-qualification/v6.18"; phase_identifier: "ProvingProgramQualification"; federation_ref: "proving-ecosystem-validation-federation/v6.17"; domain_reports: readonly QualificationDomainReport[]; program_report: ProgramQualificationReport; evidence_ledger: QualificationEvidenceLedger; traceability_matrix: QualificationTraceabilityMatrix; cross_program_matrix: CrossProgramQualificationMatrix; approval_record: FinalConstitutionalApprovalRecord; decision_record: ProgramQualificationDecisionRecord; gates: ProgramQualificationGates; readiness: ProgramQualificationReadiness; replay_hash: string; integrity_hash: string }>;
export type ProgramQualificationValidation = Readonly<{ valid: boolean; decision: ProgramQualificationDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; domain_reports_valid: boolean; program_report_valid: boolean; evidence_ledger_valid: boolean; traceability_valid: boolean; cross_program_valid: boolean; approval_valid: boolean; decision_valid: boolean; gates_valid: boolean; readiness_valid: boolean; failures: readonly ProgramQualificationFailure[]; integrity_hash: string }>;
export type ProgramQualificationBundle = Readonly<{ doctrine: Readonly<{ version: "proving-program-qualification/v6.18"; owns_program_qualification: true; owns_proving_qualification: true; owns_proving_authority_verification: true; owns_qualification_governance: true; owns_qualification_decision: true; creates_no_new_proving_capabilities: true }>; result: ProgramQualificationResult; validation: ProgramQualificationValidation }>;
