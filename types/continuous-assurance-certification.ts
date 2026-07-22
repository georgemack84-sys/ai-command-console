export type ContinuousAssuranceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationLifecycleState = "ACTIVE" | "MONITORING" | "CHANGE_DETECTED" | "ASSURANCE_EVALUATION" | "CERTIFIED" | "RECERTIFICATION_REQUIRED" | "REQUALIFICATION" | "RECERTIFIED" | "CERTIFICATION_INVALID";
export type CertificationStatus = "ACTIVE" | "MONITORING" | "UNDER_REVIEW" | "RECERTIFICATION_REQUIRED" | "RECERTIFICATION_IN_PROGRESS" | "RECERTIFIED" | "SUSPENDED" | "INVALID" | "REVOKED";
export type CertificationHealthState = "HEALTHY" | "DEGRADED" | "REQUIRES_REVIEW" | "RECERTIFICATION_REQUIRED" | "INVALID";
export type EvidenceFreshnessStatus = "CURRENT" | "EXPIRING" | "EXPIRED" | "INVALID" | "SUPERSEDED";
export type DependencyValidationStatus = "VERIFIED" | "REVERIFYING" | "STALE" | "FAILED" | "SUPERSEDED";
export type AssuranceDecision = "CERTIFICATION_VALID" | "CERTIFICATION_DEGRADED" | "RECERTIFICATION_REQUIRED" | "EVIDENCE_STALE" | "DEPENDENCY_INVALID" | "ENVIRONMENT_CHANGED" | "POLICY_OUTDATED" | "MODEL_CHANGED" | "INCIDENT_REVIEW_REQUIRED" | "CERTIFICATION_REVOKED";
export type RecertificationTrigger = "release change" | "dependency change" | "policy change" | "model change" | "environment drift" | "unexplained replay divergence" | "boundary violation" | "tenant isolation violation" | "material incident" | "expired evidence";
export type TriggerSeverity = "INFORMATIONAL" | "REQUIRED" | "CRITICAL" | "EMERGENCY";
export type ContinuousAssuranceFailure = "ASSURANCE_NON_DETERMINISTIC" | "CERTIFICATION_HEALTH_NOT_MONITORED" | "EVIDENCE_FRESHNESS_NOT_ENFORCED" | "EXPIRED_EVIDENCE_ACCEPTED" | "DEPENDENCY_REVERIFICATION_NOT_REPRODUCIBLE" | "MATERIAL_CHANGE_DETECTION_NON_DETERMINISTIC" | "RECERTIFICATION_SCHEDULING_NON_DETERMINISTIC" | "CERTIFICATION_LINEAGE_MUTABLE" | "REPLAY_NOT_REPRODUCIBLE" | "FAIL_CLOSED_NOT_ENFORCED" | "INVALID_CERTIFICATION_ACTIVE" | "LEDGER_NOT_APPEND_ONLY" | "NON_CONSTITUTIONAL_ASSURANCE_WARNING";
export type ContinuousAssuranceScenario = "BASELINE" | ContinuousAssuranceFailure;

export type ContinuousAssuranceInput = Readonly<{ scenario?: ContinuousAssuranceScenario; tenant_id?: string; certification_id?: string }>;

export type ContinuousAssuranceContract = Readonly<{
  contract_version: "continuous-assurance-certification/v15.10";
  lifecycle: readonly CertificationLifecycleState[];
  status_vocabulary: readonly CertificationStatus[];
  decision_vocabulary: readonly AssuranceDecision[];
  continuous_qualification_required: boolean;
  evidence_freshness_required: boolean;
  fail_closed_required: boolean;
  immutable_history_required: boolean;
  deterministic_requalification_required: boolean;
  advisory_boundary_required: boolean;
  integrity_hash: string;
}>;

export type CertificationHealthAssessment = Readonly<{
  health_id: string;
  state: CertificationHealthState;
  evidence_validity_monitored: boolean;
  dependency_integrity_monitored: boolean;
  replay_consistency_monitored: boolean;
  policy_compliance_monitored: boolean;
  qualification_completeness_monitored: boolean;
  certification_age_monitored: boolean;
  outstanding_violations_monitored: boolean;
  pending_recertifications_monitored: boolean;
  invalid_certification_identified: boolean;
  integrity_hash: string;
}>;

export type EvidenceFreshnessEvaluation = Readonly<{
  freshness_id: string;
  status: EvidenceFreshnessStatus;
  evidence_expiration_valid: boolean;
  replay_reproducible: boolean;
  integrity_hashes_valid: boolean;
  signature_validity: boolean;
  lineage_complete: boolean;
  governance_approval_valid: boolean;
  environmental_applicability: boolean;
  expired_evidence_rejected: boolean;
  superseded_evidence_rejected: boolean;
  missing_evidence_invalidates: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DependencyReverificationRecord = Readonly<{
  reverification_id: string;
  status: DependencyValidationStatus;
  specifications_verified: boolean;
  security_controls_verified: boolean;
  compliance_artifacts_verified: boolean;
  external_services_verified: boolean;
  infrastructure_assumptions_verified: boolean;
  trust_anchors_verified: boolean;
  approved_baselines_verified: boolean;
  stale_dependencies_detected: boolean;
  dependent_certifications_invalidated_on_loss: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type RecertificationScheduleRecord = Readonly<{
  schedule_id: string;
  triggers: readonly RecertificationTrigger[];
  trigger_severity: TriggerSeverity;
  certification_scope: readonly string[];
  priority: "MONITOR" | "RECERTIFY" | "IMMEDIATE_CONTAINMENT_AND_RECERTIFICATION" | "FAIL_CLOSED";
  qualification_workflow_ref: string;
  scheduling_lineage_refs: readonly string[];
  deterministic_triggers: boolean;
  reproducible_schedule: boolean;
  governed_prioritization: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationRecord = Readonly<{
  certification_id: string;
  tenant_id: string;
  production_environment_id: string;
  deployment_id: string;
  certification_version: "15.10.0";
  certification_status: CertificationStatus;
  certification_health: CertificationHealthState;
  certification_scope: readonly string[];
  certification_authority: "CONSTITUTIONAL_CERTIFICATION_ENGINE";
  evidence_refs: readonly string[];
  evidence_freshness_status: EvidenceFreshnessStatus;
  dependency_refs: readonly string[];
  dependency_validation_status: DependencyValidationStatus;
  active_trigger_refs: readonly string[];
  health_assessments: readonly string[];
  replay_validation_refs: readonly string[];
  incident_refs: readonly string[];
  certification_date: string;
  expiration_date: string;
  next_review_date: string;
  recertification_due: boolean;
  superseded_by: string | null;
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  approval_refs: readonly string[];
  lineage_refs: readonly string[];
  ledger_refs: readonly string[];
  integrity_hash: string;
}>;

export type ContinuousAssuranceEvaluation = Readonly<{
  evaluation_id: string;
  decision: AssuranceDecision;
  production_changes_evaluated: boolean;
  assurance_assumptions_verified: boolean;
  reevaluation_initiated: boolean;
  deterministic: boolean;
  replayable: boolean;
  qualification_preserved: boolean;
  invalid_certification_blocked: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "CERTIFICATION_EVALUATION" | "HEALTH_ASSESSMENT" | "TRIGGER_EVENT" | "EVIDENCE_UPDATE" | "DEPENDENCY_REVERIFICATION" | "RECERTIFICATION_REQUEST" | "QUALIFICATION_OUTCOME" | "LINEAGE_REFERENCE";
  sequence: number;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  cryptographically_verifiable: boolean;
  integrity_hash: string;
}>;

export type ContinuousAssuranceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ContinuousAssuranceOutcome;
  passed: boolean;
  failure_reason: ContinuousAssuranceFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ContinuousAssuranceResult = Readonly<{
  phase_version: "continuous-assurance-certification/v15.10";
  phase_identifier: "ContinuousAssuranceCertification";
  operational_safety_ref: string;
  contract: ContinuousAssuranceContract;
  evaluation: ContinuousAssuranceEvaluation;
  health: CertificationHealthAssessment;
  freshness: EvidenceFreshnessEvaluation;
  dependency_reverification: DependencyReverificationRecord;
  recertification_schedule: RecertificationScheduleRecord;
  certification_record: ProductionCertificationRecord;
  ledger: readonly ProductionCertificationLedgerEntry[];
  certification_tests: readonly ContinuousAssuranceCertificationTest[];
  failures: readonly ContinuousAssuranceFailure[];
  outcome: ContinuousAssuranceOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ContinuousAssuranceValidation = Readonly<{
  valid: boolean;
  outcome: ContinuousAssuranceOutcome;
  contract_valid: boolean;
  evaluation_valid: boolean;
  health_valid: boolean;
  freshness_valid: boolean;
  dependency_valid: boolean;
  schedule_valid: boolean;
  certification_record_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ContinuousAssuranceFailure[];
  integrity_hash: string;
}>;

export type ContinuousAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    version: "continuous-assurance-certification/v15.10";
    upstream_phase: "operational-safety-incident-response-rollback/v15.9";
    lifecycle: readonly CertificationLifecycleState[];
    health_states: readonly CertificationHealthState[];
    evidence_statuses: readonly EvidenceFreshnessStatus[];
    dependency_states: readonly DependencyValidationStatus[];
    assurance_decisions: readonly AssuranceDecision[];
    certification_outcomes: readonly ContinuousAssuranceOutcome[];
  }>;
  result: ContinuousAssuranceResult;
  validation: ContinuousAssuranceValidation;
}>;
