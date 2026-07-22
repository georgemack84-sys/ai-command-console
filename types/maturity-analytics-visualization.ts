import type { AutonomyMaturityDomain, AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { MaturityLedgerEvidenceRepository } from "@/types/maturity-ledger-evidence-repository";

export type MaturityAnalyticsScenario = "BASELINE" | "DASHBOARD_REPLAY_MISMATCH" | "VISUALIZATION_EVIDENCE_MISMATCH" | "INCONSISTENT_HISTORICAL_TIMELINE" | "INCORRECT_DOMAIN_HEATMAP_VALUES" | "READINESS_FINDINGS_OMITTED" | "CERTIFICATION_STATUS_OMITTED" | "MISSING_GOVERNANCE_EVIDENCE" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "INCOMPLETE_REPLAY_REFERENCES" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_ANALYTICS" | "TENANT_ISOLATION_VIOLATION" | "ADVISORY_ONLY_VIOLATION";
export type MaturityAnalyticsFailure = "DASHBOARD_REPLAY_MISMATCHED" | "VISUALIZATION_EVIDENCE_MISMATCHED" | "HISTORICAL_TIMELINE_INCONSISTENT" | "DOMAIN_HEATMAP_VALUES_INCORRECT" | "READINESS_DASHBOARD_FINDINGS_OMITTED" | "CERTIFICATION_DASHBOARD_STATUS_OMITTED" | "GOVERNANCE_EVIDENCE_MISSING" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "REPLAY_REFERENCES_INCOMPLETE" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_ANALYTICS_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "ADVISORY_ONLY_BEHAVIOR_COMPROMISED";
export type DashboardKind = "CURRENT_LEVEL" | "HISTORICAL_TIMELINE" | "DOMAIN_HEATMAP" | "TREND_CHARTS" | "READINESS" | "GAP" | "CERTIFICATION" | "EXECUTIVE";
export type ReportKind = "EXECUTIVE" | "TECHNICAL" | "GOVERNANCE" | "CONSTITUTIONAL" | "CERTIFICATION";

export type VisualizationRegistryEntry = Readonly<{
  visualization_id: string;
  dashboard_kind: DashboardKind;
  visualization_version: "maturity-visualization/v1";
  analytics_version: "maturity-analytics/v1";
  template: string;
  approved: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type MaturityDashboardArtifact = Readonly<{
  dashboard_id: string;
  dashboard_kind: DashboardKind;
  title: string;
  kpis: readonly string[];
  data_points: readonly string[];
  evidence_references: readonly string[];
  governance_references: readonly string[];
  constitutional_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type MaturityAnalyticsSummary = Readonly<{
  analytics_id: string;
  maturity_level: AutonomyMaturityLevel;
  maturity_score: number;
  readiness_score: number;
  confidence_score: number;
  domain_count: number;
  domain_heatmap: readonly Readonly<{ domain: AutonomyMaturityDomain; score: number; trend: "IMPROVING" | "STABLE" | "DECLINING"; integrity_hash: string }>[];
  trend_metrics: readonly string[];
  replay_verified: boolean;
  integrity_hash: string;
}>;

export type MaturityVisualizationReport = Readonly<{
  report_id: string;
  report_kind: ReportKind;
  title: string;
  summary: readonly string[];
  evidence_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type MaturityAnalyticsVisualizationRepository = Readonly<{
  repository_id: string;
  final_state: "MATURITY_ANALYTICS_VISUALIZATION_COMPLETE" | "MATURITY_ANALYTICS_VISUALIZATION_FAILED";
  ledger_repository: MaturityLedgerEvidenceRepository;
  registry: readonly VisualizationRegistryEntry[];
  dashboards: readonly MaturityDashboardArtifact[];
  analytics: MaturityAnalyticsSummary;
  reports: readonly MaturityVisualizationReport[];
  failures: readonly MaturityAnalyticsFailure[];
  advisory_only: true;
  maturity_change_authorized: false;
  certification_approval_authorized: false;
  runtime_change_authorized: false;
  governance_change_authorized: false;
  remediation_action_authorized: false;
  integrity_hash: string;
}>;

export type MaturityAnalyticsValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  dashboard_replay_verified: boolean;
  visualization_evidence_consistent: boolean;
  historical_timeline_consistent: boolean;
  domain_heatmap_correct: boolean;
  readiness_findings_present: boolean;
  certification_status_present: boolean;
  governance_evidence_present: boolean;
  constitutional_evidence_present: boolean;
  replay_references_complete: boolean;
  integrity_verified: boolean;
  no_hidden_analytics: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  failures: readonly MaturityAnalyticsFailure[];
  validation_hash: string;
}>;

export type MaturityAnalyticsObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  dashboard_count: number;
  registry_count: number;
  report_count: number;
  domain_count: number;
  failure_count: number;
  advisory_only: true;
  runtime_change_authorized: false;
  integrity_hash: string;
}>;

export type MaturityAnalyticsInput = Readonly<{ scenario?: MaturityAnalyticsScenario; repository?: MaturityAnalyticsVisualizationRepository; ledger_repository?: MaturityLedgerEvidenceRepository }>;

export type MaturityAnalyticsBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "maturity-analytics-visualization/v8ALT.11.9";
    final_state: "MATURITY_ANALYTICS_VISUALIZATION_READY";
    principles: readonly string[];
  }>;
  repository: MaturityAnalyticsVisualizationRepository;
  validation: MaturityAnalyticsValidationResult;
  observability: MaturityAnalyticsObservabilitySurface;
}>;
