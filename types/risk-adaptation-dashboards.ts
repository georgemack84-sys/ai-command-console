import type { GovernanceRiskResult } from "@/types/governance-aware-risk-adaptation";
import type { RiskAdaptationLedgerResult } from "@/types/risk-adaptation-ledger";
import type { RiskAdaptationSimulationResult } from "@/types/risk-adaptation-simulation";
import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";
import type { RiskDriftResult } from "@/types/risk-drift-detector";
import type { RiskPatternResult } from "@/types/risk-pattern-intelligence";
import type { RiskSeverityRecalibrationResult } from "@/types/risk-severity-recalibrator";

export type RiskAdaptationDashboardKind = "OVERVIEW" | "RISK_DRIFT" | "SEVERITY_CALIBRATION" | "RISK_PATTERN" | "GOVERNANCE" | "SIMULATION" | "REPLAY" | "TENANT" | "EXECUTIVE_REPORTING";
export type RiskAdaptationDashboardStatus = "ACTIVE" | "APPROVED" | "REJECTED" | "PENDING_REVIEW" | "PENDING_SIMULATION" | "CERTIFICATION_READY" | "SUPPRESSED";
export type RiskAdaptationDashboardValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskAdaptationDashboardFailure =
  | "SOURCE_DATA_MISSING"
  | "DETERMINISTIC_METRICS_MISSING"
  | "EVIDENCE_ATTRIBUTION_MISSING"
  | "REPLAY_LINKAGE_MISSING"
  | "GOVERNANCE_COMPLIANCE_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "UNAUTHORIZED_TENANT_VISIBILITY"
  | "OPERATIONAL_DATA_MUTATION_DETECTED"
  | "HISTORICAL_RECORD_MUTATION_DETECTED"
  | "CONSTITUTIONAL_FINDING_SUPPRESSION_DETECTED"
  | "GOVERNANCE_HISTORY_SUPPRESSION_DETECTED"
  | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"
  | "DASHBOARD_WRITE_ACCESS_DETECTED"
  | "NONDETERMINISTIC_DASHBOARD_METRICS"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskAdaptationDashboardScenario =
  | "BASELINE"
  | "OVERVIEW"
  | "DRIFT"
  | "CALIBRATION"
  | "PATTERN"
  | "GOVERNANCE"
  | "SIMULATION"
  | "REPLAY"
  | "TENANT"
  | "EXECUTIVE"
  | "MISSING_SOURCE"
  | "MISSING_METRICS"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "CROSS_TENANT"
  | "BROKEN_LINEAGE"
  | "HASH_MISMATCH"
  | "REPLAY_DIVERGENCE"
  | "UNAUTHORIZED_TENANT"
  | "OPERATIONAL_MUTATION"
  | "HISTORICAL_MUTATION"
  | "CONSTITUTIONAL_SUPPRESSION"
  | "GOVERNANCE_SUPPRESSION"
  | "OPERATOR_OVERRIDE"
  | "WRITE_ACCESS"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskAdaptationDashboardMetrics = Readonly<{
  total_proposals: number;
  approval_rate: number;
  average_review_duration_hours: number;
  simulation_completion_rate: number;
  certification_readiness: number;
  adaptation_health_score: number;
  prediction_accuracy_improvement: number;
  calibration_quality: number;
  drift_stability: number;
  pattern_confidence: number;
}>;

export type RiskAdaptationDashboardRecord = Readonly<{
  dashboard_record_id: string;
  tenant_id: string;
  adaptation_id: string;
  dashboard_kind: RiskAdaptationDashboardKind;
  proposal_status: RiskAdaptationDashboardStatus;
  risk_domain: RiskAdaptationDomain;
  adaptation_category: string;
  governance_status: string;
  simulation_status: string;
  operator_status: string;
  certification_status: string;
  accuracy_metrics: RiskAdaptationDashboardMetrics;
  calibration_metrics: RiskAdaptationDashboardMetrics;
  drift_metrics: RiskAdaptationDashboardMetrics;
  pattern_metrics: RiskAdaptationDashboardMetrics;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_refs: readonly string[];
  last_updated: string;
  integrity_hash: string;
  read_only: true;
  mutates_operational_data: false;
  mutates_historical_records: false;
  suppresses_constitutional_findings: false;
  suppresses_governance_history: false;
  overrides_operator_authority: false;
  displays_unauthorized_tenant_data: false;
}>;

export type RiskAdaptationDashboardView = Readonly<{
  view_id: string;
  dashboard_kind: RiskAdaptationDashboardKind;
  title: string;
  summary: string;
  visible_record_refs: readonly string[];
  key_metrics: RiskAdaptationDashboardMetrics;
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskAdaptationExecutiveReport = Readonly<{
  report_id: string;
  executive_summary: string;
  governance_summary: string;
  calibration_improvement_summary: string;
  trend_analysis_summary: string;
  simulation_effectiveness_summary: string;
  certification_readiness_summary: string;
  operational_health_summary: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskAdaptationDashboardLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  dashboard_record_refs: readonly string[];
  view_refs: readonly string[];
  report_refs: readonly string[];
  dashboard_index: Readonly<Record<RiskAdaptationDashboardKind, readonly string[]>>;
  read_only: true;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationDashboardValidation = Readonly<{
  validation_id: string;
  state: RiskAdaptationDashboardValidationState;
  certified: boolean;
  failures: readonly RiskAdaptationDashboardFailure[];
  source_data_complete: boolean;
  deterministic_metrics_complete: boolean;
  evidence_attribution_complete: boolean;
  replay_linkage_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  tenant_isolated: boolean;
  lineage_complete: boolean;
  read_only: boolean;
  no_operational_mutation: boolean;
  no_historical_mutation: boolean;
  no_constitutional_suppression: boolean;
  no_governance_suppression: boolean;
  no_operator_override: boolean;
  no_unauthorized_tenant_visibility: boolean;
  deterministic: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskAdaptationDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_overview: "POST /risk-adaptation-dashboards/overview";
  retrieve_drift: "POST /risk-adaptation-dashboards/drift";
  retrieve_calibration: "POST /risk-adaptation-dashboards/calibration";
  retrieve_patterns: "POST /risk-adaptation-dashboards/patterns";
  retrieve_governance: "POST /risk-adaptation-dashboards/governance";
  retrieve_simulation: "POST /risk-adaptation-dashboards/simulation";
  retrieve_replay: "POST /risk-adaptation-dashboards/replay";
  retrieve_tenant: "POST /risk-adaptation-dashboards/tenant";
  retrieve_executive: "POST /risk-adaptation-dashboards/executive";
  retrieve_validation: "POST /risk-adaptation-dashboards/validation";
  replay_dashboards: "POST /risk-adaptation-dashboards/replay-analysis";
  retrieve_contract: "GET /risk-adaptation-dashboards/contract";
  update_supported: false;
  delete_supported: false;
  write_supported: false;
  operational_mutation_supported: false;
  cross_tenant_visibility_supported: false;
  integrity_hash: string;
}>;

export type RiskAdaptationDashboardInput = Readonly<{
  scenario?: RiskAdaptationDashboardScenario;
  ledger_result?: RiskAdaptationLedgerResult;
  drift_result?: RiskDriftResult;
  severity_result?: RiskSeverityRecalibrationResult;
  pattern_result?: RiskPatternResult;
  governance_result?: GovernanceRiskResult;
  simulation_result?: RiskAdaptationSimulationResult;
}>;

export type RiskAdaptationDashboardResult = Readonly<{
  risk_adaptation_dashboards_version: "risk-adaptation-dashboards/v1";
  api_surface: RiskAdaptationDashboardApiSurface;
  records: readonly RiskAdaptationDashboardRecord[];
  views: readonly RiskAdaptationDashboardView[];
  executive_report: RiskAdaptationExecutiveReport;
  ledger: RiskAdaptationDashboardLedger;
  validation: RiskAdaptationDashboardValidation;
  deterministic: true;
  replayable: true;
  evidence_backed: boolean;
  tenant_isolated: boolean;
  read_only: true;
  mutates_operational_data: false;
  mutates_historical_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskAdaptationDashboardFoundation = Readonly<{
  risk_adaptation_dashboards_version: "risk-adaptation-dashboards/v1";
  api_surface: RiskAdaptationDashboardApiSurface;
  result: RiskAdaptationDashboardResult;
}>;
