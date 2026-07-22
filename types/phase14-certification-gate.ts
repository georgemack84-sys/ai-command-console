export type Phase14CertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type Phase14CertificationLifecycleState = "REGISTERED" | "EVIDENCE_AGGREGATED" | "DEPENDENCY_VALIDATED" | "LINEAGE_VALIDATED" | "REPLAY_VALIDATED" | "GOVERNANCE_VALIDATED" | "OPERATIONS_VALIDATED" | "DECIDED" | "CERTIFIED" | "BLOCKED";
export type Phase14Capability = "Synthetic Validation Foundation" | "Environment Architecture" | "Synthetic Identity Generation" | "Scenario Orchestration" | "Tenant Isolation Validation" | "Advisory Boundary Validation" | "Scale & Resilience Validation" | "Assurance Dependency Governance" | "Certification Lineage" | "Replay & Integrity" | "Operational Monitoring";
export type Phase14EvidenceCategory = "VALIDATION" | "DEPENDENCY" | "LINEAGE" | "REPLAY" | "INTEGRITY" | "EXPLAINABILITY" | "GOVERNANCE" | "TENANT_ISOLATION" | "ADVISORY_BOUNDARY" | "OPERATIONS";
export type Phase14CertificationFailure = "SYNTHETIC_VALIDATION_CONTRACT_INVALID" | "ENVIRONMENT_QUALIFICATION_NON_DETERMINISTIC" | "SYNTHETIC_IDENTITY_NOT_REPRODUCIBLE" | "TENANT_ISOLATION_NOT_ENFORCED" | "ADVISORY_BOUNDARY_NOT_ENFORCED" | "BOUNDARY_VIOLATIONS_MUTABLE" | "CANDIDATE_DEPENDENCY_REGISTER_UNGOVERNED" | "CANDIDATE_MANIFEST_ARTIFACTS_NOT_DISTINCT" | "DEPENDENCY_PROMOTION_LINEAGE_LOST" | "MANIFEST_AUTHORITY_NON_DETERMINISTIC" | "PHASE_13_DEPENDENCY_GATE_NOT_ENFORCED" | "UNVERIFIED_DEPENDENCY_SATISFIED_CERTIFICATION" | "CERTIFICATION_LINEAGE_MUTABLE" | "FAILED_CERTIFICATION_NOT_PRESERVED" | "SUCCESSOR_CERTIFICATION_MISSING_PREDECESSOR" | "PRODUCTION_EFFECT_ESCALATION_NOT_ENFORCED" | "REPLAY_NON_DETERMINISTIC" | "INTEGRITY_NOT_VERIFIED" | "EXPLAINABILITY_NOT_REPRODUCIBLE" | "OPERATIONAL_MONITORING_INCOMPLETE" | "NON_CONSTITUTIONAL_CERTIFICATION_WARNING";
export type Phase14CertificationScenario = "BASELINE" | Phase14CertificationFailure;

export type Phase14CertificationInput = Readonly<{ scenario?: Phase14CertificationScenario; tenant_id?: string }>;

export type Phase14CertificationContract = Readonly<{
  contract_version: "phase14-certification-gate/v14.12";
  certification_authority: "CONSTITUTIONAL_CERTIFICATION_ENGINE";
  lifecycle: readonly Phase14CertificationLifecycleState[];
  certification_scope: readonly Phase14Capability[];
  required_evidence: readonly Phase14EvidenceCategory[];
  dependency_requirements_enforced: boolean;
  replay_required: boolean;
  governance_required: boolean;
  advisory_only: boolean;
  execution_authority: false;
  integrity_hash: string;
}>;

export type Phase14EvidenceBinder = Readonly<{
  binder_id: string;
  tenant_id: string;
  evidence_refs: readonly string[];
  validation_refs: readonly string[];
  dependency_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  explainability_refs: readonly string[];
  governance_refs: readonly string[];
  operational_refs: readonly string[];
  deterministic_ordering: boolean;
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type Phase14DependencyCertification = Readonly<{
  validation_id: string;
  verified_compatible_manifest_refs: readonly string[];
  candidate_dependency_refs: readonly string[];
  candidates_excluded_from_certification: boolean;
  manifest_authority_deterministic: boolean;
  phase_13_gate_enforced: boolean;
  unverified_dependencies_blocked: boolean;
  promotion_lineage_preserved: boolean;
  dependency_gate_result: Phase14CertificationOutcome;
  integrity_hash: string;
}>;

export type Phase14LineageCertification = Readonly<{
  validation_id: string;
  certification_lineage_refs: readonly string[];
  predecessor_certification_refs: readonly string[];
  remediation_refs: readonly string[];
  production_effect_refs: readonly string[];
  failed_certifications_visible: boolean;
  successor_references_predecessor: boolean;
  immutable_history: boolean;
  replay_refs_preserved: boolean;
  integrity_hash: string;
}>;

export type Phase14ReplayCertification = Readonly<{
  validation_id: string;
  replay_validation_refs: readonly string[];
  integrity_validation_refs: readonly string[];
  explainability_refs: readonly string[];
  deterministic_replay: boolean;
  integrity_verified: boolean;
  explainability_reproducible: boolean;
  certification_decision_replayable: boolean;
  integrity_hash: string;
}>;

export type Phase14GovernanceCertification = Readonly<{
  validation_id: string;
  governance_validation_refs: readonly string[];
  tenant_isolation_refs: readonly string[];
  advisory_boundary_refs: readonly string[];
  constitutional_compliance: boolean;
  governance_enforced: boolean;
  tenant_isolation_enforced: boolean;
  advisory_only_enforced: boolean;
  execution_authority_prohibited: boolean;
  integrity_hash: string;
}>;

export type Phase14OperationalReadiness = Readonly<{
  validation_id: string;
  operational_monitoring_refs: readonly string[];
  dashboard_complete: boolean;
  alerts_configured: boolean;
  runbooks_complete: boolean;
  replay_monitoring_complete: boolean;
  dependency_monitoring_complete: boolean;
  certification_monitoring_complete: boolean;
  readiness_verified: boolean;
  integrity_hash: string;
}>;

export type Phase14CertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: Phase14CertificationOutcome;
  passed: boolean;
  failure_reason: Phase14CertificationFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type Phase14CertificationRecord = Readonly<{
  certification_id: string;
  certification_version: "phase14-certification-gate/v14.12";
  phase_version: "Phase 14";
  certification_timestamp: string;
  certification_outcome: Phase14CertificationOutcome;
  certification_scope: readonly Phase14Capability[];
  validation_summary: readonly string[];
  dependency_manifest_refs: readonly string[];
  dependency_gate_result: Phase14CertificationOutcome;
  replay_validation_refs: readonly string[];
  integrity_validation_refs: readonly string[];
  explainability_refs: readonly string[];
  governance_validation_refs: readonly string[];
  tenant_isolation_refs: readonly string[];
  advisory_boundary_refs: readonly string[];
  certification_lineage_refs: readonly string[];
  predecessor_certification_refs: readonly string[];
  remediation_refs: readonly string[];
  production_effect_refs: readonly string[];
  operational_monitoring_refs: readonly string[];
  evidence_bundle_refs: readonly string[];
  certification_decision: Phase14CertificationOutcome;
  certification_reasoning: string;
  certification_conditions: readonly string[];
  integrity_hash: string;
}>;

export type Phase14CertificationResult = Readonly<{
  phase_version: "phase14-certification-gate/v14.12";
  phase_identifier: "Phase14CertificationGate";
  contract: Phase14CertificationContract;
  evidence_binder: Phase14EvidenceBinder;
  dependency_certification: Phase14DependencyCertification;
  lineage_certification: Phase14LineageCertification;
  replay_certification: Phase14ReplayCertification;
  governance_certification: Phase14GovernanceCertification;
  operational_readiness: Phase14OperationalReadiness;
  certification_tests: readonly Phase14CertificationTest[];
  certification_record: Phase14CertificationRecord;
  failures: readonly Phase14CertificationFailure[];
  outcome: Phase14CertificationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type Phase14CertificationValidation = Readonly<{
  valid: boolean;
  outcome: Phase14CertificationOutcome;
  contract_valid: boolean;
  evidence_valid: boolean;
  dependency_valid: boolean;
  lineage_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  operations_valid: boolean;
  certification_valid: boolean;
  record_valid: boolean;
  failures: readonly Phase14CertificationFailure[];
  integrity_hash: string;
}>;

export type Phase14CertificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "phase14-certification-gate/v14.12";
    scope: readonly Phase14Capability[];
    evidence_categories: readonly Phase14EvidenceCategory[];
    lifecycle: readonly Phase14CertificationLifecycleState[];
    certification_outcomes: readonly Phase14CertificationOutcome[];
  }>;
  result: Phase14CertificationResult;
  validation: Phase14CertificationValidation;
}>;
