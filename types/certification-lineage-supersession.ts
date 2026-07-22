export type BoundaryViolationLifecycleState = "DETECTED" | "CLASSIFIED" | "RECORDED" | "LINKED_TO_REMEDIATION" | "REPLAY_VERIFIED" | "CLOSED";
export type CertificationViolationCategory = "CONSTITUTIONAL" | "GOVERNANCE" | "TENANT_ISOLATION" | "REPLAY" | "DETERMINISM" | "SECURITY" | "DEPENDENCY" | "SCALE" | "RESILIENCE" | "UNKNOWN";
export type SupersessionReason = "REMEDIATION_COMPLETE" | "GOVERNANCE_REQUIRED" | "SPECIFICATION_UPDATE" | "REPLAY_REQUALIFICATION" | "DEPENDENCY_CHANGE" | "ENVIRONMENT_CHANGE";
export type ProductionEscalationStatus = "INCIDENT_DETECTED" | "CONTAINED" | "FORENSICS_COMPLETE" | "GOVERNANCE_REVIEW" | "REMEDIATION_IN_PROGRESS" | "REQUALIFICATION_REQUIRED" | "CERTIFICATION_PENDING" | "CLOSED";
export type CertificationLineageOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationLineageFailure = "DEPENDENCY_GOVERNANCE_NOT_APPROVED" | "VIOLATION_LIFECYCLE_INVALID" | "VIOLATION_MUTABLE" | "REMEDIATION_NOT_TRACEABLE" | "REPLAY_REFERENCES_INCOMPLETE" | "CERTIFICATION_LINKAGE_NON_DETERMINISTIC" | "SUPERSESSION_NON_DETERMINISTIC" | "PREDECESSOR_NOT_REFERENCED" | "HISTORICAL_FAIL_REWRITTEN" | "REPLAY_LINEAGE_INCOMPLETE" | "CERTIFICATION_IDENTITY_MUTATED" | "PRODUCTION_ESCALATION_NOT_GOVERNED" | "CONTAINMENT_AFTER_REMEDIATION" | "FORENSICS_MUTABLE" | "GOVERNANCE_REVIEW_MISSING" | "REQUALIFICATION_REPLAY_MISSING" | "SUCCESSOR_LINEAGE_MISSING" | "AUDIT_OWNERSHIP_MISSING" | "NON_CONSTITUTIONAL_HISTORY_WARNING";
export type CertificationLineageScenario = "BASELINE" | CertificationLineageFailure;

export type CertificationLineageInput = Readonly<{ scenario?: CertificationLineageScenario; tenant_id?: string }>;

export type CertificationLineageContract = Readonly<{
  contract_version: "certification-lineage-supersession/v14.9";
  dependency_governance_ref: string;
  immutable_certification_history: boolean;
  remediation_preserves_history: boolean;
  deterministic_supersession: boolean;
  replay_preservation: boolean;
  audit_ownership: boolean;
  integrity_hash: string;
}>;

export type BoundaryViolationRecord = Readonly<{
  violation_id: string;
  validation_run_id: string;
  scenario_id: string;
  tenant_id: string;
  environment_id: string;
  violation_category: CertificationViolationCategory;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lifecycle_state: BoundaryViolationLifecycleState;
  detected_timestamp: string;
  originating_validation_refs: readonly string[];
  replay_refs: readonly string[];
  remediation_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
}>;

export type CertificationAttemptRecord = Readonly<{
  certification_id: string;
  outcome: "FAIL" | "PASS";
  predecessor_certification_id: string | null;
  violation_refs: readonly string[];
  remediation_refs: readonly string[];
  replay_refs: readonly string[];
  immutable: boolean;
  visible: boolean;
  integrity_hash: string;
}>;

export type RemediationRecord = Readonly<{
  remediation_id: string;
  violation_refs: readonly string[];
  operational_remediation_external: boolean;
  historical_evidence_preserved: boolean;
  replay_validation_ref: string;
  requalification_ref: string;
  integrity_hash: string;
}>;

export type CertificationSupersessionRecord = Readonly<{
  supersession_id: string;
  predecessor_certification_id: string;
  successor_certification_id: string;
  remediation_refs: readonly string[];
  replay_refs: readonly string[];
  supersession_reason: SupersessionReason;
  approval_refs: readonly string[];
  effective_timestamp: string;
  integrity_hash: string;
}>;

export type ProductionEscalationRecord = Readonly<{
  escalation_id: string;
  certification_id: string;
  incident_id: string;
  tenant_id: string;
  production_effect: boolean;
  containment_refs: readonly string[];
  forensic_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_validation_refs: readonly string[];
  remediation_refs: readonly string[];
  requalification_refs: readonly string[];
  successor_certification_refs: readonly string[];
  escalation_status: ProductionEscalationStatus;
  integrity_hash: string;
}>;

export type CertificationLineageGraph = Readonly<{
  graph_id: string;
  nodes: readonly string[];
  edges: readonly string[];
  failed_certifications_visible: boolean;
  successor_preserves_predecessor: boolean;
  replay_trace_complete: boolean;
  integrity_hash: string;
}>;

export type CertificationLineageTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: CertificationLineageOutcome;
  passed: boolean;
  failure_reason: CertificationLineageFailure | null;
  integrity_hash: string;
}>;

export type CertificationLineageResult = Readonly<{
  phase_version: "certification-lineage-supersession/v14.9";
  phase_identifier: "CertificationLineageSupersession";
  dependency_governance_ref: string;
  contract: CertificationLineageContract;
  violations: readonly BoundaryViolationRecord[];
  certification_attempts: readonly CertificationAttemptRecord[];
  remediation: RemediationRecord;
  supersession: CertificationSupersessionRecord;
  production_escalation: ProductionEscalationRecord;
  lineage_graph: CertificationLineageGraph;
  certification_tests: readonly CertificationLineageTest[];
  failures: readonly CertificationLineageFailure[];
  outcome: CertificationLineageOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type CertificationLineageValidation = Readonly<{
  valid: boolean;
  outcome: CertificationLineageOutcome;
  contract_valid: boolean;
  violations_valid: boolean;
  attempts_valid: boolean;
  remediation_valid: boolean;
  supersession_valid: boolean;
  escalation_valid: boolean;
  lineage_valid: boolean;
  certification_valid: boolean;
  failures: readonly CertificationLineageFailure[];
  integrity_hash: string;
}>;

export type CertificationLineageBundle = Readonly<{
  doctrine: Readonly<{
    version: "certification-lineage-supersession/v14.9";
    dependency_governance_phase: "assurance-dependency-governance/v14.8";
    violation_lifecycle: readonly BoundaryViolationLifecycleState[];
    violation_categories: readonly CertificationViolationCategory[];
    supersession_reasons: readonly SupersessionReason[];
    escalation_statuses: readonly ProductionEscalationStatus[];
    certification_outcomes: readonly CertificationLineageOutcome[];
  }>;
  result: CertificationLineageResult;
  validation: CertificationLineageValidation;
}>;
