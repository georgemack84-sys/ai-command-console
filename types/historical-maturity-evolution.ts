import type { AutonomyMaturityDomain, AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { MaturityClassificationRepository } from "@/types/maturity-classification-engine";

export type HistoricalMaturityScenario = "BASELINE" | "HISTORICAL_RECORD_MUTATION" | "CHRONOLOGICAL_ORDERING_CHANGE" | "TREND_REPLAY_MISMATCH" | "BROKEN_LINEAGE" | "INTEGRITY_VERIFICATION_FAILURE" | "REPLAY_RECONSTRUCTION_MISMATCH" | "INCONSISTENT_PROMOTION_HISTORY" | "INCOMPLETE_REGRESSION_HISTORY" | "MISSING_GOVERNANCE_HISTORY" | "MISSING_CONSTITUTIONAL_HISTORY" | "HIDDEN_HISTORICAL_RECORDS" | "TENANT_ISOLATION_VIOLATION" | "ADVISORY_ONLY_VIOLATION";
export type HistoricalMaturityFailure = "HISTORICAL_RECORD_MODIFIED" | "CHRONOLOGICAL_ORDERING_CHANGED" | "TREND_REPLAY_MISMATCHED" | "HISTORICAL_LINEAGE_BROKEN" | "INTEGRITY_VERIFICATION_FAILED" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "PROMOTION_HISTORY_INCONSISTENT" | "REGRESSION_HISTORY_INCOMPLETE" | "GOVERNANCE_HISTORY_MISSING" | "CONSTITUTIONAL_HISTORY_MISSING" | "HIDDEN_HISTORICAL_RECORDS_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "ADVISORY_ONLY_BEHAVIOR_COMPROMISED";
export type HistoricalMaturityState = "RECORDED" | "VALIDATED" | "PROMOTED" | "REGRESSED" | "CERTIFIED" | "SUPERSEDED" | "ARCHIVED";
export type HistoricalTimelineEventType = "ASSESSMENT_COMPLETED" | "MATURITY_PROMOTED" | "MATURITY_REGRESSED" | "CERTIFICATION_OBSERVED" | "CERTIFICATION_REVOKED_OBSERVED" | "GOVERNANCE_MILESTONE" | "CONSTITUTIONAL_MILESTONE" | "REPLAY_MILESTONE" | "RESILIENCE_MILESTONE";
export type HistoricalTrendDirection = "IMPROVING" | "STABLE" | "DECLINING" | "BLOCKED";

export type HistoricalMaturityLedgerRecord = Readonly<{
  history_id: string;
  assessment_id: string;
  tenant_id: string;
  mission_id: string;
  maturity_level: AutonomyMaturityLevel;
  historical_state: HistoricalMaturityState;
  overall_score: number;
  confidence_score: number;
  readiness_score: number;
  assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1";
  scoring_version: "deterministic-maturity-scoring-engine/v8ALT.11.3";
  classification_version: "maturity-classification-engine/v8ALT.11.4";
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  immutable: boolean;
  timestamp: "1970-01-01T00:00:00.000Z";
  integrity_hash: string;
}>;

export type HistoricalTimelineEvent = Readonly<{
  event_id: string;
  history_id: string;
  event_type: HistoricalTimelineEventType;
  event_order: number;
  maturity_level: AutonomyMaturityLevel;
  score: number;
  replay_reference: string;
  lineage_reference: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type HistoricalDomainImprovement = Readonly<{
  domain: AutonomyMaturityDomain;
  baseline_score: number;
  current_score: number;
  delta: number;
  trend: HistoricalTrendDirection;
  replay_reference: string;
  integrity_hash: string;
}>;

export type HistoricalRegressionEvent = Readonly<{
  regression_id: string;
  affected_domains: readonly AutonomyMaturityDomain[];
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "BLOCKING";
  historical_comparison: string;
  corrective_recommendations: readonly string[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type HistoricalMaturityTrendAnalysis = Readonly<{
  trend_id: string;
  growth_trend: HistoricalTrendDirection;
  stability_trend: HistoricalTrendDirection;
  regression_trend: HistoricalTrendDirection;
  improvement_velocity: number;
  maturity_trajectory: "TOWARD_CERTIFIED_CONSTITUTIONAL_AUTONOMY" | "STABLE_CONTROLLED_AUTONOMY" | "REGRESSION_RISK";
  replay_verified: boolean;
  integrity_hash: string;
}>;

export type HistoricalProgressAnalytics = Readonly<{
  progress_id: string;
  progress_percentage: number;
  maturity_velocity: number;
  readiness_evolution: number;
  milestone_completion: number;
  remaining_objectives: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalMaturityReport = Readonly<{
  report_id: string;
  current_maturity: AutonomyMaturityLevel;
  historical_maturity: AutonomyMaturityLevel;
  trend_direction: HistoricalTrendDirection;
  readiness_summary: string;
  timeline_summary: readonly string[];
  domain_evolution: readonly HistoricalDomainImprovement[];
  regression_events: readonly HistoricalRegressionEvent[];
  recommendations: readonly string[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type HistoricalMaturityRepository = Readonly<{
  repository_id: string;
  final_state: "HISTORICAL_MATURITY_EVOLUTION_COMPLETE" | "HISTORICAL_MATURITY_EVOLUTION_FAILED";
  classification: MaturityClassificationRepository;
  ledger: readonly HistoricalMaturityLedgerRecord[];
  timeline: readonly HistoricalTimelineEvent[];
  trends: HistoricalMaturityTrendAnalysis;
  progress: HistoricalProgressAnalytics;
  domain_improvements: readonly HistoricalDomainImprovement[];
  regressions: readonly HistoricalRegressionEvent[];
  report: HistoricalMaturityReport;
  failures: readonly HistoricalMaturityFailure[];
  advisory_only: true;
  historical_record_modification_authorized: false;
  maturity_state_mutation_authorized: false;
  production_certification_authorized: false;
  governance_modification_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type HistoricalMaturityValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  records_immutable: boolean;
  chronological_ordering: boolean;
  trend_replay_verified: boolean;
  lineage_intact: boolean;
  integrity_verified: boolean;
  replay_verified: boolean;
  promotion_history_consistent: boolean;
  regression_history_complete: boolean;
  governance_history_present: boolean;
  constitutional_history_present: boolean;
  no_hidden_records: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  no_state_mutation_authority: boolean;
  failures: readonly HistoricalMaturityFailure[];
  validation_hash: string;
}>;

export type HistoricalMaturityObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  ledger_count: number;
  timeline_count: number;
  domain_improvement_count: number;
  regression_count: number;
  trend_direction: HistoricalTrendDirection;
  progress_percentage: number;
  failure_count: number;
  advisory_only: true;
  maturity_state_mutation_authorized: false;
  integrity_hash: string;
}>;

export type HistoricalMaturityInput = Readonly<{ scenario?: HistoricalMaturityScenario; repository?: HistoricalMaturityRepository; classification?: MaturityClassificationRepository }>;

export type HistoricalMaturityBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "historical-maturity-evolution/v8ALT.11.5";
    final_state: "HISTORICAL_MATURITY_EVOLUTION_READY";
    principles: readonly string[];
  }>;
  repository: HistoricalMaturityRepository;
  validation: HistoricalMaturityValidationResult;
  observability: HistoricalMaturityObservabilitySurface;
}>;
