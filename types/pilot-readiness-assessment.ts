export type PilotReadinessAssessmentOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReadinessCategory = "OPERATIONAL_READINESS" | "GOVERNANCE_READINESS" | "REPLAY_READINESS" | "ADVISORY_READINESS" | "CERTIFICATION_READINESS";
export type ReadinessAssessmentOutcome = "READY_FOR_CERTIFICATION" | "READY_WITH_MONITORING" | "IMPROVEMENT_REQUIRED" | "GOVERNANCE_REVIEW_REQUIRED" | "PILOT_SCOPE_RESTRICTION_REQUIRED" | "CERTIFICATION_BLOCKED";
export type ReadinessDecision = "MONITOR" | "IMPROVEMENT_REQUIRED" | "GOVERNANCE_REVIEW" | "PILOT_LIMITED" | "READY_FOR_CERTIFICATION";
export type PilotReadinessAssessmentFailure = "READINESS_NOT_MEASURABLE" | "DEFICIENCIES_NOT_IDENTIFIED" | "COMPLIANCE_NOT_VALIDATED" | "READINESS_SCORING_NON_DETERMINISTIC" | "ASSESSMENTS_NOT_REPLAYABLE" | "READINESS_EVIDENCE_MUTABLE" | "CERTIFICATION_READINESS_NOT_VISIBLE" | "GOVERNANCE_REVIEW_NOT_SUPPORTED" | "CONSTITUTIONAL_REQUIREMENTS_OVERRIDDEN" | "PARALLEL_READINESS_INFRASTRUCTURE_CREATED" | "OPERATIONAL_AUTHORITY_GRANTED" | "PHASE_16_8_INCIDENTS_NOT_VALID" | "NON_CONSTITUTIONAL_READINESS_WARNING";
export type PilotReadinessAssessmentScenario = "BASELINE" | PilotReadinessAssessmentFailure;

export type PilotReadinessAssessmentInput = Readonly<{ scenario?: PilotReadinessAssessmentScenario; tenant_id?: string; operator_id?: string; mission_id?: string; assessment_version?: string }>;

export type ReadinessScorecard = Readonly<{
  assessment_id: string;
  pilot_version: "pilot-readiness-assessment/v16.9";
  assessment_timestamp: string;
  tenant_scope: readonly string[];
  environment: string;
  operational_stability_score: number;
  governance_compliance_score: number;
  replay_quality_score: number;
  advisory_compliance_score: number;
  certification_readiness_score: number;
  overall_readiness_score: number;
  assessment_outcome: ReadinessAssessmentOutcome;
  evidence_refs: readonly string[];
  incident_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  operator_approval_refs: readonly string[];
  assessment_version: string;
  integrity_hash: string;
}>;

export type ReadinessCategoryAssessment = Readonly<{
  category: ReadinessCategory;
  score: number;
  evaluated_signals: readonly string[];
  evidence_refs: readonly string[];
  deficiencies: readonly string[];
  deterministic: boolean;
  compliant: boolean;
  integrity_hash: string;
}>;

export type OperationalHealthReport = Readonly<{
  report_id: string;
  runtime_reliability: boolean;
  recommendation_stability: boolean;
  evidence_ingestion_health: boolean;
  replay_completion: boolean;
  monitoring_health: boolean;
  incident_frequency: number;
  recovery_performance: boolean;
  operator_workflow_reliability: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type GovernanceComplianceReport = Readonly<{
  report_id: string;
  constitutional_compliance: boolean;
  governance_approvals: boolean;
  advisory_only_enforcement: boolean;
  authority_separation: boolean;
  immutable_evidence_preservation: boolean;
  tenant_isolation: boolean;
  policy_compliance: boolean;
  deployment_governance: boolean;
  critical_governance_violations: number;
  validated: boolean;
  integrity_hash: string;
}>;

export type CertificationReadinessDashboard = Readonly<{
  dashboard_id: string;
  constitutional_threshold_compliance: boolean;
  operational_threshold_compliance: boolean;
  continuous_assurance_health: boolean;
  evidence_completeness: boolean;
  certification_freshness: boolean;
  incident_resolution_status: boolean;
  unresolved_governance_findings: number;
  phase_16_exit_readiness: boolean;
  continuously_visible: boolean;
  integrity_hash: string;
}>;

export type ReadinessMetricsRegistry = Readonly<{
  registry_id: string;
  categories: readonly ReadinessCategory[];
  metrics: readonly string[];
  deterministic_calculations: boolean;
  inherited_thresholds_authoritative: boolean;
  reused_infrastructure_refs: readonly string[];
  parallel_infrastructure_created: boolean;
  integrity_hash: string;
}>;

export type ReadinessTrendAnalyzer = Readonly<{
  analyzer_id: string;
  trend_refs: readonly string[];
  readiness_score_trend: readonly number[];
  degradation_detected: boolean;
  unresolved_deficiencies: readonly string[];
  threshold_violations: readonly string[];
  incident_impact: string;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ReadinessDecisionRecord = Readonly<{
  decision_id: string;
  decision: ReadinessDecision;
  outcome: ReadinessAssessmentOutcome;
  blocking_deficiencies: readonly string[];
  governance_review_supported: boolean;
  grants_operational_authority: boolean;
  modifies_pilot_scope: boolean;
  reproducible: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReadinessHistoryEntry = Readonly<{
  history_entry_id: string;
  sequence: number;
  assessment_ref: string;
  decision_ref: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type ReadinessEvidenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "METRICS_CAPTURED" | "HEALTH_ASSESSED" | "GOVERNANCE_VALIDATED" | "REPLAY_ASSESSED" | "ADVISORY_VALIDATED" | "CERTIFICATION_ASSESSED" | "SCORECARD_PUBLISHED" | "DECISION_RECORDED" | "HISTORY_ARCHIVED";
  readiness_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type PilotReadinessAssessmentCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: PilotReadinessAssessmentOutcome;
  passed: boolean;
  failure_reason: PilotReadinessAssessmentFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PilotReadinessAssessmentResult = Readonly<{
  phase_version: "pilot-readiness-assessment/v16.9";
  phase_identifier: "PilotReadinessAssessment";
  incident_exception_governance_ref: string;
  scorecard: ReadinessScorecard;
  category_assessments: readonly ReadinessCategoryAssessment[];
  operational_health_report: OperationalHealthReport;
  governance_compliance_report: GovernanceComplianceReport;
  certification_dashboard: CertificationReadinessDashboard;
  metrics_registry: ReadinessMetricsRegistry;
  trend_analyzer: ReadinessTrendAnalyzer;
  decision: ReadinessDecisionRecord;
  history: readonly ReadinessHistoryEntry[];
  evidence_ledger: readonly ReadinessEvidenceLedgerEntry[];
  certification_tests: readonly PilotReadinessAssessmentCertificationTest[];
  failures: readonly PilotReadinessAssessmentFailure[];
  outcome: PilotReadinessAssessmentOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PilotReadinessAssessmentValidation = Readonly<{
  valid: boolean;
  outcome: PilotReadinessAssessmentOutcome;
  scorecard_valid: boolean;
  categories_valid: boolean;
  health_valid: boolean;
  governance_valid: boolean;
  certification_dashboard_valid: boolean;
  metrics_valid: boolean;
  trend_valid: boolean;
  decision_valid: boolean;
  history_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly PilotReadinessAssessmentFailure[];
  integrity_hash: string;
}>;

export type PilotReadinessAssessmentBundle = Readonly<{
  doctrine: Readonly<{
    version: "pilot-readiness-assessment/v16.9";
    upstream_phase: "incident-exception-governance/v16.8";
    readiness_categories: readonly ReadinessCategory[];
    assessment_outcomes: readonly ReadinessAssessmentOutcome[];
    readiness_decisions: readonly ReadinessDecision[];
    certification_outcomes: readonly PilotReadinessAssessmentOutcome[];
  }>;
  result: PilotReadinessAssessmentResult;
  validation: PilotReadinessAssessmentValidation;
}>;
