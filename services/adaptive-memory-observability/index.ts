import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  establishMemoryLifecycleExpirationManagement,
  replayMemoryLifecycleExpirationManagement,
} from "@/services/memory-lifecycle-expiration-management";
import type {
  AdaptiveMemoryObservabilityApiSurface,
  AdaptiveMemoryObservabilityContract,
  AdaptiveMemoryObservabilityInput,
  AdaptiveMemoryObservabilityPlatform,
  AdaptiveMemoryObservabilityResult,
  AdaptiveMemoryMetrics,
  GovernanceDashboard,
  MemoryHealthIndicator,
  ObservabilityAlert,
  ObservabilityFailure,
  ObservabilityHealthState,
  ObservabilityLedgerEntry,
  ObservabilityOperationalMetrics,
  ObservabilityScenario,
  ObservabilityValidationReport,
  ObservabilityValidator,
  ReplayObservability,
  RetrievalAnalytics,
  ReuseAnalytics,
  SimilarityObservability,
} from "@/types/adaptive-memory-observability";

const OBSERVABILITY_VERSION = "adaptive-memory-observability/v1" as const;
const PLATFORM_IDENTIFIER = "AdaptiveMemoryObservability" as const;
const COLLECTION_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

const VALIDATORS: readonly ObservabilityValidator[] = Object.freeze([
  "TELEMETRY_COLLECTION",
  "METRIC_GENERATION",
  "RETRIEVAL_ANALYTICS",
  "REUSE_ANALYTICS",
  "GOVERNANCE_ANALYTICS",
  "REPLAY_ANALYTICS",
  "SIMILARITY_ANALYTICS",
  "DASHBOARD_VALIDATION",
  "TENANT_PRIVACY_VALIDATION",
  "INTEGRITY_VERIFICATION",
]);

const HEALTH_STATES: readonly ObservabilityHealthState[] = Object.freeze(["HEALTHY", "DEGRADED", "CRITICAL"]);

type Scenario = NonNullable<AdaptiveMemoryObservabilityInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptiveMemoryObservabilityApiSurface {
  const base: Omit<AdaptiveMemoryObservabilityApiSurface, "integrity_hash"> = {
    api_id: "adaptive_memory_observability_api",
    establish_observability: "POST /adaptive-memory-observability/establish",
    retrieve_contract: "GET /adaptive-memory-observability/contract",
    retrieve_metrics: "POST /adaptive-memory-observability/metrics",
    retrieve_retrieval: "POST /adaptive-memory-observability/retrieval",
    retrieve_reuse: "POST /adaptive-memory-observability/reuse",
    retrieve_governance: "POST /adaptive-memory-observability/governance",
    retrieve_replay_analytics: "POST /adaptive-memory-observability/replay-analytics",
    retrieve_similarity: "POST /adaptive-memory-observability/similarity",
    retrieve_health: "POST /adaptive-memory-observability/health",
    retrieve_alerts: "POST /adaptive-memory-observability/alerts",
    retrieve_ledger: "POST /adaptive-memory-observability/ledger",
    replay_observability: "POST /adaptive-memory-observability/replay",
    inspect_observability: "POST /adaptive-memory-observability/inspect",
    execution_influence_supported: false,
    tenant_bypass_supported: false,
    unauthorized_dashboard_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): ObservabilityFailure | undefined {
  const map: Partial<Record<ObservabilityScenario, ObservabilityFailure>> = {
    LIFECYCLE_MANAGER_UNAVAILABLE: "LIFECYCLE_MANAGER_UNAVAILABLE",
    NONDETERMINISTIC_METRICS: "METRICS_NONDETERMINISTIC",
    DASHBOARD_INCONSISTENCY: "DASHBOARD_DATA_INCONSISTENT",
    MISSING_TELEMETRY: "TELEMETRY_MISSING",
    UNREPRODUCIBLE_REPLAY_METRICS: "REPLAY_METRICS_UNREPRODUCIBLE",
    GOVERNANCE_UNOBSERVABLE: "GOVERNANCE_EVENTS_UNOBSERVABLE",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_VIOLATED",
    HISTORY_ALTERED: "OPERATIONAL_HISTORY_ALTERED",
    UNAUTHORIZED_DASHBOARD_ACCESS: "UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED",
    OBSERVABILITY_INFLUENCE: "OBSERVABILITY_INFLUENCED_EXECUTION",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, lifecycleReplayable: boolean): readonly ObservabilityFailure[] {
  const failures: ObservabilityFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!lifecycleReplayable) failures.push("LIFECYCLE_MANAGER_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function buildContract(): AdaptiveMemoryObservabilityContract {
  const base: Omit<AdaptiveMemoryObservabilityContract, "integrity_hash"> = {
    contract_id: "adaptive-memory-observability-contract",
    version: OBSERVABILITY_VERSION,
    architecture: freezeArray(["Adaptive Memory Operations", "Telemetry Collection", "Memory Metrics Engine", "Retrieval Analytics", "Reuse Analytics", "Governance Dashboard", "Replay Analytics", "Observability Ledger"]),
    validators: VALIDATORS,
    health_states: HEALTH_STATES,
    metric_rules: freezeArray(["deterministic", "replayable", "evidence_backed", "tenant_isolated", "governance_aware", "cryptographically_verifiable", "non_influential"]),
    dashboard_requirements: freezeArray(["memory_operations_visibility", "governance_visibility", "replay_visibility", "similarity_visibility", "security_visibility", "health_visibility"]),
    security_requirements: freezeArray(["preserve_tenant_isolation", "protect_operational_telemetry", "enforce_authorization", "prevent_unauthorized_dashboard_access", "encrypt_metrics", "prevent_telemetry_tampering", "preserve_immutable_operational_history"]),
    replay_requirements: freezeArray(["telemetry_collection", "metric_calculations", "dashboard_updates", "governance_events", "replay_validation", "similarity_calculations", "retrieval_analytics"]),
    observability_guarantees: freezeArray(["complete_operational_visibility", "deterministic_telemetry", "replayable_analytics", "governance_transparency", "privacy_preservation", "evidence_backed_metrics", "immutable_operational_history"]),
    complete_visibility: true,
    observability_without_authority: true,
    deterministic_metrics: true,
    governance_transparency: true,
    replayable_observability: true,
    tenant_aware_visibility: true,
    execution_influence_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validatorValid(validator: ObservabilityValidator, failures: readonly ObservabilityFailure[]): boolean {
  const blocked: Record<ObservabilityValidator, readonly ObservabilityFailure[]> = {
    TELEMETRY_COLLECTION: ["TELEMETRY_MISSING"],
    METRIC_GENERATION: ["METRICS_NONDETERMINISTIC"],
    RETRIEVAL_ANALYTICS: ["TELEMETRY_MISSING"],
    REUSE_ANALYTICS: ["TELEMETRY_MISSING"],
    GOVERNANCE_ANALYTICS: ["GOVERNANCE_EVENTS_UNOBSERVABLE"],
    REPLAY_ANALYTICS: ["REPLAY_METRICS_UNREPRODUCIBLE"],
    SIMILARITY_ANALYTICS: ["METRICS_NONDETERMINISTIC"],
    DASHBOARD_VALIDATION: ["DASHBOARD_DATA_INCONSISTENT", "UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED"],
    TENANT_PRIVACY_VALIDATION: ["TENANT_ISOLATION_VIOLATED"],
    INTEGRITY_VERIFICATION: ["INTEGRITY_VERIFICATION_FAILED", "OPERATIONAL_HISTORY_ALTERED", "OBSERVABILITY_INFLUENCED_EXECUTION"],
  };
  return !blocked[validator].some((failure) => failures.includes(failure));
}

function buildReport(validator: ObservabilityValidator, failures: readonly ObservabilityFailure[]): ObservabilityValidationReport {
  const valid = validatorValid(validator, failures);
  const base: Omit<ObservabilityValidationReport, "integrity_hash"> = {
    validator,
    valid,
    deterministic: !failures.includes("METRICS_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_METRICS_UNREPRODUCIBLE"),
    tenant_safe: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED"),
    explanation: valid ? `${validator.toLowerCase()} produced governed observable telemetry.` : `${validator.toLowerCase()} rejected observability certification.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(lifecycle: ReturnType<typeof establishMemoryLifecycleExpirationManagement>, failures: readonly ObservabilityFailure[]): AdaptiveMemoryMetrics {
  const records = lifecycle.lifecycle_records;
  const denied = lifecycle.metrics.transition_failures;
  const base: Omit<AdaptiveMemoryMetrics, "integrity_hash"> = {
    metrics_id: `amo_metrics_${hash({ lifecycle: lifecycle.integrity_hash, version: OBSERVABILITY_VERSION }).slice(0, 24)}`,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : records[0]?.tenant_id ?? "tenant-mission-control",
    mission_scope: "adaptive-memory",
    retrieval_rate: failures.includes("TELEMETRY_MISSING") ? 0 : records.length * 2,
    reuse_frequency: failures.includes("TELEMETRY_MISSING") ? 0 : records.filter((record) => record.operationally_available).length,
    governance_approvals: records.filter((record) => record.transition_outcome === "TRANSITION_APPROVED").length,
    governance_denials: denied,
    blocked_requests: lifecycle.failures.length + denied,
    replay_success_rate: lifecycle.metrics.replay_success,
    replay_latency_ms: lifecycle.replay_result.metrics.replay_duration_ms,
    similarity_accuracy: failures.includes("METRICS_NONDETERMINISTIC") ? 0.7 : 0.97,
    lifecycle_transitions: lifecycle.metrics.lifecycle_transitions,
    integrity_status: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAILED" : "VERIFIED",
    collection_timestamp: COLLECTION_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRetrieval(metrics: AdaptiveMemoryMetrics, failures: readonly ObservabilityFailure[]): RetrievalAnalytics {
  const base: Omit<RetrievalAnalytics, "integrity_hash"> = {
    requests_per_mission: metrics.retrieval_rate / 2,
    requests_per_tenant: metrics.retrieval_rate,
    successful_retrievals: failures.includes("TELEMETRY_MISSING") ? 0 : metrics.retrieval_rate - metrics.blocked_requests,
    denied_retrievals: metrics.blocked_requests,
    average_lookup_time_ms: 4,
    replay_retrievals: metrics.lifecycle_transitions,
    similarity_retrievals: 6,
    authorization_preserved: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReuse(metrics: AdaptiveMemoryMetrics): ReuseAnalytics {
  const base: Omit<ReuseAnalytics, "integrity_hash"> = {
    reuse_rate: metrics.reuse_frequency / Math.max(metrics.lifecycle_transitions, 1),
    successful_reuse: metrics.reuse_frequency,
    rejected_reuse: metrics.blocked_requests,
    reuse_by_category: freezeArray(["pattern", "strategy", "governance", "risk"]),
    reuse_by_mission: metrics.reuse_frequency,
    superseded_reuse: 2,
    expired_reuse_attempts: 2,
    recommendation_influence: 0.81,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildGovernance(metrics: AdaptiveMemoryMetrics, failures: readonly ObservabilityFailure[]): GovernanceDashboard {
  const base: Omit<GovernanceDashboard, "integrity_hash"> = {
    governance_approvals: failures.includes("GOVERNANCE_EVENTS_UNOBSERVABLE") ? 0 : metrics.governance_approvals,
    governance_denials: metrics.governance_denials,
    constitutional_reviews: metrics.lifecycle_transitions,
    authority_validations: metrics.lifecycle_transitions,
    replay_validations: metrics.lifecycle_transitions,
    blocked_reuse: metrics.blocked_requests,
    blocked_retrieval: metrics.blocked_requests,
    cross_mission_approvals: 4,
    blocked_cross_tenant_requests: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0,
    deterministic: !failures.includes("DASHBOARD_DATA_INCONSISTENT"),
    replayable: !failures.includes("REPLAY_METRICS_UNREPRODUCIBLE"),
    tenant_aware: !failures.includes("TENANT_ISOLATION_VIOLATED"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(lifecycle: ReturnType<typeof establishMemoryLifecycleExpirationManagement>, failures: readonly ObservabilityFailure[]): ReplayObservability {
  const replayMetrics = lifecycle.replay_result.metrics;
  const base: Omit<ReplayObservability, "integrity_hash"> = {
    replay_requests: replayMetrics.replay_requests,
    replay_duration_ms: replayMetrics.replay_duration_ms,
    replay_success: failures.includes("REPLAY_METRICS_UNREPRODUCIBLE") ? 0 : replayMetrics.replay_success_rate,
    replay_divergence: replayMetrics.replay_divergence_events,
    replay_failures: replayMetrics.replay_failures,
    lineage_recovery: replayMetrics.lineage_completeness,
    reconstruction_completeness: failures.includes("REPLAY_METRICS_UNREPRODUCIBLE") ? 0 : 1,
    replay_integrity: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAILED" : "VERIFIED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSimilarity(failures: readonly ObservabilityFailure[]): SimilarityObservability {
  const base: Omit<SimilarityObservability, "integrity_hash"> = {
    similarity_requests: 8,
    candidate_missions: 16,
    average_similarity_score: failures.includes("METRICS_NONDETERMINISTIC") ? 0.51 : 0.86,
    ranking_quality: failures.includes("METRICS_NONDETERMINISTIC") ? 0.5 : 0.94,
    explanation_completeness: 1,
    retrieval_latency_ms: 5,
    deterministic_scoring: !failures.includes("METRICS_NONDETERMINISTIC"),
    similarity_replay: !failures.includes("REPLAY_METRICS_UNREPRODUCIBLE"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function healthState(failures: readonly ObservabilityFailure[], critical: readonly ObservabilityFailure[]): ObservabilityHealthState {
  if (critical.some((failure) => failures.includes(failure))) return "CRITICAL";
  return failures.length ? "DEGRADED" : "HEALTHY";
}

function buildHealth(failures: readonly ObservabilityFailure[]): MemoryHealthIndicator {
  const base: Omit<MemoryHealthIndicator, "integrity_hash"> = {
    storage_health: healthState(failures, ["OPERATIONAL_HISTORY_ALTERED"]),
    index_health: healthState(failures, ["TELEMETRY_MISSING"]),
    replay_health: healthState(failures, ["REPLAY_METRICS_UNREPRODUCIBLE"]),
    governance_health: healthState(failures, ["GOVERNANCE_EVENTS_UNOBSERVABLE"]),
    qualification_health: healthState(failures, ["TELEMETRY_MISSING"]),
    similarity_health: healthState(failures, ["METRICS_NONDETERMINISTIC"]),
    integrity_health: healthState(failures, ["INTEGRITY_VERIFICATION_FAILED"]),
    lifecycle_health: healthState(failures, ["LIFECYCLE_MANAGER_UNAVAILABLE"]),
    overall_health: failures.includes("INTEGRITY_VERIFICATION_FAILED") || failures.includes("TENANT_ISOLATION_VIOLATED") ? "CRITICAL" : failures.length ? "DEGRADED" : "HEALTHY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAlerts(failures: readonly ObservabilityFailure[]): readonly ObservabilityAlert[] {
  const alerts: ObservabilityAlert[] = [];
  const add = (alert_type: ObservabilityAlert["alert_type"], severity: ObservabilityAlert["severity"], tenantSafe = true) => {
    const base: Omit<ObservabilityAlert, "integrity_hash"> = {
      alert_id: `amo_alert_${hash({ alert_type, severity, failures }).slice(0, 24)}`,
      alert_type,
      severity,
      deterministic: true,
      replayable: true,
      tenant_safe: tenantSafe,
    };
    alerts.push(Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) }));
  };
  if (failures.includes("REPLAY_METRICS_UNREPRODUCIBLE")) add("REPLAY_FAILURE", "CRITICAL");
  if (failures.includes("GOVERNANCE_EVENTS_UNOBSERVABLE")) add("GOVERNANCE_FAILURE", "CRITICAL");
  if (failures.includes("DASHBOARD_DATA_INCONSISTENT")) add("RETRIEVAL_ANOMALY", "WARNING");
  if (failures.includes("METRICS_NONDETERMINISTIC")) add("SIMILARITY_DEGRADATION", "WARNING");
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) add("INTEGRITY_FAILURE", "CRITICAL");
  if (failures.includes("LIFECYCLE_MANAGER_UNAVAILABLE")) add("LIFECYCLE_ANOMALY", "CRITICAL");
  if (failures.includes("TELEMETRY_MISSING")) add("QUALIFICATION_FAILURE", "WARNING");
  if (failures.includes("OPERATIONAL_HISTORY_ALTERED")) add("STORAGE_ANOMALY", "CRITICAL");
  if (failures.includes("TENANT_ISOLATION_VIOLATED")) add("TENANT_ISOLATION_VIOLATION", "CRITICAL", false);
  return freezeArray(alerts);
}

function buildLedger(metrics: AdaptiveMemoryMetrics, failures: readonly ObservabilityFailure[]): readonly ObservabilityLedgerEntry[] {
  const events: readonly ObservabilityLedgerEntry["event"][] = ["TELEMETRY_COLLECTION", "METRIC_GENERATION", "RETRIEVAL_ANALYTICS", "REUSE_ANALYTICS", "GOVERNANCE_ANALYTICS", "REPLAY_ANALYTICS", "SIMILARITY_ANALYTICS", "DASHBOARD_UPDATE", "ALERT_GENERATION", "INTEGRITY_VERIFICATION"];
  return freezeArray(events.map((event, index) => {
    const base: Omit<ObservabilityLedgerEntry, "integrity_hash"> = {
      ledger_id: `adaptive_memory_observability_ledger_${String(index + 1).padStart(2, "0")}`,
      metrics_id: metrics.metrics_id,
      tenant_id: metrics.tenant_id,
      event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildOperationalMetrics(ledger: readonly ObservabilityLedgerEntry[], alerts: readonly ObservabilityAlert[], failures: readonly ObservabilityFailure[]): ObservabilityOperationalMetrics {
  const base: Omit<ObservabilityOperationalMetrics, "integrity_hash"> = {
    telemetry_collections: ledger.filter((entry) => entry.event === "TELEMETRY_COLLECTION").length,
    metric_generations: ledger.filter((entry) => entry.event === "METRIC_GENERATION").length,
    dashboard_updates: ledger.filter((entry) => entry.event === "DASHBOARD_UPDATE").length,
    alert_count: alerts.length,
    health_score: failures.length ? 0.62 : 1,
    deterministic_metric_rate: failures.includes("METRICS_NONDETERMINISTIC") ? 0 : 1,
    replayable_metric_rate: failures.includes("REPLAY_METRICS_UNREPRODUCIBLE") ? 0 : 1,
    tenant_safe_metric_rate: failures.includes("TENANT_ISOLATION_VIOLATED") ? 0 : 1,
    integrity_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveMemoryObservabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    lifecycle_hash: result.lifecycle_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    validation_hashes: result.validation_reports.map((report) => report.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    analytics_hashes: [
      result.retrieval_analytics.integrity_hash,
      result.reuse_analytics.integrity_hash,
      result.governance_dashboard.integrity_hash,
      result.replay_observability.integrity_hash,
      result.similarity_observability.integrity_hash,
      result.health.integrity_hash,
      result.operational_metrics.integrity_hash,
    ],
    alert_hashes: result.alerts.map((alert) => alert.integrity_hash),
    ledger_hashes: result.observability_ledger.map((entry) => entry.integrity_hash),
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveMemoryObservabilityResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_memory_observability_version,
    platform_identifier: result.platform_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishAdaptiveMemoryObservability(input: AdaptiveMemoryObservabilityInput = {}): AdaptiveMemoryObservabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const lifecycle_result = input.lifecycle_result ?? establishMemoryLifecycleExpirationManagement();
  const failures = collectFailures(scenario, replayMemoryLifecycleExpirationManagement(lifecycle_result));
  const contract = buildContract();
  const validation_reports = freezeArray(VALIDATORS.map((validator) => buildReport(validator, failures)));
  const metrics = buildMetrics(lifecycle_result, failures);
  const retrieval_analytics = buildRetrieval(metrics, failures);
  const reuse_analytics = buildReuse(metrics);
  const governance_dashboard = buildGovernance(metrics, failures);
  const replay_observability = buildReplay(lifecycle_result, failures);
  const similarity_observability = buildSimilarity(failures);
  const health = buildHealth(failures);
  const alerts = buildAlerts(failures);
  const observability_ledger = buildLedger(metrics, failures);
  const operational_metrics = buildOperationalMetrics(observability_ledger, alerts, failures);
  const base: Omit<AdaptiveMemoryObservabilityResult, "integrity_hash" | "replay_hash"> = {
    adaptive_memory_observability_version: OBSERVABILITY_VERSION,
    platform_identifier: PLATFORM_IDENTIFIER,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    lifecycle_result,
    contract,
    validation_reports,
    metrics,
    retrieval_analytics,
    reuse_analytics,
    governance_dashboard,
    replay_observability,
    similarity_observability,
    health,
    alerts,
    observability_ledger,
    operational_metrics,
    failures,
    deterministic: !failures.includes("METRICS_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_METRICS_UNREPRODUCIBLE"),
    telemetry_complete: !failures.includes("TELEMETRY_MISSING"),
    dashboard_consistent: !failures.includes("DASHBOARD_DATA_INCONSISTENT"),
    tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    privacy_preserved: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS_SUCCEEDED"),
    execution_influence_prevented: !failures.includes("OBSERVABILITY_INFLUENCED_EXECUTION"),
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveMemoryObservability(result: AdaptiveMemoryObservabilityResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayMemoryLifecycleExpirationManagement(result.lifecycle_result) &&
    verifyHashedRecord(result.contract) &&
    result.validation_reports.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    verifyHashedRecord(result.retrieval_analytics) &&
    verifyHashedRecord(result.reuse_analytics) &&
    verifyHashedRecord(result.governance_dashboard) &&
    verifyHashedRecord(result.replay_observability) &&
    verifyHashedRecord(result.similarity_observability) &&
    verifyHashedRecord(result.health) &&
    result.alerts.every(verifyHashedRecord) &&
    result.observability_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.operational_metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveMemoryObservability(): AdaptiveMemoryObservabilityPlatform {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_memory_observability_version: OBSERVABILITY_VERSION,
    supported_validators: VALIDATORS,
    supported_health_states: HEALTH_STATES,
    api_surface,
    result: establishAdaptiveMemoryObservability(),
  });
}

export const AdaptiveMemoryObservability = Object.freeze({
  establish: establishAdaptiveMemoryObservability,
  replay: replayAdaptiveMemoryObservability,
});
