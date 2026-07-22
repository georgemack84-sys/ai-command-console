import type { MemoryLifecycleResult } from "@/types/memory-lifecycle-expiration-management";

export type AdaptiveMemoryObservabilityStatus = "AUTHORITATIVE" | "REJECTED";

export type ObservabilityHealthState = "HEALTHY" | "DEGRADED" | "CRITICAL";

export type ObservabilityValidator =
  | "TELEMETRY_COLLECTION"
  | "METRIC_GENERATION"
  | "RETRIEVAL_ANALYTICS"
  | "REUSE_ANALYTICS"
  | "GOVERNANCE_ANALYTICS"
  | "REPLAY_ANALYTICS"
  | "SIMILARITY_ANALYTICS"
  | "DASHBOARD_VALIDATION"
  | "TENANT_PRIVACY_VALIDATION"
  | "INTEGRITY_VERIFICATION";

export type ObservabilityFailure =
  | "LIFECYCLE_MANAGER_UNAVAILABLE"
  | "METRICS_NONDETERMINISTIC"
  | "DASHBOARD_DATA_INCONSISTENT"
  | "TELEMETRY_MISSING"
  | "REPLAY_METRICS_UNREPRODUCIBLE"
  | "GOVERNANCE_EVENTS_UNOBSERVABLE"
  | "TENANT_ISOLATION_VIOLATED"
  | "OPERATIONAL_HISTORY_ALTERED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED"
  | "OBSERVABILITY_INFLUENCED_EXECUTION"
  | "INTEGRITY_VERIFICATION_FAILED";

export type ObservabilityScenario =
  | "BASELINE"
  | "LIFECYCLE_MANAGER_UNAVAILABLE"
  | "NONDETERMINISTIC_METRICS"
  | "DASHBOARD_INCONSISTENCY"
  | "MISSING_TELEMETRY"
  | "UNREPRODUCIBLE_REPLAY_METRICS"
  | "GOVERNANCE_UNOBSERVABLE"
  | "TENANT_ISOLATION_BREACH"
  | "HISTORY_ALTERED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "OBSERVABILITY_INFLUENCE"
  | "INTEGRITY_FAILURE";

export type ObservabilityValidationReport = Readonly<{
  validator: ObservabilityValidator;
  valid: boolean;
  deterministic: boolean;
  replayable: boolean;
  tenant_safe: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type AdaptiveMemoryMetrics = Readonly<{
  metrics_id: string;
  tenant_id: string;
  mission_scope: string;
  retrieval_rate: number;
  reuse_frequency: number;
  governance_approvals: number;
  governance_denials: number;
  blocked_requests: number;
  replay_success_rate: number;
  replay_latency_ms: number;
  similarity_accuracy: number;
  lifecycle_transitions: number;
  integrity_status: "VERIFIED" | "FAILED";
  collection_timestamp: string;
  integrity_hash: string;
}>;

export type RetrievalAnalytics = Readonly<{
  requests_per_mission: number;
  requests_per_tenant: number;
  successful_retrievals: number;
  denied_retrievals: number;
  average_lookup_time_ms: number;
  replay_retrievals: number;
  similarity_retrievals: number;
  authorization_preserved: boolean;
  integrity_hash: string;
}>;

export type ReuseAnalytics = Readonly<{
  reuse_rate: number;
  successful_reuse: number;
  rejected_reuse: number;
  reuse_by_category: readonly string[];
  reuse_by_mission: number;
  superseded_reuse: number;
  expired_reuse_attempts: number;
  recommendation_influence: number;
  integrity_hash: string;
}>;

export type GovernanceDashboard = Readonly<{
  governance_approvals: number;
  governance_denials: number;
  constitutional_reviews: number;
  authority_validations: number;
  replay_validations: number;
  blocked_reuse: number;
  blocked_retrieval: number;
  cross_mission_approvals: number;
  blocked_cross_tenant_requests: number;
  deterministic: boolean;
  replayable: boolean;
  tenant_aware: boolean;
  integrity_hash: string;
}>;

export type ReplayObservability = Readonly<{
  replay_requests: number;
  replay_duration_ms: number;
  replay_success: number;
  replay_divergence: number;
  replay_failures: number;
  lineage_recovery: number;
  reconstruction_completeness: number;
  replay_integrity: "VERIFIED" | "FAILED";
  integrity_hash: string;
}>;

export type SimilarityObservability = Readonly<{
  similarity_requests: number;
  candidate_missions: number;
  average_similarity_score: number;
  ranking_quality: number;
  explanation_completeness: number;
  retrieval_latency_ms: number;
  deterministic_scoring: boolean;
  similarity_replay: boolean;
  integrity_hash: string;
}>;

export type MemoryHealthIndicator = Readonly<{
  storage_health: ObservabilityHealthState;
  index_health: ObservabilityHealthState;
  replay_health: ObservabilityHealthState;
  governance_health: ObservabilityHealthState;
  qualification_health: ObservabilityHealthState;
  similarity_health: ObservabilityHealthState;
  integrity_health: ObservabilityHealthState;
  lifecycle_health: ObservabilityHealthState;
  overall_health: ObservabilityHealthState;
  integrity_hash: string;
}>;

export type ObservabilityAlert = Readonly<{
  alert_id: string;
  alert_type:
    | "REPLAY_FAILURE"
    | "GOVERNANCE_FAILURE"
    | "BLOCKED_RETRIEVAL_SPIKE"
    | "SIMILARITY_DEGRADATION"
    | "RETRIEVAL_ANOMALY"
    | "INTEGRITY_FAILURE"
    | "LIFECYCLE_ANOMALY"
    | "QUALIFICATION_FAILURE"
    | "STORAGE_ANOMALY"
    | "TENANT_ISOLATION_VIOLATION";
  severity: "INFO" | "WARNING" | "CRITICAL";
  deterministic: true;
  replayable: true;
  tenant_safe: boolean;
  integrity_hash: string;
}>;

export type ObservabilityLedgerEntry = Readonly<{
  ledger_id: string;
  metrics_id: string;
  tenant_id: string;
  event:
    | "TELEMETRY_COLLECTION"
    | "METRIC_GENERATION"
    | "RETRIEVAL_ANALYTICS"
    | "REUSE_ANALYTICS"
    | "GOVERNANCE_ANALYTICS"
    | "REPLAY_ANALYTICS"
    | "SIMILARITY_ANALYTICS"
    | "DASHBOARD_UPDATE"
    | "ALERT_GENERATION"
    | "INTEGRITY_VERIFICATION";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type AdaptiveMemoryObservabilityContract = Readonly<{
  contract_id: "adaptive-memory-observability-contract";
  version: "adaptive-memory-observability/v1";
  architecture: readonly string[];
  validators: readonly ObservabilityValidator[];
  health_states: readonly ObservabilityHealthState[];
  metric_rules: readonly string[];
  dashboard_requirements: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  observability_guarantees: readonly string[];
  complete_visibility: true;
  observability_without_authority: true;
  deterministic_metrics: true;
  governance_transparency: true;
  replayable_observability: true;
  tenant_aware_visibility: true;
  execution_influence_supported: false;
  integrity_hash: string;
}>;

export type ObservabilityOperationalMetrics = Readonly<{
  telemetry_collections: number;
  metric_generations: number;
  dashboard_updates: number;
  alert_count: number;
  health_score: number;
  deterministic_metric_rate: number;
  replayable_metric_rate: number;
  tenant_safe_metric_rate: number;
  integrity_failures: number;
  failures: readonly ObservabilityFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryObservabilityApiSurface = Readonly<{
  api_id: string;
  establish_observability: "POST /adaptive-memory-observability/establish";
  retrieve_contract: "GET /adaptive-memory-observability/contract";
  retrieve_metrics: "POST /adaptive-memory-observability/metrics";
  retrieve_retrieval: "POST /adaptive-memory-observability/retrieval";
  retrieve_reuse: "POST /adaptive-memory-observability/reuse";
  retrieve_governance: "POST /adaptive-memory-observability/governance";
  retrieve_replay_analytics: "POST /adaptive-memory-observability/replay-analytics";
  retrieve_similarity: "POST /adaptive-memory-observability/similarity";
  retrieve_health: "POST /adaptive-memory-observability/health";
  retrieve_alerts: "POST /adaptive-memory-observability/alerts";
  retrieve_ledger: "POST /adaptive-memory-observability/ledger";
  replay_observability: "POST /adaptive-memory-observability/replay";
  inspect_observability: "POST /adaptive-memory-observability/inspect";
  execution_influence_supported: false;
  tenant_bypass_supported: false;
  unauthorized_dashboard_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveMemoryObservabilityInput = Readonly<{
  scenario?: ObservabilityScenario;
  lifecycle_result?: MemoryLifecycleResult;
}>;

export type AdaptiveMemoryObservabilityResult = Readonly<{
  adaptive_memory_observability_version: "adaptive-memory-observability/v1";
  platform_identifier: "AdaptiveMemoryObservability";
  status: AdaptiveMemoryObservabilityStatus;
  api_surface: AdaptiveMemoryObservabilityApiSurface;
  lifecycle_result: MemoryLifecycleResult;
  contract: AdaptiveMemoryObservabilityContract;
  validation_reports: readonly ObservabilityValidationReport[];
  metrics: AdaptiveMemoryMetrics;
  retrieval_analytics: RetrievalAnalytics;
  reuse_analytics: ReuseAnalytics;
  governance_dashboard: GovernanceDashboard;
  replay_observability: ReplayObservability;
  similarity_observability: SimilarityObservability;
  health: MemoryHealthIndicator;
  alerts: readonly ObservabilityAlert[];
  observability_ledger: readonly ObservabilityLedgerEntry[];
  operational_metrics: ObservabilityOperationalMetrics;
  failures: readonly ObservabilityFailure[];
  deterministic: boolean;
  replayable: boolean;
  telemetry_complete: boolean;
  dashboard_consistent: boolean;
  tenant_isolation_preserved: boolean;
  privacy_preserved: boolean;
  execution_influence_prevented: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveMemoryObservabilityPlatform = Readonly<{
  adaptive_memory_observability_version: "adaptive-memory-observability/v1";
  supported_validators: readonly ObservabilityValidator[];
  supported_health_states: readonly ObservabilityHealthState[];
  api_surface: AdaptiveMemoryObservabilityApiSurface;
  result: AdaptiveMemoryObservabilityResult;
}>;
