import type { RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";
import type { ConstitutionalViolationDetectionRepository } from "@/types/constitutional-violation-detection";
import type { ConstitutionalResilienceAssessmentRepository } from "@/types/constitutional-resilience-assessment";
import type { ConstitutionalRecommendationRepository } from "@/types/constitutional-recommendation-engine";
import type { ConstitutionalReplayValidationRepository } from "@/types/constitutional-replay-validation";
import type { ConstitutionalLearningValidationRepository } from "@/types/constitutional-learning-validation";

export type ConstitutionalDashboardPanelType = "CONSTITUTIONAL_SCORE" | "AUTHORITY_STATUS" | "GOVERNANCE_STATUS" | "OPERATOR_AUTHORITY" | "LEARNING_COMPLIANCE" | "OPTIMIZATION_COMPLIANCE" | "RUNTIME_HEALTH" | "VIOLATION_TIMELINE" | "CONFIDENCE_HISTORY" | "REPLAY_INTEGRITY" | "SYSTEM_RESILIENCE" | "RECOMMENDATION_PANEL";
export type ConstitutionalDashboardRole = "EXECUTIVE" | "OPERATOR" | "GOVERNANCE" | "AUDIT" | "CERTIFICATION" | "HISTORICAL";
export type ConstitutionalDashboardState = "INITIALIZING" | "SYNCHRONIZING" | "HEALTHY" | "DEGRADED" | "RESTRICTED" | "FAIL_CLOSED";
export type ConstitutionalDashboardStatus = "Healthy" | "Warning" | "Degraded" | "Critical";
export type ConstitutionalDashboardScenario = "BASELINE" | "CONSTITUTIONAL_DATA_CORRUPTION" | "REPLAY_INCONSISTENCY" | "INTEGRITY_VERIFICATION_FAILURE" | "RENDERING_NONDETERMINISM" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "INCOMPLETE_LINEAGE" | "UNAUTHORIZED_DASHBOARD_MODIFICATION" | "ROLE_AUTHORIZATION_FAILURE" | "TENANT_ISOLATION_BREACH" | "STALE_CONSTITUTIONAL_STATE" | "INCONSISTENT_CONFIDENCE_CALCULATIONS" | "UNVERIFIABLE_DASHBOARD_METRICS";
export type ConstitutionalDashboardFailure = "CONSTITUTIONAL_DATA_CORRUPTION_DETECTED" | "DASHBOARD_REPLAY_INCONSISTENCY_DETECTED" | "DASHBOARD_INTEGRITY_VERIFICATION_FAILED" | "DASHBOARD_RENDERING_NONDETERMINISM_DETECTED" | "DASHBOARD_CONSTITUTIONAL_EVIDENCE_MISSING" | "DASHBOARD_LINEAGE_INCOMPLETE" | "UNAUTHORIZED_DASHBOARD_MODIFICATION_DETECTED" | "DASHBOARD_ROLE_AUTHORIZATION_FAILED" | "DASHBOARD_TENANT_ISOLATION_BREACH" | "STALE_CONSTITUTIONAL_STATE_DETECTED" | "INCONSISTENT_CONFIDENCE_CALCULATIONS_DETECTED" | "UNVERIFIABLE_DASHBOARD_METRICS_DETECTED";

export type ConstitutionalDashboardPanel = Readonly<{
  panel_id: string;
  panel_type: ConstitutionalDashboardPanelType;
  title: string;
  status: ConstitutionalDashboardStatus;
  primary_value: string;
  indicators: readonly string[];
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  confidence: number;
  integrity_hash: string;
}>;

export type ConstitutionalDashboardRoleView = Readonly<{
  view_id: string;
  role: ConstitutionalDashboardRole;
  access_level: "STRATEGIC_SUMMARY" | "MISSION_VISIBILITY" | "GOVERNANCE_OVERSIGHT" | "FORENSIC_EVIDENCE" | "CERTIFICATION_EVIDENCE" | "HISTORICAL_ANALYSIS";
  visible_panels: readonly ConstitutionalDashboardPanelType[];
  restricted: boolean;
  tenant_id: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalDashboardMetricExplanation = Readonly<{
  explanation_id: string;
  panel_id: string;
  constitutional_source: string;
  governing_rule: string;
  calculation_methodology: string;
  supporting_evidence: string;
  confidence_value: number;
  historical_comparison: string;
  replay_reference: string;
  integrity_verification: "VERIFIED" | "FAILED";
  lineage_reference: string;
  last_validation_timestamp: "1970-01-01T00:00:00.000Z";
  complete: boolean;
  integrity_hash: string;
}>;

export type ConstitutionalDashboardSnapshotRecord = Readonly<{
  dashboard_snapshot_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  snapshot_timestamp: "1970-01-01T00:00:00.000Z";
  constitutional_score: number;
  authority_status: ConstitutionalDashboardStatus;
  governance_status: ConstitutionalDashboardStatus;
  runtime_health: string;
  learning_compliance: string;
  optimization_compliance: string;
  replay_integrity: string;
  system_resilience: string;
  active_recommendations: number;
  dashboard_state: ConstitutionalDashboardState;
  lineage_reference: string;
  read_only: true;
  mission_execution_modification_authorized: false;
  constitutional_policy_modification_authorized: false;
  governance_decision_authorized: false;
  authority_assignment_authorized: false;
  autonomous_behavior_modification_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalDashboardLedgerRecord = Readonly<{
  dashboard_record_id: string;
  snapshot_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  view_type: ConstitutionalDashboardRole;
  dashboard_state: ConstitutionalDashboardState;
  constitutional_reference: string;
  replay_reference: string;
  evidence_reference: string;
  lineage_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalAssuranceDashboardRepository = Readonly<{
  repository_id: string;
  runtime_monitoring_repository_id: string;
  violation_detection_repository_id: string;
  resilience_assessment_repository_id: string;
  recommendation_repository_id: string;
  replay_validation_repository_id: string;
  learning_validation_repository_id: string;
  final_state: "CONSTITUTIONAL_ASSURANCE_DASHBOARD_COMPLETE" | "CONSTITUTIONAL_ASSURANCE_DASHBOARD_FAIL_CLOSED";
  snapshot: ConstitutionalDashboardSnapshotRecord;
  panels: readonly ConstitutionalDashboardPanel[];
  views: readonly ConstitutionalDashboardRoleView[];
  explanations: readonly ConstitutionalDashboardMetricExplanation[];
  ledger: readonly ConstitutionalDashboardLedgerRecord[];
  failures: readonly ConstitutionalDashboardFailure[];
  read_only: true;
  mission_execution_modification_authorized: false;
  constitutional_policy_modification_authorized: false;
  governance_decision_authorized: false;
  authority_assignment_authorized: false;
  autonomous_behavior_modification_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalAssuranceDashboardValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  deterministic_rendering: boolean;
  replay_identical: boolean;
  evidence_complete: boolean;
  explainability_complete: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  role_authorized: boolean;
  tenant_isolated: boolean;
  current_state: boolean;
  confidence_consistent: boolean;
  metrics_verifiable: boolean;
  read_only: true;
  fail_closed_ready: boolean;
  no_execution_influence: boolean;
  failures: readonly ConstitutionalDashboardFailure[];
  validation_hash: string;
}>;

export type ConstitutionalAssuranceDashboardObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  dashboard_state: ConstitutionalDashboardState;
  panel_count: number;
  view_count: number;
  explanation_count: number;
  ledger_count: number;
  failure_count: number;
  read_only: true;
  mission_execution_modification_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalAssuranceDashboardInput = Readonly<{ scenario?: ConstitutionalDashboardScenario; runtimeRepository?: RuntimeConstitutionalMonitoringRepository; violationRepository?: ConstitutionalViolationDetectionRepository; resilienceRepository?: ConstitutionalResilienceAssessmentRepository; recommendationRepository?: ConstitutionalRecommendationRepository; replayRepository?: ConstitutionalReplayValidationRepository; learningRepository?: ConstitutionalLearningValidationRepository; repository?: ConstitutionalAssuranceDashboardRepository }>;

export type ConstitutionalAssuranceDashboardBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-assurance-dashboard/v8ALT.10.9";
    final_state: "CONSTITUTIONAL_ASSURANCE_DASHBOARD_READY";
    panel_types: readonly ConstitutionalDashboardPanelType[];
    roles: readonly ConstitutionalDashboardRole[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalAssuranceDashboardRepository;
  validation: ConstitutionalAssuranceDashboardValidationResult;
  observability: ConstitutionalAssuranceDashboardObservabilitySurface;
}>;
