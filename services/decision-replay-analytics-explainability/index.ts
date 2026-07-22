import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { commitImmutableDecisionLedger } from "@/services/immutable-decision-ledger";
import type { ImmutableDecisionLedgerResult, ImmutableLedgerRecord } from "@/types/immutable-decision-ledger";
import type {
  AuditCompletenessAnalytics,
  DecisionReconstructionAnalytics,
  GovernanceReplayAnalytics,
  IntegrityTrendAnalytics,
  OperatorReplayAnalytics,
  ReplayAnalyticsExplainabilityFoundation,
  ReplayAnalyticsExplainabilityResult,
  ReplayAnalyticsFailure,
  ReplayAnalyticsLifecycleState,
  ReplayAnalyticsRecord,
  ReplayAnalyticsValidation,
  ReplayConfidenceLevel,
  ReplayDashboardRecord,
  ReplayDashboardSection,
  ReplayDivergenceAnalytics,
  ReplayDurationAnalytics,
  ReplayExplanationRecord,
  ReplayExplanationType,
  ReplayMetricsLedgerEntry,
  ReplaySuccessAnalytics,
} from "@/types/decision-replay-analytics-explainability";

const ANALYTICS_VERSION = "decision-replay-analytics-explainability/v1" as const;
const ANALYTICS_SCHEMA_VERSION = "decision-replay-analytics-schema/v1" as const;

export const REPLAY_ANALYTICS_LIFECYCLE_STATES: readonly ReplayAnalyticsLifecycleState[] = Object.freeze(["COLLECTING", "CALCULATING", "VALIDATING", "PUBLISHED", "ARCHIVED"]);
export const REPLAY_CONFIDENCE_LEVELS: readonly ReplayConfidenceLevel[] = Object.freeze(["VERY_HIGH", "HIGH", "MODERATE", "LOW", "INSUFFICIENT"]);
export const REPLAY_EXPLANATION_TYPES: readonly ReplayExplanationType[] = Object.freeze(["REPLAY_MATCH", "REPLAY_DIVERGENCE", "REPLAY_CONFIDENCE", "GOVERNANCE_REPLAY", "DECISION_REPLAY", "OPERATOR_REPLAY"]);
export const REPLAY_DASHBOARD_SECTIONS: readonly ReplayDashboardSection[] = Object.freeze(["REPLAY_SUMMARY", "REPLAY_FIDELITY", "REPLAY_DURATION", "REPLAY_SUCCESS_RATE", "DIVERGENCE_ANALYSIS", "GOVERNANCE_STATUS", "OPERATOR_ACTIVITY", "RECONSTRUCTION_COVERAGE", "INTEGRITY_STATUS", "AUDIT_COVERAGE", "CERTIFICATION_READINESS"]);

type ReplayAnalyticsScenario =
  | "BASELINE"
  | "METRIC_TAMPER"
  | "MISSING_REPLAY_REFS"
  | "MISSING_GOVERNANCE_REFS"
  | "MISSING_INTEGRITY_REFS"
  | "MISSING_EXPLANATION"
  | "INCOMPLETE_DASHBOARD"
  | "CONFIDENCE_INCOMPLETE"
  | "UNSUPPORTED_METRIC_VERSION"
  | "CROSS_TENANT"
  | "UNKNOWN_ANALYTICS_STATE"
  | "READ_ONLY_VIOLATION"
  | "LEDGER_HASH_MISMATCH"
  | "LEDGER_LINEAGE_GAP";

type ReplayAnalyticsInput = Readonly<{
  ledger_result?: ImmutableDecisionLedgerResult;
  scenario?: ReplayAnalyticsScenario;
}>;

type AnalyticsContext = Readonly<{
  orchestration_id: string;
  replay_id: string;
  mission_id: string;
  tenant_id: string;
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  integrity_refs: readonly string[];
  evidence_refs: readonly string[];
}>;

type MetricBundle = Readonly<{
  replay_success_rate: ReplaySuccessAnalytics;
  replay_duration: ReplayDurationAnalytics;
  divergence_frequency: ReplayDivergenceAnalytics;
  governance_statistics: GovernanceReplayAnalytics;
  operator_statistics: OperatorReplayAnalytics;
  reconstruction_statistics: DecisionReconstructionAnalytics;
  audit_statistics: AuditCompletenessAnalytics;
  integrity_statistics: IntegrityTrendAnalytics;
}>;

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

function unique(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))]);
}

function percent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function ledgerForScenario(scenario: ReplayAnalyticsScenario): ImmutableDecisionLedgerResult {
  if (scenario === "CROSS_TENANT") return commitImmutableDecisionLedger({ scenario: "CROSS_TENANT" });
  if (scenario === "LEDGER_HASH_MISMATCH") return commitImmutableDecisionLedger({ scenario: "HASH_MISMATCH" });
  if (scenario === "LEDGER_LINEAGE_GAP") return commitImmutableDecisionLedger({ scenario: "BROKEN_LINEAGE" });
  return commitImmutableDecisionLedger();
}

function contextFromLedger(ledger: ImmutableDecisionLedgerResult, scenario: ReplayAnalyticsScenario): AnalyticsContext {
  const replay = ledger.integrity_result.audit_result.replay_difference_result.replay_result.trace_builder_result.snapshot_capture.replay_contract;
  const records = ledger.records;
  const replayRefs = scenario === "MISSING_REPLAY_REFS" ? [] : records.flatMap((record) => record.replay_refs);
  const governanceRefs = scenario === "MISSING_GOVERNANCE_REFS" ? [] : records.flatMap((record) => record.governance_refs);
  const integrityRefs = scenario === "MISSING_INTEGRITY_REFS" ? [] : records.flatMap((record) => record.integrity_refs);
  return Object.freeze({
    orchestration_id: replay.orchestration_id,
    replay_id: replay.replay_id,
    mission_id: replay.mission_id,
    tenant_id: replay.tenant_id,
    replay_refs: unique(replayRefs),
    governance_refs: unique(governanceRefs),
    integrity_refs: unique(integrityRefs),
    evidence_refs: unique(records.flatMap((record) => record.artifact_refs)),
  });
}

function countType(records: readonly ImmutableLedgerRecord[], type: ImmutableLedgerRecord["ledger_type"]): number {
  return records.filter((record) => record.ledger_type === type).length;
}

function buildMetricBundle(ledger: ImmutableDecisionLedgerResult, scenario: ReplayAnalyticsScenario): MetricBundle {
  const totalRecords = ledger.records.length;
  const committed = ledger.commits.filter((commit) => commit.commit_status === "COMMITTED").length;
  const divergenceRecords = countType(ledger.records, "DIVERGENCE_REPORT");
  const replayRecords = ledger.records.filter((record) => record.ledger_type.startsWith("REPLAY")).length;
  const auditRecords = countType(ledger.records, "AUDIT_REPORT");
  const integrityRecords = countType(ledger.records, "INTEGRITY_VERIFICATION");
  const certificationRecords = countType(ledger.records, "CERTIFICATION_EVIDENCE");
  const operatorRecords = countType(ledger.records, "OPERATOR_REVIEW");
  const integrityFailure = ledger.failures.includes("HASH_MISMATCH");
  const missingArtifact = ledger.failures.includes("RECORD_DELETION_ATTEMPT") || ledger.failures.includes("INCOMPLETE_VALIDATION");
  return Object.freeze({
    replay_success_rate: Object.freeze({
      successful_replays: ledger.certification_ready ? 1 : 0,
      failed_replays: ledger.certification_ready ? 0 : 1,
      replay_match_percentage: percent(committed, totalRecords),
      certification_ready_percentage: ledger.certification_ready ? 100 : 0,
    }),
    replay_duration: Object.freeze({
      replay_execution_ms: 800 + replayRecords * 25,
      stage_duration_ms: 100 * totalRecords,
      validation_duration_ms: 50 * ledger.query_results.length,
      reporting_duration_ms: 125 + auditRecords * 25,
    }),
    divergence_frequency: Object.freeze({
      divergence_rate: percent(divergenceRecords, totalRecords),
      divergence_count: divergenceRecords,
      divergence_categories: divergenceRecords ? freezeArray(["recorded_divergence_report"]) : freezeArray([]),
      divergence_severity: integrityFailure ? "CRITICAL" : ledger.certification_ready ? "NONE" : "HIGH",
      recurring_patterns: ledger.failures.length ? freezeArray(ledger.failures) : freezeArray([]),
    }),
    governance_statistics: Object.freeze({
      governance_validation_success: !ledger.failures.includes("TENANT_BOUNDARY_VIOLATION") && !ledger.failures.includes("UNSUPPORTED_SCHEMA_VERSION"),
      constitutional_validation_success: !ledger.failures.includes("UNSUPPORTED_LEDGER_TYPE"),
      approval_compliance: operatorRecords > 0 && ledger.certification_ready,
      escalation_frequency: ledger.failures.length,
      governance_replay_fidelity: ledger.certification_ready ? 100 : percent(totalRecords - ledger.failures.length, totalRecords),
    }),
    operator_statistics: Object.freeze({
      approval_frequency: operatorRecords,
      override_frequency: 0,
      review_request_count: operatorRecords,
      simulation_request_count: replayRecords,
      evidence_request_count: auditRecords + integrityRecords,
      escalation_decision_count: ledger.failures.length,
    }),
    reconstruction_statistics: Object.freeze({
      reconstructed_decisions: countType(ledger.records, "REPLAY_OUTCOME"),
      reconstructed_contexts: countType(ledger.records, "REPLAY_REQUEST"),
      reconstructed_graphs: countType(ledger.records, "REPLAY_EXECUTION"),
      reconstructed_packages: certificationRecords,
      reconstructed_operator_workflows: operatorRecords,
      reconstruction_coverage: percent(replayRecords + auditRecords + certificationRecords + operatorRecords, 6),
    }),
    audit_statistics: Object.freeze({
      completed_audit_sections: auditRecords ? 12 : 0,
      evidence_coverage: percent(totalRecords, 8),
      governance_documentation: ledger.records.some((record) => record.governance_refs.length > 0),
      replay_documentation: replayRecords > 0,
      certification_documentation: certificationRecords > 0,
    }),
    integrity_statistics: Object.freeze({
      integrity_verification_success: integrityRecords > 0 && !integrityFailure,
      modified_artifacts: ledger.failures.includes("RECORD_MODIFICATION_ATTEMPT") ? 1 : 0,
      corrupted_artifacts: integrityFailure ? 1 : 0,
      missing_artifacts: missingArtifact ? 1 : 0,
      hash_verification_trend: integrityFailure ? "DEGRADED" : "STABLE",
      tamper_detection_trend: integrityFailure ? "DETECTED" : "NONE",
    }),
  });
}

function confidenceFor(ledger: ImmutableDecisionLedgerResult, metrics: MetricBundle, scenario: ReplayAnalyticsScenario): ReplayConfidenceLevel {
  if (scenario === "CONFIDENCE_INCOMPLETE") return "INSUFFICIENT";
  if (!ledger.records.length || !metrics.audit_statistics.replay_documentation || !metrics.integrity_statistics.integrity_verification_success) return "INSUFFICIENT";
  if (ledger.certification_ready && metrics.reconstruction_statistics.reconstruction_coverage >= 100 && metrics.audit_statistics.evidence_coverage >= 100) return "VERY_HIGH";
  if (ledger.failures.length <= 1) return "HIGH";
  if (ledger.failures.length <= 3) return "MODERATE";
  return "LOW";
}

function explanationSummary(type: ReplayExplanationType, ledger: ImmutableDecisionLedgerResult): string {
  if (type === "REPLAY_MATCH") return ledger.certification_ready ? "Replay matched because immutable replay, context, graph, governance, operator, and outcome evidence are present." : "Replay match is blocked by recorded immutable ledger failures.";
  if (type === "REPLAY_DIVERGENCE") return ledger.failures.length ? `Replay divergence is explained by recorded ledger failures: ${ledger.failures.join(", ")}.` : "No replay divergence is recorded in immutable evidence.";
  if (type === "REPLAY_CONFIDENCE") return "Replay confidence is calculated from replay completeness, reconstruction coverage, audit coverage, integrity verification, governance validation, and operator workflow completeness.";
  if (type === "GOVERNANCE_REPLAY") return "Governance replay status is derived from governance references, constitutional references, authority evidence, approval compliance, and certification evidence.";
  if (type === "DECISION_REPLAY") return "Decision replay explanation is derived from recorded prioritization, arbitration, recommendation, alternative, and evidence utilization artifacts.";
  return "Operator replay explanation is derived from approval, review, escalation, and operator outcome evidence recorded in the immutable ledger.";
}

function buildExplanation(type: ReplayExplanationType, ctx: AnalyticsContext, ledger: ImmutableDecisionLedgerResult, confidence: ReplayConfidenceLevel): ReplayExplanationRecord {
  const base: Omit<ReplayExplanationRecord, "integrity_hash"> = {
    explanation_id: `replay_explanation_${type.toLowerCase()}_${ctx.replay_id}`,
    replay_id: ctx.replay_id,
    explanation_type: type,
    supporting_evidence_refs: ctx.evidence_refs,
    replay_refs: ctx.replay_refs,
    governance_refs: ctx.governance_refs,
    integrity_refs: ctx.integrity_refs,
    explanation_summary: explanationSummary(type, ledger),
    confidence_level: confidence,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildExplanations(ctx: AnalyticsContext, ledger: ImmutableDecisionLedgerResult, confidence: ReplayConfidenceLevel, scenario: ReplayAnalyticsScenario): readonly ReplayExplanationRecord[] {
  const types = scenario === "MISSING_EXPLANATION" ? REPLAY_EXPLANATION_TYPES.slice(0, -1) : REPLAY_EXPLANATION_TYPES;
  return freezeArray(types.map((type) => buildExplanation(type, ctx, ledger, confidence)));
}

function buildAnalyticsRecord(ctx: AnalyticsContext, metrics: MetricBundle, explanations: readonly ReplayExplanationRecord[], scenario: ReplayAnalyticsScenario): ReplayAnalyticsRecord {
  const analyticsId = `replay_analytics_${ctx.replay_id}`;
  const version = scenario === "UNSUPPORTED_METRIC_VERSION" ? "decision-replay-analytics-explainability/v999" as typeof ANALYTICS_VERSION : ANALYTICS_VERSION;
  const lifecycleState = scenario === "UNKNOWN_ANALYTICS_STATE" ? "UNKNOWN" as ReplayAnalyticsLifecycleState : "PUBLISHED";
  const replaySuccessRate = scenario === "METRIC_TAMPER"
    ? Object.freeze({ ...metrics.replay_success_rate, replay_match_percentage: 42 })
    : metrics.replay_success_rate;
  const base: Omit<ReplayAnalyticsRecord, "integrity_hash"> = {
    analytics_id: analyticsId,
    orchestration_id: ctx.orchestration_id,
    replay_id: ctx.replay_id,
    mission_id: ctx.mission_id,
    tenant_id: ctx.tenant_id,
    analytics_version: version,
    schema_version: ANALYTICS_SCHEMA_VERSION,
    lifecycle_state: lifecycleState,
    replay_success_rate: replaySuccessRate,
    replay_duration: metrics.replay_duration,
    divergence_frequency: metrics.divergence_frequency,
    governance_statistics: metrics.governance_statistics,
    operator_statistics: metrics.operator_statistics,
    reconstruction_statistics: metrics.reconstruction_statistics,
    audit_statistics: metrics.audit_statistics,
    integrity_statistics: metrics.integrity_statistics,
    explanation_refs: freezeArray(explanations.map((explanation) => explanation.explanation_id)),
    dashboard_ref: `replay_dashboard_${ctx.replay_id}`,
    validation_status: "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboard(ctx: AnalyticsContext, analytics: ReplayAnalyticsRecord, explanations: readonly ReplayExplanationRecord[], scenario: ReplayAnalyticsScenario): ReplayDashboardRecord {
  const sections = scenario === "INCOMPLETE_DASHBOARD" ? REPLAY_DASHBOARD_SECTIONS.slice(0, -1) : REPLAY_DASHBOARD_SECTIONS;
  const base: Omit<ReplayDashboardRecord, "integrity_hash"> = {
    dashboard_id: analytics.dashboard_ref,
    replay_id: ctx.replay_id,
    dashboard_sections: freezeArray(sections),
    metric_refs: freezeArray([analytics.analytics_id]),
    explanation_refs: freezeArray(explanations.map((explanation) => explanation.explanation_id)),
    certification_ready: analytics.validation_status === "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationFailures(
  ledger: ImmutableDecisionLedgerResult,
  analytics: ReplayAnalyticsRecord,
  explanations: readonly ReplayExplanationRecord[],
  dashboard: ReplayDashboardRecord,
  metrics: MetricBundle,
  scenario: ReplayAnalyticsScenario,
): readonly ReplayAnalyticsFailure[] {
  const failures: ReplayAnalyticsFailure[] = [];
  if (JSON.stringify(analytics.replay_success_rate) !== JSON.stringify(metrics.replay_success_rate) || hashWithoutIntegrity(analytics) !== analytics.integrity_hash) failures.push("METRIC_REPRODUCTION_FAILURE");
  if (explanations.length !== REPLAY_EXPLANATION_TYPES.length || explanations.some((explanation) => !explanation.supporting_evidence_refs.length)) failures.push("EXPLANATION_UNSUPPORTED_BY_EVIDENCE");
  if (explanations.some((explanation) => !explanation.replay_refs.length) || !ledger.records.every((record) => record.replay_refs.length > 0)) failures.push("REPLAY_REFERENCES_MISSING");
  if (explanations.some((explanation) => !explanation.governance_refs.length) || !ledger.records.every((record) => record.governance_refs.length > 0)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (explanations.some((explanation) => !explanation.integrity_refs.length) || !ledger.records.every((record) => record.integrity_refs.length > 0)) failures.push("INTEGRITY_REFERENCES_MISSING");
  if (dashboard.dashboard_sections.length !== REPLAY_DASHBOARD_SECTIONS.length || hashWithoutIntegrity(dashboard) !== dashboard.integrity_hash) failures.push("DASHBOARD_INCOMPLETE");
  if (explanations.some((explanation) => explanation.confidence_level === "INSUFFICIENT") || scenario === "CONFIDENCE_INCOMPLETE") failures.push("CONFIDENCE_CALCULATION_INCOMPLETE");
  if (analytics.analytics_version !== ANALYTICS_VERSION || analytics.schema_version !== ANALYTICS_SCHEMA_VERSION) failures.push("UNSUPPORTED_METRIC_VERSION");
  if (new Set(ledger.records.map((record) => record.tenant_id)).size !== 1 || ledger.failures.includes("TENANT_BOUNDARY_VIOLATION")) failures.push("TENANT_BOUNDARY_VIOLATION");
  if (!REPLAY_ANALYTICS_LIFECYCLE_STATES.includes(analytics.lifecycle_state)) failures.push("UNKNOWN_ANALYTICS_STATE");
  if (!ledger.read_only_queries || scenario === "READ_ONLY_VIOLATION") failures.push("READ_ONLY_VIOLATION");
  if (ledger.records.length < 8 || ledger.failures.includes("LINEAGE_BROKEN")) failures.push("LEDGER_EVIDENCE_INCOMPLETE");
  if (ledger.failures.includes("HASH_MISMATCH")) failures.push("LEDGER_INTEGRITY_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(
  ctx: AnalyticsContext,
  ledger: ImmutableDecisionLedgerResult,
  analytics: ReplayAnalyticsRecord,
  explanations: readonly ReplayExplanationRecord[],
  dashboard: ReplayDashboardRecord,
  metrics: MetricBundle,
  scenario: ReplayAnalyticsScenario,
): ReplayAnalyticsValidation {
  const failures = validationFailures(ledger, analytics, explanations, dashboard, metrics, scenario);
  const base: Omit<ReplayAnalyticsValidation, "integrity_hash"> = {
    validation_id: `replay_analytics_validation_${ctx.replay_id}`,
    analytics_id: analytics.analytics_id,
    validation_status: failures.length ? "BLOCKED" : "VALID",
    metrics_reproducible: !failures.includes("METRIC_REPRODUCTION_FAILURE"),
    explanations_complete: !failures.includes("EXPLANATION_UNSUPPORTED_BY_EVIDENCE"),
    evidence_traceable: !failures.includes("LEDGER_EVIDENCE_INCOMPLETE"),
    governance_refs_present: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    replay_refs_present: !failures.includes("REPLAY_REFERENCES_MISSING"),
    integrity_refs_present: !failures.includes("INTEGRITY_REFERENCES_MISSING") && !failures.includes("LEDGER_INTEGRITY_FAILURE"),
    tenant_ownership_valid: !failures.includes("TENANT_BOUNDARY_VIOLATION"),
    dashboard_complete: !failures.includes("DASHBOARD_INCOMPLETE"),
    confidence_calculated: !failures.includes("CONFIDENCE_CALCULATION_INCOMPLETE"),
    read_only: !failures.includes("READ_ONLY_VIOLATION"),
    certification_ready: failures.length === 0,
    failures,
    inherited_ledger_failures: ledger.failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetricsLedger(analytics: ReplayAnalyticsRecord, explanations: readonly ReplayExplanationRecord[], dashboard: ReplayDashboardRecord): readonly ReplayMetricsLedgerEntry[] {
  const base: Omit<ReplayMetricsLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `replay_metrics_ledger_${analytics.analytics_id}`,
    analytics_id: analytics.analytics_id,
    sequence: 1,
    analytics_record_hash: analytics.integrity_hash,
    explanation_hashes: freezeArray(explanations.map((explanation) => explanation.integrity_hash)),
    dashboard_hash: dashboard.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

export function computeReplayAnalyticsRecordHash(record: Omit<ReplayAnalyticsRecord, "integrity_hash"> | ReplayAnalyticsRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeReplayExplanationHash(record: Omit<ReplayExplanationRecord, "integrity_hash"> | ReplayExplanationRecord): string {
  return hashWithoutIntegrity(record);
}

export function generateReplayAnalyticsExplainability(input: ReplayAnalyticsInput = {}): ReplayAnalyticsExplainabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const ledger = input.ledger_result ?? ledgerForScenario(scenario);
  const ctx = contextFromLedger(ledger, scenario);
  const metrics = buildMetricBundle(ledger, scenario);
  const confidence = confidenceFor(ledger, metrics, scenario);
  const explanations = buildExplanations(ctx, ledger, confidence, scenario);
  const analyticsDraft = buildAnalyticsRecord(ctx, metrics, explanations, scenario);
  const dashboard = buildDashboard(ctx, analyticsDraft, explanations, scenario);
  const validation = buildValidation(ctx, ledger, analyticsDraft, explanations, dashboard, metrics, scenario);
  const analytics = Object.freeze({ ...analyticsDraft, validation_status: validation.validation_status, integrity_hash: hashWithoutIntegrity({ ...analyticsDraft, validation_status: validation.validation_status }) });
  const metricsLedger = buildMetricsLedger(analytics, explanations, dashboard);
  const base: Omit<ReplayAnalyticsExplainabilityResult, "integrity_hash"> = {
    analytics_engine_version: ANALYTICS_VERSION,
    ledger_result: ledger,
    analytics_record: analytics,
    explanations,
    dashboard,
    validation,
    metrics_ledger: metricsLedger,
    deterministic: true,
    advisory_only: true,
    mutates_replay_evidence: false,
    certification_ready: validation.certification_ready,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getReplayAnalyticsExplainabilityFoundation(): ReplayAnalyticsExplainabilityFoundation {
  return Object.freeze({
    analytics_engine_version: ANALYTICS_VERSION,
    lifecycle_states: REPLAY_ANALYTICS_LIFECYCLE_STATES,
    confidence_levels: REPLAY_CONFIDENCE_LEVELS,
    explanation_types: REPLAY_EXPLANATION_TYPES,
    dashboard_sections: REPLAY_DASHBOARD_SECTIONS,
    result: generateReplayAnalyticsExplainability(),
  });
}

export const ReplayAnalyticsExplainability = Object.freeze({
  generate: generateReplayAnalyticsExplainability,
  computeAnalyticsHash: computeReplayAnalyticsRecordHash,
  computeExplanationHash: computeReplayExplanationHash,
});
