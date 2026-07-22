export type AssuranceCheckResult = "PASS" | "FAIL";
export type OverallAssuranceResult = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PlatformAssuranceOutcome = "PASS" | "FAIL" | "PRUNED";

export type PlatformAssuranceFailure =
  | "P3_1_DEPENDENCY_INVALID"
  | "P3_2_DEPENDENCY_INVALID"
  | "P3_3_DEPENDENCY_INVALID"
  | "P3_4_DEPENDENCY_INVALID"
  | "P3_5_DEPENDENCY_INVALID"
  | "P3_6_DEPENDENCY_INVALID"
  | "P3_7_DEPENDENCY_INVALID"
  | "P3_8_DEPENDENCY_INVALID"
  | "P3_9_DEPENDENCY_INVALID"
  | "P3_10_DEPENDENCY_INVALID"
  | "P3_11_REPLAY_EVIDENCE_INVALID"
  | "P3_12_DEPENDENCY_INVALID"
  | "P3_13_DEPENDENCY_INVALID"
  | "ASSURANCE_AGGREGATION_INCOMPLETE"
  | "DEPENDENCY_VERIFICATION_FAILED"
  | "GOVERNANCE_VERIFICATION_FAILED"
  | "EVIDENCE_VERIFICATION_FAILED"
  | "REPLAY_EVIDENCE_NOT_CONSUMED"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "REPLAY_ARTIFACT_GENERATED"
  | "EVIDENCE_CORRELATION_INCOMPLETE"
  | "QUALIFICATION_EVIDENCE_INCOMPLETE"
  | "ASSURANCE_REPORT_MISSING"
  | "ASSURANCE_DECISION_MISSING"
  | "FINDINGS_NOT_TRACEABLE"
  | "CERTIFICATION_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type PlatformAssuranceScenario = "BASELINE" | PlatformAssuranceFailure;
export type PlatformAssuranceInput = Readonly<{ scenario?: PlatformAssuranceScenario; tenant_id?: string }>;

export type AssurancePackage = Readonly<{
  package_id: string;
  evidence_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  operational_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  learning_evidence_refs: readonly string[];
  observability_evidence_refs: readonly string[];
  runtime_evidence_refs: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type DependencyVerificationReport = Readonly<{
  report_id: string;
  dependency_refs: readonly string[];
  dependency_versions_valid: boolean;
  interface_compatible: boolean;
  contract_compatible: boolean;
  required_evidence_present: boolean;
  ownership_validated: boolean;
  result: AssuranceCheckResult;
  integrity_hash: string;
}>;

export type GovernanceVerificationReport = Readonly<{
  report_id: string;
  authority_matrix_compliant: boolean;
  approvals_validated: boolean;
  policy_validated: boolean;
  safety_validated: boolean;
  operational_governance_validated: boolean;
  lifecycle_governance_validated: boolean;
  result: AssuranceCheckResult;
  integrity_hash: string;
}>;

export type EvidenceVerificationReport = Readonly<{
  report_id: string;
  complete: boolean;
  integrity_valid: boolean;
  lineage_complete: boolean;
  signatures_present: boolean;
  timestamps_valid: boolean;
  immutable_references: boolean;
  constitutional_ownership_valid: boolean;
  result: AssuranceCheckResult;
  integrity_hash: string;
}>;

export type ReplayAssuranceFindings = Readonly<{
  findings_id: string;
  p3_11_replay_evidence_ref: string;
  replay_evidence_consumed: boolean;
  replay_executed_by_p3_14: boolean;
  replay_artifact_generated_by_p3_14: boolean;
  completeness_valid: boolean;
  determinism_valid: boolean;
  divergence_analysis_valid: boolean;
  replay_lineage_valid: boolean;
  replay_integrity_valid: boolean;
  replay_governance_valid: boolean;
  result: AssuranceCheckResult;
  integrity_hash: string;
}>;

export type EvidenceCorrelationReport = Readonly<{
  correlation_id: string;
  correlated_evidence_refs: readonly string[];
  cross_phase_lineage_complete: boolean;
  findings_traceable: boolean;
  integrity_hash: string;
}>;

export type QualificationEvidence = Readonly<{
  qualification_evidence_id: string;
  assurance_package_ref: string;
  decision_ref: string;
  report_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type AssuranceDecision = Readonly<{
  decision_id: string;
  evaluation_scope: string;
  dependency_result: AssuranceCheckResult;
  governance_result: AssuranceCheckResult;
  evidence_result: AssuranceCheckResult;
  replay_result: AssuranceCheckResult;
  overall_result: OverallAssuranceResult;
  blocking_findings: readonly string[];
  warnings: readonly string[];
  qualification_recommendation: "QUALIFY" | "CONDITIONAL_QUALIFY" | "DO_NOT_QUALIFY";
  evidence_refs: readonly string[];
  generated_timestamp: string;
  integrity_hash: string;
}>;

export type AssuranceReport = Readonly<{
  report_id: string;
  summary: string;
  dependency_report_ref: string;
  governance_report_ref: string;
  evidence_report_ref: string;
  replay_findings_ref: string;
  decision_ref: string;
  generated: boolean;
  traceable: boolean;
  integrity_hash: string;
}>;

export type PlatformAssuranceCertification = Readonly<{
  certification_id: string;
  outcome: PlatformAssuranceOutcome;
  certified: boolean;
  assurance_aggregation_complete: boolean;
  dependency_verification_passed: boolean;
  governance_verification_passed: boolean;
  evidence_verification_passed: boolean;
  replay_evidence_consumed: boolean;
  no_replay_execution_capability: boolean;
  no_replay_artifact_generation: boolean;
  assurance_report_generated: boolean;
  qualification_evidence_complete: boolean;
  assurance_decision_produced: boolean;
  findings_traceable: boolean;
  did_not_certify_platform: boolean;
  failures: readonly PlatformAssuranceFailure[];
  integrity_hash: string;
}>;

export type PlatformAssuranceResult = Readonly<{
  phase_version: "caf-platform-assurance/v3.14";
  phase_identifier: "CafPlatformAssurance";
  agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1";
  capability_composition_ref: "caf-capability-composition/v3.2";
  runtime_orchestration_ref: "caf-runtime-orchestration/v3.3";
  memory_knowledge_ref: "caf-memory-knowledge/v3.4";
  planning_reasoning_ref: "caf-planning-reasoning/v3.5";
  collaboration_federation_ref: "caf-collaboration-federation/v3.6";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8";
  human_operator_interaction_ref: "caf-human-operator-interaction/v3.9";
  observability_telemetry_ref: "caf-observability-telemetry/v3.10";
  behavioral_replay_divergence_ref: "caf-behavioral-replay-divergence/v3.11";
  learning_adaptation_ref: "caf-learning-adaptation/v3.12";
  operations_incident_governance_ref: "caf-operations-incident-governance/v3.13";
  assurance_package: AssurancePackage;
  dependency_report: DependencyVerificationReport;
  governance_report: GovernanceVerificationReport;
  evidence_report: EvidenceVerificationReport;
  replay_findings: ReplayAssuranceFindings;
  evidence_correlation: EvidenceCorrelationReport;
  assurance_decision: AssuranceDecision;
  qualification_evidence: QualificationEvidence;
  assurance_report: AssuranceReport;
  certification: PlatformAssuranceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PlatformAssuranceValidation = Readonly<{
  valid: boolean;
  outcome: PlatformAssuranceOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  package_valid: boolean;
  dependency_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  replay_valid: boolean;
  decision_valid: boolean;
  qualification_valid: boolean;
  report_valid: boolean;
  certification_valid: boolean;
  failures: readonly PlatformAssuranceFailure[];
  integrity_hash: string;
}>;

export type PlatformAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-platform-assurance/v3.14";
    owns_assurance_aggregation: true;
    owns_dependency_verification: true;
    owns_governance_verification: true;
    owns_evidence_verification: true;
    consumes_replay_evidence: true;
    executes_replay: false;
    generates_replay_artifacts: false;
    certifies_platform: false;
  }>;
  result: PlatformAssuranceResult;
  validation: PlatformAssuranceValidation;
}>;
