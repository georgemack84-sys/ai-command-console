import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { commitDecisionPackageLedger, replayDecisionPackageLedger } from "@/services/decision-package-ledger";
import type { DecisionPackageLedgerResult } from "@/types/decision-package-ledger";
import type {
  CompletenessMetrics,
  DecisionPackageObservabilityFailureReason,
  DecisionPackageObservabilityFoundation,
  DecisionPackageObservabilityInput,
  DecisionPackageObservabilityMetrics,
  DecisionPackageObservabilityRecord,
  DecisionPackageObservabilityReplay,
  DecisionPackageObservabilityResult,
  DecisionPackageObservabilityState,
  ExplainabilityMetrics,
  ExplainabilityScorecard,
  GenerationAnalyticsRecord,
  ObservabilityLedgerEntry,
  ObservabilityValidationResult,
  OperatorVisibilityReport,
  PackageDashboard,
} from "@/types/decision-package-observability";

const OBSERVABILITY_VERSION = "decision-package-observability/v1" as const;
const AUTHORIZED_COMPONENT = "decision-package-observability";
const NOW = "2026-07-04T01:22:00.000Z";

export const DECISION_PACKAGE_OBSERVABILITY_STATES: readonly DecisionPackageObservabilityState[] = Object.freeze(["INITIALIZED", "COLLECTING", "ANALYZING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);

const REQUIRED_SECTIONS = Object.freeze([
  "recommendation",
  "rationale",
  "evidence",
  "alternatives",
  "rejected options",
  "governance",
  "constitutional summary",
  "authority summary",
  "replay reference",
  "lineage reference",
  "rollback guidance",
  "recovery guidance",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function score(values: readonly boolean[]): number {
  return Number((values.filter(Boolean).length / values.length).toFixed(2));
}

function recordHash(record: Omit<DecisionPackageObservabilityRecord, "integrity_hash"> | DecisionPackageObservabilityRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeDecisionPackageObservabilityRecordHash(record: Omit<DecisionPackageObservabilityRecord, "integrity_hash"> | DecisionPackageObservabilityRecord): string {
  return recordHash(record);
}

function explainabilityHash(record: Omit<ExplainabilityMetrics, "integrity_hash"> | ExplainabilityMetrics): string {
  return hashWithoutIntegrity(record);
}

export function computeExplainabilityMetricsHash(record: Omit<ExplainabilityMetrics, "integrity_hash"> | ExplainabilityMetrics): string {
  return explainabilityHash(record);
}

function completenessHash(record: Omit<CompletenessMetrics, "integrity_hash"> | CompletenessMetrics): string {
  return hashWithoutIntegrity(record);
}

export function computeCompletenessMetricsHash(record: Omit<CompletenessMetrics, "integrity_hash"> | CompletenessMetrics): string {
  return completenessHash(record);
}

function analyticsHash(record: Omit<GenerationAnalyticsRecord, "integrity_hash"> | GenerationAnalyticsRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeGenerationAnalyticsRecordHash(record: Omit<GenerationAnalyticsRecord, "integrity_hash"> | GenerationAnalyticsRecord): string {
  return analyticsHash(record);
}

function visibilityHash(record: Omit<OperatorVisibilityReport, "integrity_hash"> | OperatorVisibilityReport): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorVisibilityReportHash(record: Omit<OperatorVisibilityReport, "integrity_hash"> | OperatorVisibilityReport): string {
  return visibilityHash(record);
}

function dashboardHash(record: Omit<PackageDashboard, "integrity_hash"> | PackageDashboard): string {
  return hashWithoutIntegrity(record);
}

function scorecardHash(record: Omit<ExplainabilityScorecard, "integrity_hash"> | ExplainabilityScorecard): string {
  return hashWithoutIntegrity(record);
}

function validationHash(record: Omit<ObservabilityValidationResult, "integrity_hash"> | ObservabilityValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<ObservabilityLedgerEntry, "ledger_integrity_hash"> | ObservabilityLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function operatorPackage(ledger: DecisionPackageLedgerResult) {
  return ledger.reference_result.workflow_result.compliance_result.forecast_result.evidence_result.package_build_result.package;
}

export function measureCompleteness(ledger: DecisionPackageLedgerResult = commitDecisionPackageLedger()): CompletenessMetrics {
  const pkg = operatorPackage(ledger);
  const reference = ledger.reference_result;
  const completed = [
    pkg.recommended_option.summary ? "recommendation" : "",
    pkg.rationale ? "rationale" : "",
    pkg.evidence_summary ? "evidence" : "",
    pkg.alternative_options.length > 0 ? "alternatives" : "",
    pkg.rejected_options.length > 0 ? "rejected options" : "",
    pkg.governance_summary ? "governance" : "",
    pkg.constitutional_summary ? "constitutional summary" : "",
    pkg.authority_summary ? "authority summary" : "",
    ledger.ledger_record.replay_reference ? "replay reference" : "",
    ledger.ledger_record.lineage_reference ? "lineage reference" : "",
    reference.rollback_plan.rollback_summary ? "rollback guidance" : "",
    reference.recovery_guidance.recovery_summary ? "recovery guidance" : "",
  ].filter((item) => item.length > 0);
  const missing = REQUIRED_SECTIONS.filter((section) => !completed.includes(section));
  const base: Omit<CompletenessMetrics, "integrity_hash"> = {
    completeness_id: `completeness_metrics_${pkg.package_id}`,
    package_id: pkg.package_id,
    required_sections: REQUIRED_SECTIONS,
    completed_sections: Object.freeze(completed),
    missing_sections: Object.freeze(missing),
    completeness_score: Number((completed.length / REQUIRED_SECTIONS.length).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: completenessHash(base) });
}

export function measureExplainability(ledger: DecisionPackageLedgerResult = commitDecisionPackageLedger()): ExplainabilityMetrics {
  const pkg = operatorPackage(ledger);
  const reference = ledger.reference_result;
  const checks = {
    rationale_present: pkg.rationale.length > 0,
    alternatives_present: pkg.alternative_options.length > 0 && pkg.rejected_options.length > 0,
    tradeoffs_present: reference.workflow_result.compliance_result.forecast_result.evidence_result.alternatives_result.tradeoff_analysis.tradeoff_summary.length > 0,
    evidence_explained: pkg.evidence_summary.length > 0 && reference.workflow_result.compliance_result.forecast_result.evidence_result.quality_assessment.evidence_sources.length > 0,
    forecast_explained: pkg.forecast_summary.length > 0,
    governance_explained: pkg.governance_summary.length > 0,
    authority_explained: pkg.authority_summary.length > 0,
  };
  const base: Omit<ExplainabilityMetrics, "integrity_hash"> = {
    metrics_id: `explainability_metrics_${pkg.package_id}`,
    package_id: pkg.package_id,
    ...checks,
    explainability_score: score(Object.values(checks)),
  };
  return Object.freeze({ ...base, integrity_hash: explainabilityHash(base) });
}

export function measureGenerationAnalytics(ledger: DecisionPackageLedgerResult = commitDecisionPackageLedger()): GenerationAnalyticsRecord {
  const pkg = operatorPackage(ledger);
  const base: Omit<GenerationAnalyticsRecord, "integrity_hash"> = {
    analytics_id: `generation_analytics_${pkg.package_id}`,
    package_id: pkg.package_id,
    generation_duration: 0,
    validation_duration: ledger.validation.validation_status === "VALID" ? 0 : 1,
    replay_registration_duration: ledger.replay_registry.replay_validation_status === "VALID" ? 0 : 1,
    ledger_commit_duration: ledger.ledger_status === "PASS" ? 0 : 1,
    total_generation_latency: ledger.fail_closed ? 3 : 0,
  };
  return Object.freeze({ ...base, integrity_hash: analyticsHash(base) });
}

export function createOperatorVisibilityReport(ledger: DecisionPackageLedgerResult = commitDecisionPackageLedger()): OperatorVisibilityReport {
  const pkg = operatorPackage(ledger);
  const workflow = ledger.reference_result.workflow_result;
  const baseChecks = {
    operator_actions_visible: workflow.action_records.length > 0,
    governance_visible: workflow.compliance_result.summary.governance_status.length > 0,
    constitutional_visible: workflow.compliance_result.summary.constitutional_status.length > 0,
    replay_visible: ledger.validation.replay_valid,
    approval_path_visible: workflow.approval_path.approval_sequence.length > 0,
  };
  const usability = score(Object.values(baseChecks));
  const base: Omit<OperatorVisibilityReport, "integrity_hash"> = {
    report_id: `operator_visibility_${pkg.package_id}`,
    package_id: pkg.package_id,
    visibility_summary: `Operator visibility score ${usability}; replay=${baseChecks.replay_visible ? "visible" : "missing"}.`,
    ...baseChecks,
    usability_assessment: usability === 1 ? "READY" : usability >= 0.6 ? "PARTIAL" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: visibilityHash(base) });
}

export function createExplainabilityScorecard(metrics: ExplainabilityMetrics = measureExplainability()): ExplainabilityScorecard {
  const asScore = (value: boolean): number => value ? 1 : 0;
  const base: Omit<ExplainabilityScorecard, "integrity_hash"> = {
    scorecard_id: `explainability_scorecard_${metrics.package_id}`,
    package_id: metrics.package_id,
    recommendation_clarity: asScore(metrics.rationale_present),
    rationale_quality: asScore(metrics.rationale_present),
    evidence_traceability: asScore(metrics.evidence_explained),
    alternative_transparency: asScore(metrics.alternatives_present),
    tradeoff_visibility: asScore(metrics.tradeoffs_present),
    governance_transparency: asScore(metrics.governance_explained),
    authority_transparency: asScore(metrics.authority_explained),
    action_clarity: 1,
    overall_score: Number(((metrics.explainability_score + 1) / 2).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: scorecardHash(base) });
}

export function createPackageDashboard(
  ledger: DecisionPackageLedgerResult = commitDecisionPackageLedger(),
  completeness: CompletenessMetrics = measureCompleteness(ledger),
  explainability: ExplainabilityMetrics = measureExplainability(ledger),
  analytics: GenerationAnalyticsRecord = measureGenerationAnalytics(ledger),
  visibility: OperatorVisibilityReport = createOperatorVisibilityReport(ledger),
): PackageDashboard {
  const base: Omit<PackageDashboard, "integrity_hash"> = {
    dashboard_id: `package_dashboard_${ledger.ledger_record.package_id}`,
    package_id: ledger.ledger_record.package_id,
    executive_view: Object.freeze([`health=${ledger.ledger_status}`, `explainability=${explainability.explainability_score}`, `readiness=${visibility.usability_assessment}`, ledger.audit_report.validation_outcome]),
    engineering_view: Object.freeze([`completeness=${completeness.completeness_score}`, `latency=${analytics.total_generation_latency}`, `replay=${ledger.replay_registry.replay_validation_status}`, `integrity=${ledger.audit_report.integrity_verification_status}`]),
    governance_view: Object.freeze([`governance=${visibility.governance_visible}`, `constitutional=${visibility.constitutional_visible}`, `approval=${visibility.approval_path_visible}`]),
    operator_view: Object.freeze([visibility.visibility_summary, `actions=${visibility.operator_actions_visible}`, `replay=${visibility.replay_visible}`]),
    validation_status: ledger.validation.validation_status,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

export function createDecisionPackageObservabilityRecord(
  ledger: DecisionPackageLedgerResult = commitDecisionPackageLedger(),
  completeness: CompletenessMetrics = measureCompleteness(ledger),
  explainability: ExplainabilityMetrics = measureExplainability(ledger),
  analytics: GenerationAnalyticsRecord = measureGenerationAnalytics(ledger),
  visibility: OperatorVisibilityReport = createOperatorVisibilityReport(ledger),
): DecisionPackageObservabilityRecord {
  const evidence = ledger.reference_result.workflow_result.compliance_result.forecast_result.evidence_result;
  const base: Omit<DecisionPackageObservabilityRecord, "integrity_hash"> = {
    observability_id: `decision_package_observability_${ledger.ledger_record.package_id}`,
    package_id: ledger.ledger_record.package_id,
    orchestration_id: ledger.ledger_record.orchestration_id,
    mission_id: ledger.ledger_record.mission_id,
    tenant_id: ledger.ledger_record.tenant_id,
    completeness_score: completeness.completeness_score,
    explainability_score: explainability.explainability_score,
    evidence_coverage_score: evidence.quality_assessment.evidence_completeness === "COMPLETE" ? 1 : 0.5,
    governance_visibility_score: visibility.governance_visible && visibility.constitutional_visible ? 1 : 0,
    replay_availability: visibility.replay_visible,
    operator_usability_score: visibility.usability_assessment === "READY" ? 1 : visibility.usability_assessment === "PARTIAL" ? 0.5 : 0,
    generation_latency: analytics.total_generation_latency,
    replay_ref: ledger.ledger_record.replay_reference,
    lineage_ref: ledger.ledger_record.lineage_reference,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function observabilityFailures(input: {
  ledger: DecisionPackageLedgerResult;
  record: DecisionPackageObservabilityRecord;
  explainability: ExplainabilityMetrics;
  completeness: CompletenessMetrics;
  analytics: GenerationAnalyticsRecord;
  visibility: OperatorVisibilityReport;
  dashboard: PackageDashboard;
  scorecard: ExplainabilityScorecard;
  authorized: boolean;
}): readonly DecisionPackageObservabilityFailureReason[] {
  const failures: DecisionPackageObservabilityFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_OBSERVABILITY_ACCESS");
  if (input.ledger.ledger_status !== "PASS") failures.push("LEDGER_INVALID");
  if (input.completeness.required_sections.length === 0 || input.completeness.completed_sections.length === 0) failures.push("COMPLETENESS_METRICS_MISSING");
  if (input.explainability.explainability_score <= 0) failures.push("EXPLAINABILITY_METRICS_UNAVAILABLE");
  if (!input.visibility.visibility_summary) failures.push("OPERATOR_VISIBILITY_REPORT_MISSING");
  if (!input.record.replay_availability || !input.ledger.validation.replay_valid) failures.push("REPLAY_AVAILABILITY_UNVERIFIED");
  if (input.analytics.total_generation_latency < 0) failures.push("ANALYTICS_INCOMPLETE");
  if (!input.record.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.record.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.record.tenant_id !== input.ledger.ledger_record.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.record.advisory_only || !input.ledger.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    recordHash(input.record) !== input.record.integrity_hash
    || explainabilityHash(input.explainability) !== input.explainability.integrity_hash
    || completenessHash(input.completeness) !== input.completeness.integrity_hash
    || analyticsHash(input.analytics) !== input.analytics.integrity_hash
    || visibilityHash(input.visibility) !== input.visibility.integrity_hash
    || dashboardHash(input.dashboard) !== input.dashboard.integrity_hash
    || scorecardHash(input.scorecard) !== input.scorecard.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as DecisionPackageObservabilityFailureReason[]);
}

function buildValidation(packageId: string, failures: readonly DecisionPackageObservabilityFailureReason[]): ObservabilityValidationResult {
  const has = (failure: DecisionPackageObservabilityFailureReason) => failures.includes(failure);
  const base: Omit<ObservabilityValidationResult, "integrity_hash"> = {
    validation_id: `observability_validation_${packageId}`,
    package_id: packageId,
    completeness_metrics_generated: !has("COMPLETENESS_METRICS_MISSING"),
    explainability_metrics_generated: !has("EXPLAINABILITY_METRICS_UNAVAILABLE"),
    operator_visibility_report_generated: !has("OPERATOR_VISIBILITY_REPORT_MISSING"),
    replay_availability_verified: !has("REPLAY_AVAILABILITY_UNVERIFIED") && !has("REPLAY_DIVERGENCE"),
    generation_analytics_complete: !has("ANALYTICS_INCOMPLETE"),
    replay_reference_present: !has("REPLAY_REFERENCE_MISSING"),
    lineage_reference_present: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(record: DecisionPackageObservabilityRecord, validation: ObservabilityValidationResult): readonly ObservabilityLedgerEntry[] {
  const base: Omit<ObservabilityLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `observability_ledger_${record.observability_id}`,
    observability_id: record.observability_id,
    package_id: record.package_id,
    generation_timestamp: NOW,
    explainability_score: record.explainability_score,
    completeness_score: record.completeness_score,
    operator_usability_score: record.operator_usability_score,
    replay_availability: record.replay_availability,
    integrity_hash: record.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<DecisionPackageObservabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    ledger_result: result.ledger_result,
    record: result.record,
    explainability_metrics: result.explainability_metrics,
    completeness_metrics: result.completeness_metrics,
    generation_analytics: result.generation_analytics,
    operator_visibility_report: result.operator_visibility_report,
    dashboard: result.dashboard,
    scorecard: result.scorecard,
    validation: result.validation,
    observability_ledger: result.observability_ledger,
    failures: result.failures,
  });
}

export function observeDecisionPackage(input: DecisionPackageObservabilityInput = {}): DecisionPackageObservabilityResult {
  const ledger_result = input.ledger_result ?? commitDecisionPackageLedger();
  const completeness_metrics = input.completeness_metrics ?? measureCompleteness(ledger_result);
  const explainability_metrics = input.explainability_metrics ?? measureExplainability(ledger_result);
  const generation_analytics = input.generation_analytics ?? measureGenerationAnalytics(ledger_result);
  const operator_visibility_report = input.operator_visibility_report ?? createOperatorVisibilityReport(ledger_result);
  const dashboard = input.dashboard ?? createPackageDashboard(ledger_result, completeness_metrics, explainability_metrics, generation_analytics, operator_visibility_report);
  const scorecard = input.scorecard ?? createExplainabilityScorecard(explainability_metrics);
  const record = input.record ?? createDecisionPackageObservabilityRecord(ledger_result, completeness_metrics, explainability_metrics, generation_analytics, operator_visibility_report);
  const failures = observabilityFailures({
    ledger: ledger_result,
    record,
    explainability: explainability_metrics,
    completeness: completeness_metrics,
    analytics: generation_analytics,
    visibility: operator_visibility_report,
    dashboard,
    scorecard,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(record.package_id, failures);
  const ledger = writeLedger(record, validation);
  const ledgerFailures: readonly DecisionPackageObservabilityFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...failures, ...ledgerFailures])] as DecisionPackageObservabilityFailureReason[]);
  const finalValidation = finalFailures.length === failures.length ? validation : buildValidation(record.package_id, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(record, finalValidation);
  const base: Omit<DecisionPackageObservabilityResult, "integrity_hash" | "replay_hash"> = {
    observability_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    ledger_result,
    record,
    explainability_metrics,
    completeness_metrics,
    generation_analytics,
    operator_visibility_report,
    dashboard,
    scorecard,
    validation: finalValidation,
    observability_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly DecisionPackageObservabilityFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(record.package_id, replayFailures);
    const replayBase: Omit<DecisionPackageObservabilityResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      observability_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      observability_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionPackageObservability(result: DecisionPackageObservabilityResult): DecisionPackageObservabilityReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && replayDecisionPackageLedger(result.ledger_result).replay_valid
    && recordHash(result.record) === result.record.integrity_hash
    && explainabilityHash(result.explainability_metrics) === result.explainability_metrics.integrity_hash
    && completenessHash(result.completeness_metrics) === result.completeness_metrics.integrity_hash
    && analyticsHash(result.generation_analytics) === result.generation_analytics.integrity_hash
    && visibilityHash(result.operator_visibility_report) === result.operator_visibility_report.integrity_hash
    && dashboardHash(result.dashboard) === result.dashboard.integrity_hash
    && scorecardHash(result.scorecard) === result.scorecard.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.observability_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: DecisionPackageObservabilityFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<DecisionPackageObservabilityReplay, "integrity_hash"> = {
    replay_id: "replay_decision_package_observability",
    replay_valid,
    observability_id: result.record.observability_id,
    package_id: result.record.package_id,
    completeness_score: result.record.completeness_score,
    explainability_score: result.record.explainability_score,
    operator_usability_score: result.record.operator_usability_score,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildDecisionPackageObservabilityMetrics(result: DecisionPackageObservabilityResult): DecisionPackageObservabilityMetrics {
  return Object.freeze({
    packages_observed: result.observability_status === "PASS" ? 1 : 0,
    completeness_score: result.record.completeness_score,
    explainability_score: result.record.explainability_score,
    evidence_coverage_score: result.record.evidence_coverage_score,
    governance_visibility_score: result.record.governance_visibility_score,
    replay_availability: result.record.replay_availability ? 1 : 0,
    operator_usability_score: result.record.operator_usability_score,
    validation_failures: result.failures.length,
    integrity_verification_success: result.validation.integrity_verified ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getDecisionPackageObservabilityFoundation(): DecisionPackageObservabilityFoundation {
  const result = observeDecisionPackage();
  const replay = replayDecisionPackageObservability(result);
  return Object.freeze({
    observability_version: OBSERVABILITY_VERSION,
    observability_states: DECISION_PACKAGE_OBSERVABILITY_STATES,
    result,
    replay,
    observability: buildDecisionPackageObservabilityMetrics(result),
  });
}

export const DecisionPackageObservability = Object.freeze({
  observe: observeDecisionPackage,
  replay: replayDecisionPackageObservability,
});
