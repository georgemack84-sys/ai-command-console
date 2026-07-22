export type ProductionObservabilityOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DashboardLifecycleState = "REGISTERED" | "CONFIGURED" | "AUTHORIZED" | "ACTIVE" | "MONITORING" | "ARCHIVED";
export type OperatorActionLifecycleState = "REQUESTED" | "AUTHENTICATED" | "AUTHORIZED" | "EXECUTED" | "RECORDED" | "REPLAYABLE";
export type AlertCategory = "deployment" | "certification" | "replay" | "isolation" | "boundary" | "dependency" | "incident" | "evidence freshness" | "rollback" | "governance";
export type AlertSeverity = "INFORMATIONAL" | "ADVISORY" | "WARNING" | "HIGH" | "CRITICAL" | "CONSTITUTIONAL";
export type DashboardView = "Production Operations" | "Release Health" | "Deployment Pipeline" | "Environment Qualification" | "Tenant Isolation" | "Advisory Boundary" | "Replay Divergence" | "Certification Health" | "Evidence Freshness" | "Dependency Health" | "Rollback Readiness" | "Incident Status" | "Operator Activity" | "Alert Center" | "Operational Timeline";
export type RunbookCategory = "deployment" | "rollback" | "incident response" | "containment" | "certification recovery" | "replay investigation" | "isolation response" | "boundary violation" | "dependency failure";
export type ProductionObservabilityFailure = "PRODUCTION_OPERATIONS_NOT_VISIBLE" | "RELEASE_HEALTH_NOT_VISIBLE" | "TENANT_ISOLATION_NOT_VISIBLE" | "ADVISORY_BOUNDARY_NOT_VISIBLE" | "REPLAY_DIVERGENCE_NOT_VISIBLE" | "CERTIFICATION_HEALTH_NOT_VISIBLE" | "OPERATOR_ATTRIBUTION_INCOMPLETE" | "ALERTS_NON_DETERMINISTIC" | "RUNBOOKS_NOT_VALIDATED" | "DASHBOARD_EVIDENCE_NOT_REPLAYABLE" | "HIDDEN_OPERATIONAL_STATE_PRESENT" | "OPERATIONAL_LINEAGE_MUTABLE" | "CROSS_TENANT_VISIBILITY_ALLOWED" | "ADVISORY_ONLY_ARCHITECTURE_BROKEN" | "DASHBOARD_NOT_DERIVED_FROM_IMMUTABLE_EVIDENCE" | "CONSTITUTIONAL_ALERTS_SUPPRESSIBLE" | "NON_CONSTITUTIONAL_VISIBILITY_WARNING";
export type ProductionObservabilityScenario = "BASELINE" | ProductionObservabilityFailure;

export type ProductionObservabilityInput = Readonly<{ scenario?: ProductionObservabilityScenario; tenant_id?: string; operator_id?: string }>;

export type ProductionObservabilityContract = Readonly<{
  contract_version: "production-observability-operator-control/v15.11";
  dashboard_lifecycle: readonly DashboardLifecycleState[];
  operator_action_lifecycle: readonly OperatorActionLifecycleState[];
  dashboard_views: readonly DashboardView[];
  advisory_only: boolean;
  operator_supremacy: boolean;
  complete_observability: boolean;
  deterministic_replay_required: boolean;
  tenant_isolation_required: boolean;
  immutable_evidence_required: boolean;
  integrity_hash: string;
}>;

export type ProductionDashboardRecord = Readonly<{
  dashboard_id: string;
  lifecycle: readonly DashboardLifecycleState[];
  views: readonly DashboardView[];
  authorized: boolean;
  permissions_enforced: boolean;
  projection_rules_defined: boolean;
  evidence_refs: readonly string[];
  replayable: boolean;
  hidden_state_absent: boolean;
  immutable_projection: boolean;
  integrity_hash: string;
}>;

export type ReleaseHealthRecord = Readonly<{
  release_health_id: string;
  release_identity_visible: boolean;
  certification_linkage_visible: boolean;
  deployment_stage_visible: boolean;
  promotion_history_visible: boolean;
  rollback_readiness_visible: boolean;
  dependency_health_visible: boolean;
  environment_qualification_visible: boolean;
  release_integrity_visible: boolean;
  promotion_lineage_complete: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationDashboardRecord = Readonly<{
  tenant_dashboard_id: string;
  tenant_boundaries_visible: boolean;
  isolation_health_visible: boolean;
  cross_tenant_attempts_visible: boolean;
  cache_separation_visible: boolean;
  policy_separation_visible: boolean;
  memory_separation_visible: boolean;
  replay_isolation_visible: boolean;
  containment_events_visible: boolean;
  cross_tenant_visibility_blocked: boolean;
  integrity_hash: string;
}>;

export type AdvisoryBoundaryDashboardRecord = Readonly<{
  boundary_dashboard_id: string;
  recommendation_history_visible: boolean;
  blocked_execution_attempts_visible: boolean;
  external_authorization_requests_visible: boolean;
  authority_token_validation_visible: boolean;
  operator_approvals_visible: boolean;
  boundary_violations_visible: boolean;
  containment_actions_visible: boolean;
  boundary_health_score_visible: boolean;
  execution_authority_absent: boolean;
  integrity_hash: string;
}>;

export type ReplayDivergenceDashboardRecord = Readonly<{
  replay_dashboard_id: string;
  replay_status_visible: boolean;
  divergence_events_visible: boolean;
  divergence_classifications_visible: boolean;
  production_twin_comparison_visible: boolean;
  replay_confidence_visible: boolean;
  unresolved_divergence_visible: boolean;
  containment_status_visible: boolean;
  replay_lineage_visible: boolean;
  integrity_hash: string;
}>;

export type CertificationStatusRecord = Readonly<{
  certification_dashboard_id: string;
  certification_status_visible: boolean;
  evidence_freshness_visible: boolean;
  dependency_verification_visible: boolean;
  policy_changes_visible: boolean;
  recertification_triggers_visible: boolean;
  qualification_health_visible: boolean;
  certification_lineage_visible: boolean;
  certification_expiration_visible: boolean;
  integrity_hash: string;
}>;

export type OperatorActionRecord = Readonly<{
  action_id: string;
  lifecycle: readonly OperatorActionLifecycleState[];
  operator_id: string;
  action_type: "approval" | "rejection" | "rollback" | "deployment" | "emergency action" | "containment action" | "override" | "acknowledgement";
  authenticated: boolean;
  authorized: boolean;
  attributable: boolean;
  identity_immutable: boolean;
  replayable: boolean;
  never_rewritten: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalAlertRecord = Readonly<{
  alert_id: string;
  categories: readonly AlertCategory[];
  severity: AlertSeverity;
  deterministic: boolean;
  escalation_reproducible: boolean;
  acknowledgement_tracked: boolean;
  constitutional_alerts_suppressible: false;
  history_immutable: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalRunbookRecord = Readonly<{
  runbook_id: string;
  categories: readonly RunbookCategory[];
  procedures_validated: boolean;
  advisory_only: boolean;
  operator_execution_authority_retained: boolean;
  revision_lineage_preserved: boolean;
  guidance_complete: boolean;
  integrity_hash: string;
}>;

export type OperationalTimelineRecord = Readonly<{
  timeline_id: string;
  deployment_replay: boolean;
  incident_replay: boolean;
  operator_replay: boolean;
  certification_replay: boolean;
  rollback_replay: boolean;
  divergence_replay: boolean;
  alert_replay: boolean;
  boundary_replay: boolean;
  deterministic: boolean;
  evidence_traceable: boolean;
  integrity_hash: string;
}>;

export type ProductionVisibilityCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionObservabilityOutcome;
  passed: boolean;
  failure_reason: ProductionObservabilityFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionObservabilityResult = Readonly<{
  phase_version: "production-observability-operator-control/v15.11";
  phase_identifier: "ProductionObservabilityOperatorControl";
  continuous_assurance_ref: string;
  contract: ProductionObservabilityContract;
  dashboard: ProductionDashboardRecord;
  release_health: ReleaseHealthRecord;
  tenant_isolation: TenantIsolationDashboardRecord;
  advisory_boundary: AdvisoryBoundaryDashboardRecord;
  replay_divergence: ReplayDivergenceDashboardRecord;
  certification_status: CertificationStatusRecord;
  operator_action: OperatorActionRecord;
  alert: OperationalAlertRecord;
  runbook: OperationalRunbookRecord;
  timeline: OperationalTimelineRecord;
  certification_tests: readonly ProductionVisibilityCertificationTest[];
  failures: readonly ProductionObservabilityFailure[];
  outcome: ProductionObservabilityOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionObservabilityValidation = Readonly<{
  valid: boolean;
  outcome: ProductionObservabilityOutcome;
  contract_valid: boolean;
  dashboard_valid: boolean;
  release_valid: boolean;
  tenant_valid: boolean;
  boundary_valid: boolean;
  replay_valid: boolean;
  certification_status_valid: boolean;
  operator_valid: boolean;
  alert_valid: boolean;
  runbook_valid: boolean;
  timeline_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly ProductionObservabilityFailure[];
  integrity_hash: string;
}>;

export type ProductionObservabilityBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-observability-operator-control/v15.11";
    upstream_phase: "continuous-assurance-certification/v15.10";
    dashboard_lifecycle: readonly DashboardLifecycleState[];
    dashboard_views: readonly DashboardView[];
    alert_categories: readonly AlertCategory[];
    alert_severities: readonly AlertSeverity[];
    certification_outcomes: readonly ProductionObservabilityOutcome[];
  }>;
  result: ProductionObservabilityResult;
  validation: ProductionObservabilityValidation;
}>;
