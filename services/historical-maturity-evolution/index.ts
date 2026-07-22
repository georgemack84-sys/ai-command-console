import { classifyMaturity } from "@/services/maturity-classification-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityDomain } from "@/types/autonomy-maturity-assessment-contract";
import type {
  HistoricalDomainImprovement,
  HistoricalMaturityBundle,
  HistoricalMaturityFailure,
  HistoricalMaturityInput,
  HistoricalMaturityLedgerRecord,
  HistoricalMaturityObservabilitySurface,
  HistoricalProgressAnalytics,
} from "@/types/historical-maturity-evolution";
import type {
  HistoricalMaturityRepository,
  HistoricalMaturityReport,
  HistoricalMaturityScenario,
  HistoricalMaturityTrendAnalysis,
  HistoricalMaturityValidationResult,
  HistoricalRegressionEvent,
  HistoricalTimelineEvent,
} from "@/types/historical-maturity-evolution";
import type { MaturityClassificationRepository } from "@/types/maturity-classification-engine";

const VERSION = "historical-maturity-evolution/v8ALT.11.5" as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function round2(value: number): number { return Math.round(value * 100) / 100; }

function scenarioFailure(scenario: HistoricalMaturityScenario): HistoricalMaturityFailure | null {
  const map: Partial<Record<HistoricalMaturityScenario, HistoricalMaturityFailure>> = {
    HISTORICAL_RECORD_MUTATION: "HISTORICAL_RECORD_MODIFIED",
    CHRONOLOGICAL_ORDERING_CHANGE: "CHRONOLOGICAL_ORDERING_CHANGED",
    TREND_REPLAY_MISMATCH: "TREND_REPLAY_MISMATCHED",
    BROKEN_LINEAGE: "HISTORICAL_LINEAGE_BROKEN",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    INCONSISTENT_PROMOTION_HISTORY: "PROMOTION_HISTORY_INCONSISTENT",
    INCOMPLETE_REGRESSION_HISTORY: "REGRESSION_HISTORY_INCOMPLETE",
    MISSING_GOVERNANCE_HISTORY: "GOVERNANCE_HISTORY_MISSING",
    MISSING_CONSTITUTIONAL_HISTORY: "CONSTITUTIONAL_HISTORY_MISSING",
    HIDDEN_HISTORICAL_RECORDS: "HIDDEN_HISTORICAL_RECORDS_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function ledgerRecord(classification: MaturityClassificationRepository, scenario: HistoricalMaturityScenario): HistoricalMaturityLedgerRecord {
  const score = classification.scoring.result;
  const base = {
    history_id: id("HME-H", "historical-maturity-ledger", scenario),
    assessment_id: classification.record.assessment_id,
    tenant_id: scenario === "TENANT_ISOLATION_VIOLATION" ? "tenant:foreign" : "tenant:alpha",
    mission_id: "mission:historical-maturity-evolution",
    maturity_level: classification.record.maturity_level,
    historical_state: classification.record.classification_state === "CERTIFIED_CONSTITUTIONAL_AUTONOMY" ? "CERTIFIED" as const : "VALIDATED" as const,
    overall_score: score.overall_maturity_score,
    confidence_score: score.confidence_score,
    readiness_score: score.readiness_score,
    assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1" as const,
    scoring_version: "deterministic-maturity-scoring-engine/v8ALT.11.3" as const,
    classification_version: "maturity-classification-engine/v8ALT.11.4" as const,
    replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "" : classification.record.replay_reference,
    lineage_reference: scenario === "BROKEN_LINEAGE" ? "" : classification.record.lineage_reference,
    governance_reference: scenario === "MISSING_GOVERNANCE_HISTORY" ? "" : "governance:historical-maturity-evolution",
    constitutional_reference: scenario === "MISSING_CONSTITUTIONAL_HISTORY" ? "" : "constitutional:historical-maturity-evolution",
    immutable: scenario !== "HISTORICAL_RECORD_MUTATION",
    timestamp: "1970-01-01T00:00:00.000Z" as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("historical-maturity-ledger-record", base) });
}

function timeline(record: HistoricalMaturityLedgerRecord, classification: MaturityClassificationRepository, scenario: HistoricalMaturityScenario): readonly HistoricalTimelineEvent[] {
  const rows = [
    ["ASSESSMENT_COMPLETED", record.overall_score],
    [classification.transition.decision === "REGRESSION_ADVISED" ? "MATURITY_REGRESSED" : "MATURITY_PROMOTED", record.overall_score],
    ["CERTIFICATION_OBSERVED", record.readiness_score],
    ["GOVERNANCE_MILESTONE", record.confidence_score],
    ["CONSTITUTIONAL_MILESTONE", record.confidence_score],
    ["REPLAY_MILESTONE", record.overall_score],
    ["RESILIENCE_MILESTONE", record.overall_score],
  ] as const;
  return freezeArray(rows.map(([event_type, score], index) => {
    const base = { event_id: id("HME-E", "historical-maturity-event", `${event_type}:${index}`), history_id: record.history_id, event_type, event_order: scenario === "CHRONOLOGICAL_ORDERING_CHANGE" && index === 1 ? 99 : index + 1, maturity_level: record.maturity_level, score, replay_reference: record.replay_reference, lineage_reference: record.lineage_reference, advisory_only: true as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("historical-maturity-timeline-event", base) });
  }));
}

function domainImprovements(classification: MaturityClassificationRepository, scenario: HistoricalMaturityScenario): readonly HistoricalDomainImprovement[] {
  return freezeArray(classification.scoring.normalized_scores.map((score) => {
    const baseline = 80;
    const delta = round2(score.normalized_score - baseline);
    const base = { domain: score.domain, baseline_score: baseline, current_score: score.normalized_score, delta, trend: delta > 0 ? "IMPROVING" as const : delta < 0 ? "DECLINING" as const : "STABLE" as const, replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" && score.domain === "REPLAY_INTEGRITY" ? "" : score.replay_reference };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && score.domain === "REPLAY_INTEGRITY" ? "" : hashValue("historical-domain-improvement", base) });
  }));
}

function regression(classification: MaturityClassificationRepository, improvements: readonly HistoricalDomainImprovement[], scenario: HistoricalMaturityScenario): HistoricalRegressionEvent {
  const affected = improvements.filter((entry) => entry.trend === "DECLINING").map((entry) => entry.domain);
  const forced = scenario === "INCOMPLETE_REGRESSION_HISTORY" ? [] : affected;
  const base = { regression_id: id("HME-R", "historical-regression", scenario), affected_domains: freezeArray(forced), severity: forced.length ? "HIGH" as const : "NONE" as const, historical_comparison: classification.transition.regression_advised ? "regression advisory recorded from classification transition" : "no historical regression detected", corrective_recommendations: freezeArray(["review advisory transition record", "verify replay before maturity aggregation", "preserve operator approval"]), advisory_only: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("historical-regression-event", base) });
}

function trends(record: HistoricalMaturityLedgerRecord, improvements: readonly HistoricalDomainImprovement[], scenario: HistoricalMaturityScenario): HistoricalMaturityTrendAnalysis {
  const velocity = round2(improvements.reduce((sum, entry) => sum + entry.delta, 0) / improvements.length);
  const base = { trend_id: id("HME-T", "historical-trends", scenario), growth_trend: scenario === "TREND_REPLAY_MISMATCH" ? "DECLINING" as const : "IMPROVING" as const, stability_trend: "STABLE" as const, regression_trend: "STABLE" as const, improvement_velocity: scenario === "TREND_REPLAY_MISMATCH" ? round2(velocity - 2) : velocity, maturity_trajectory: record.maturity_level === "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY" ? "TOWARD_CERTIFIED_CONSTITUTIONAL_AUTONOMY" as const : "STABLE_CONTROLLED_AUTONOMY" as const, replay_verified: scenario !== "TREND_REPLAY_MISMATCH" };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("historical-maturity-trends", base) });
}

function progress(record: HistoricalMaturityLedgerRecord, scenario: HistoricalMaturityScenario): HistoricalProgressAnalytics {
  const base = { progress_id: id("HME-P", "historical-progress", scenario), progress_percentage: record.overall_score, maturity_velocity: 12, readiness_evolution: record.readiness_score, milestone_completion: record.maturity_level === "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY" ? 100 : 75, remaining_objectives: freezeArray(record.maturity_level === "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY" ? [] : ["complete constitutional certification"]) };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("historical-progress-analytics", base) });
}

function report(record: HistoricalMaturityLedgerRecord, timelineEvents: readonly HistoricalTimelineEvent[], improvements: readonly HistoricalDomainImprovement[], regressions: readonly HistoricalRegressionEvent[], trend: HistoricalMaturityTrendAnalysis, scenario: HistoricalMaturityScenario): HistoricalMaturityReport {
  const base = { report_id: id("HME-REP", "historical-maturity-report", scenario), current_maturity: record.maturity_level, historical_maturity: record.maturity_level, trend_direction: trend.growth_trend, readiness_summary: `${record.readiness_score} readiness recorded historically`, timeline_summary: freezeArray(timelineEvents.map((event) => `${event.event_order}:${event.event_type}`)), domain_evolution: improvements, regression_events: regressions, recommendations: freezeArray(["continue deterministic historical review", "retain advisory-only improvement recommendations", "replay historical ledger before external reporting"]), advisory_only: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("historical-maturity-report", base) });
}

function collectFailures(repository: Omit<HistoricalMaturityRepository, "integrity_hash"> | HistoricalMaturityRepository): readonly HistoricalMaturityFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.ledger.some((record) => !record.immutable) ? ["HISTORICAL_RECORD_MODIFIED" as const] : []),
    ...(repository.timeline.some((event, index) => event.event_order !== index + 1) ? ["CHRONOLOGICAL_ORDERING_CHANGED" as const] : []),
    ...(!repository.trends.replay_verified ? ["TREND_REPLAY_MISMATCHED" as const] : []),
    ...(repository.ledger.some((record) => !record.lineage_reference) || repository.timeline.some((event) => !event.lineage_reference) ? ["HISTORICAL_LINEAGE_BROKEN" as const] : []),
    ...(repository.ledger.some((record) => !record.integrity_hash) || repository.timeline.some((event) => !event.integrity_hash) || !repository.trends.integrity_hash || !repository.progress.integrity_hash || repository.domain_improvements.some((entry) => !entry.integrity_hash) || repository.regressions.some((entry) => !entry.integrity_hash) || !repository.report.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.ledger.some((record) => !record.replay_reference) || repository.timeline.some((event) => !event.replay_reference) || repository.domain_improvements.some((entry) => !entry.replay_reference) ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(repository.timeline.some((event) => event.event_type === "MATURITY_PROMOTED") && repository.classification.transition.decision !== "PROMOTION_ELIGIBLE" ? ["PROMOTION_HISTORY_INCONSISTENT" as const] : []),
    ...(repository.classification.transition.regression_advised && repository.regressions.every((event) => event.affected_domains.length === 0) ? ["REGRESSION_HISTORY_INCOMPLETE" as const] : []),
    ...(repository.ledger.some((record) => !record.governance_reference) ? ["GOVERNANCE_HISTORY_MISSING" as const] : []),
    ...(repository.ledger.some((record) => !record.constitutional_reference) ? ["CONSTITUTIONAL_HISTORY_MISSING" as const] : []),
    ...(repository.report.timeline_summary.some((entry) => entry.includes("hidden")) ? ["HIDDEN_HISTORICAL_RECORDS_DETECTED" as const] : []),
    ...(repository.ledger.some((record) => record.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.advisory_only || repository.historical_record_modification_authorized || repository.maturity_state_mutation_authorized || repository.production_certification_authorized || repository.execution_behavior_change_authorized ? ["ADVISORY_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function buildHistoricalMaturityEvolution(input: HistoricalMaturityInput = {}): HistoricalMaturityRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const classification = input.classification ?? classifyMaturity(scenario === "INCOMPLETE_REGRESSION_HISTORY" ? { scenario: "MISSED_REGRESSION_TRIGGER" } : {});
  const record = ledgerRecord(classification, scenario);
  const ledger = freezeArray([record]);
  const timelineEvents = timeline(record, classification, scenario);
  const improvements = domainImprovements(classification, scenario);
  const regressions = freezeArray([regression(classification, improvements, scenario)]);
  const trend = trends(record, improvements, scenario);
  const progressAnalytics = progress(record, scenario);
  const historicalReport = scenario === "HIDDEN_HISTORICAL_RECORDS" ? Object.freeze({ ...report(record, timelineEvents, improvements, regressions, trend, scenario), timeline_summary: freezeArray(["hidden historical record"]) }) : report(record, timelineEvents, improvements, regressions, trend, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("HME", "historical-maturity-evolution", scenario), final_state: "HISTORICAL_MATURITY_EVOLUTION_COMPLETE" as const, classification, ledger, timeline: timelineEvents, trends: trend, progress: progressAnalytics, domain_improvements: improvements, regressions, report: historicalReport, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, historical_record_modification_authorized: false as const, maturity_state_mutation_authorized: false as const, production_certification_authorized: false as const, governance_modification_authorized: false as const, execution_behavior_change_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "HISTORICAL_MATURITY_EVOLUTION_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("historical-maturity-evolution-repository", repository) });
}

export function listHistoricalMaturityLedger(input: HistoricalMaturityInput = {}) { return buildHistoricalMaturityEvolution(input).ledger; }
export function listHistoricalMaturityTimeline(input: HistoricalMaturityInput = {}) { return buildHistoricalMaturityEvolution(input).timeline; }
export function getHistoricalMaturityTrends(input: HistoricalMaturityInput = {}) { return buildHistoricalMaturityEvolution(input).trends; }
export function getHistoricalMaturityReport(input: HistoricalMaturityInput = {}) { return buildHistoricalMaturityEvolution(input).report; }

export function validateHistoricalMaturityEvolution(repository = buildHistoricalMaturityEvolution()): HistoricalMaturityValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: HistoricalMaturityFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.final_state === "HISTORICAL_MATURITY_EVOLUTION_COMPLETE", records_immutable: !has("HISTORICAL_RECORD_MODIFIED"), chronological_ordering: !has("CHRONOLOGICAL_ORDERING_CHANGED"), trend_replay_verified: !has("TREND_REPLAY_MISMATCHED"), lineage_intact: !has("HISTORICAL_LINEAGE_BROKEN"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), replay_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"), promotion_history_consistent: !has("PROMOTION_HISTORY_INCONSISTENT"), regression_history_complete: !has("REGRESSION_HISTORY_INCOMPLETE"), governance_history_present: !has("GOVERNANCE_HISTORY_MISSING"), constitutional_history_present: !has("CONSTITUTIONAL_HISTORY_MISSING"), no_hidden_records: !has("HIDDEN_HISTORICAL_RECORDS_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), advisory_only: true as const, no_state_mutation_authority: !repository.historical_record_modification_authorized && !repository.maturity_state_mutation_authorized && !repository.production_certification_authorized && !repository.execution_behavior_change_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("historical-maturity-validation", result) });
}

export function buildHistoricalMaturityObservabilitySurface(repository = buildHistoricalMaturityEvolution()): HistoricalMaturityObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, ledger_count: repository.ledger.length, timeline_count: repository.timeline.length, domain_improvement_count: repository.domain_improvements.length, regression_count: repository.regressions.length, trend_direction: repository.trends.growth_trend, progress_percentage: repository.progress.progress_percentage, failure_count: repository.failures.length, advisory_only: true, maturity_state_mutation_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getHistoricalMaturityEvolutionBundle(): HistoricalMaturityBundle {
  const repository = buildHistoricalMaturityEvolution();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "HISTORICAL_MATURITY_EVOLUTION_READY", principles: freezeArray(["append-only-history", "classification-ledger-derived", "deterministic-timeline", "replayable-trends", "domain-improvement-tracking", "regression-observations-only", "tenant-isolated", "advisory-only"]) }), repository, validation: validateHistoricalMaturityEvolution(repository), observability: buildHistoricalMaturityObservabilitySurface(repository) });
}
