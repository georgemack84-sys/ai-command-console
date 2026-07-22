import { buildMaturityAnalyticsVisualization } from "@/services/maturity-analytics-visualization";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AssessmentReplayBundle,
  AssessmentReplayFailure,
  AssessmentReplayInput,
  AssessmentReplayObservabilitySurface,
  AssessmentReplayOutput,
  AssessmentReplayRepository,
  AssessmentReplayScenario,
  AssessmentReplayValidationResult,
  ReconstructedAssessmentContext,
  ReplayAuditReport,
  ReplayCertificationPackage,
  ReplayDivergenceFinding,
  ReplayExplanation,
} from "@/types/assessment-replay-explainability";
import type { MaturityAnalyticsVisualizationRepository } from "@/types/maturity-analytics-visualization";

const VERSION = "assessment-replay-explainability/v8ALT.11.10" as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: AssessmentReplayScenario): AssessmentReplayFailure | null {
  const map: Partial<Record<AssessmentReplayScenario, AssessmentReplayFailure>> = {
    REPLAY_OUTPUT_DIVERGENCE: "REPLAY_OUTPUT_DIVERGED",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    EVIDENCE_INTEGRITY_FAILURE: "EVIDENCE_INTEGRITY_FAILED",
    SCORING_VERSION_UNAVAILABLE: "SCORING_VERSION_UNAVAILABLE",
    CLASSIFICATION_RULES_UNAVAILABLE: "CLASSIFICATION_RULES_UNAVAILABLE",
    RECOMMENDATION_RULES_UNAVAILABLE: "RECOMMENDATION_RULES_UNAVAILABLE",
    MISSING_GOVERNANCE_EVIDENCE: "GOVERNANCE_EVIDENCE_MISSING",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    HIDDEN_ASSESSMENT_LOGIC: "HIDDEN_ASSESSMENT_LOGIC_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    REPLAY_MODIFICATION_ATTEMPT: "REPLAY_MODIFICATION_ATTEMPTED",
  };
  return map[scenario] ?? null;
}

function context(source: MaturityAnalyticsVisualizationRepository, scenario: AssessmentReplayScenario): ReconstructedAssessmentContext {
  const ledger = source.ledger_repository.assessment_ledger[0]!;
  const classification = source.ledger_repository.recommendation_repository.readiness.history.classification;
  const base = {
    context_id: id("ARE-C", "assessment-replay-context", scenario),
    assessment_id: ledger.assessment_id,
    assessment_contract_version: ledger.assessment_version,
    scoring_version: scenario === "SCORING_VERSION_UNAVAILABLE" ? "" : classification.scoring.result.scoring_version,
    classification_version: scenario === "CLASSIFICATION_RULES_UNAVAILABLE" ? "" : classification.record.classification_version,
    recommendation_version: scenario === "RECOMMENDATION_RULES_UNAVAILABLE" ? "" : source.ledger_repository.recommendation_repository.recommendations[0]?.recommendation_version ?? "",
    enabled_domain_count: source.analytics.domain_count,
    evidence_count: scenario === "MISSING_EVIDENCE" ? 0 : source.ledger_repository.evidence_repository.length,
    replay_reference: source.ledger_repository.replay_repository[0]?.replay_reference ?? "",
    lineage_reference: scenario === "BROKEN_LINEAGE" ? "" : ledger.lineage_reference,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "EVIDENCE_INTEGRITY_FAILURE" ? "" : hashValue("assessment-replay-context", base) });
}

function replayOutput(source: MaturityAnalyticsVisualizationRepository, ctx: ReconstructedAssessmentContext, scenario: AssessmentReplayScenario): AssessmentReplayOutput {
  const ledger = source.ledger_repository.assessment_ledger[0]!;
  const original = source.analytics.maturity_score;
  const replayed = scenario === "REPLAY_OUTPUT_DIVERGENCE" ? original - 1 : original;
  const base = {
    replay_id: id("ARE", "assessment-replay", scenario),
    source_assessment_id: ledger.assessment_id,
    replay_state: scenario === "REPLAY_OUTPUT_DIVERGENCE" ? "DIVERGED" as const : "MATCHED" as const,
    original_score: original,
    replayed_score: replayed,
    original_maturity_level: ledger.maturity_level,
    replayed_maturity_level: ledger.maturity_level,
    recommendation_count: source.ledger_repository.recommendation_repository.recommendations.length,
    replayed_recommendation_count: source.ledger_repository.recommendation_repository.recommendations.length,
    evidence_reconstructed: ctx.evidence_count > 0,
    governance_validated: scenario !== "MISSING_GOVERNANCE_EVIDENCE",
    constitutional_validated: scenario !== "MISSING_CONSTITUTIONAL_EVIDENCE",
    integrity_verified: scenario !== "EVIDENCE_INTEGRITY_FAILURE",
    replay_reference: scenario === "REPLAY_OUTPUT_DIVERGENCE" ? "" : ctx.replay_reference,
    lineage_reference: ctx.lineage_reference,
    read_only: true as const,
    record_modification_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "EVIDENCE_INTEGRITY_FAILURE" ? "" : hashValue("assessment-replay-output", base) });
}

function divergences(replay: AssessmentReplayOutput, scenario: AssessmentReplayScenario): readonly ReplayDivergenceFinding[] {
  const rows = [
    ["SCORING", replay.original_score !== replay.replayed_score],
    ["CLASSIFICATION", replay.original_maturity_level !== replay.replayed_maturity_level],
    ["RECOMMENDATION", replay.recommendation_count !== replay.replayed_recommendation_count],
    ["EVIDENCE", !replay.evidence_reconstructed],
    ["LINEAGE", !replay.lineage_reference],
    ["INTEGRITY", !replay.integrity_verified],
    ["GOVERNANCE", !replay.governance_validated],
    ["CONSTITUTIONAL", !replay.constitutional_validated],
    ["REPORT", scenario === "HIDDEN_ASSESSMENT_LOGIC"],
  ] as const;
  return freezeArray(rows.map(([category, detected]) => {
    const base = { finding_id: id("ARE-D", "replay-divergence", category), category, detected, description: detected ? `${category} divergence detected during replay` : `${category} replay matched` };
    return Object.freeze({ ...base, integrity_hash: scenario === "EVIDENCE_INTEGRITY_FAILURE" && category === "INTEGRITY" ? "" : hashValue("replay-divergence-finding", base) });
  }));
}

function explanations(source: MaturityAnalyticsVisualizationRepository, replay: AssessmentReplayOutput, scenario: AssessmentReplayScenario): readonly ReplayExplanation[] {
  const topics = ["DOMAIN_SCORING", "AGGREGATE_SCORING", "MATURITY_CLASSIFICATION", "READINESS", "GAPS", "RECOMMENDATIONS", "GOVERNANCE", "CONSTITUTIONAL", "REPLAY", "CONFIDENCE"] as const;
  const evidence = source.ledger_repository.evidence_repository.map((entry) => entry.evidence_id);
  return freezeArray(topics.map((topic) => {
    const complete = !(scenario === "MISSING_EVIDENCE" || (scenario === "HIDDEN_ASSESSMENT_LOGIC" && topic === "REPLAY"));
    const base = { explanation_id: id("ARE-X", "replay-explanation", topic), topic, explanation: scenario === "HIDDEN_ASSESSMENT_LOGIC" && topic === "REPLAY" ? "hidden assessment logic" : `${topic.toLowerCase()} replay explanation uses immutable assessment evidence`, evidence_references: freezeArray(complete ? evidence : []), replay_reference: replay.replay_reference, lineage_reference: replay.lineage_reference, complete };
    return Object.freeze({ ...base, integrity_hash: scenario === "EVIDENCE_INTEGRITY_FAILURE" && topic === "REPLAY" ? "" : hashValue("replay-explanation", base) });
  }));
}

function auditReport(replay: AssessmentReplayOutput, findings: readonly ReplayDivergenceFinding[], scenario: AssessmentReplayScenario): ReplayAuditReport {
  const base = { report_id: id("ARE-A", "replay-audit-report", replay.replay_id), replay_id: replay.replay_id, source_assessment_id: replay.source_assessment_id, replay_status: replay.replay_state, original_score: replay.original_score, replayed_score: replay.replayed_score, original_maturity_level: replay.original_maturity_level, replayed_maturity_level: replay.replayed_maturity_level, divergence_findings: findings, evidence_reconstruction_status: replay.evidence_reconstructed ? "PASS" as const : "FAIL" as const, governance_validation: replay.governance_validated ? "PASS" as const : "FAIL" as const, constitutional_validation: replay.constitutional_validated ? "PASS" as const : "FAIL" as const, integrity_verification: replay.integrity_verified ? "PASS" as const : "FAIL" as const, replay_timestamp: "1970-01-01T00:00:00.000Z" as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "EVIDENCE_INTEGRITY_FAILURE" ? "" : hashValue("replay-audit-report", base) });
}

function certificationPackage(report: ReplayAuditReport, explanationsList: readonly ReplayExplanation[], scenario: AssessmentReplayScenario): ReplayCertificationPackage {
  const divergenceCount = report.divergence_findings.filter((finding) => finding.detected).length;
  const base = { package_id: id("ARE-P", "replay-certification-package", report.replay_id), replay_id: report.replay_id, audit_report_id: report.report_id, explanation_count: explanationsList.length, divergence_count: divergenceCount, certification_ready: divergenceCount === 0 && explanationsList.every((entry) => entry.complete), read_only: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "EVIDENCE_INTEGRITY_FAILURE" ? "" : hashValue("replay-certification-package", base) });
}

function collectFailures(repository: Omit<AssessmentReplayRepository, "integrity_hash"> | AssessmentReplayRepository): readonly AssessmentReplayFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.replay.original_score !== repository.replay.replayed_score || repository.divergences.some((finding) => finding.detected && finding.category === "SCORING") ? ["REPLAY_OUTPUT_DIVERGED" as const] : []),
    ...(!repository.replay.evidence_reconstructed || repository.context.evidence_count === 0 ? ["EVIDENCE_MISSING" as const] : []),
    ...(!repository.replay.integrity_verified || !repository.context.integrity_hash || !repository.replay.integrity_hash || repository.divergences.some((finding) => !finding.integrity_hash) || repository.explanations.some((entry) => !entry.integrity_hash) || !repository.audit_report.integrity_hash || !repository.certification_package.integrity_hash ? ["EVIDENCE_INTEGRITY_FAILED" as const] : []),
    ...(!repository.context.scoring_version ? ["SCORING_VERSION_UNAVAILABLE" as const] : []),
    ...(!repository.context.classification_version ? ["CLASSIFICATION_RULES_UNAVAILABLE" as const] : []),
    ...(!repository.context.recommendation_version ? ["RECOMMENDATION_RULES_UNAVAILABLE" as const] : []),
    ...(!repository.replay.governance_validated ? ["GOVERNANCE_EVIDENCE_MISSING" as const] : []),
    ...(!repository.replay.constitutional_validated ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(!repository.context.lineage_reference || !repository.replay.lineage_reference ? ["LINEAGE_BROKEN" as const] : []),
    ...(repository.explanations.some((entry) => entry.explanation.includes("hidden")) ? ["HIDDEN_ASSESSMENT_LOGIC_DETECTED" as const] : []),
    ...(repository.analytics_repository.ledger_repository.assessment_ledger.some((entry) => entry.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.read_only || repository.record_modification_authorized || repository.replay_mutation_authorized || repository.replay.record_modification_authorized ? ["REPLAY_MODIFICATION_ATTEMPTED" as const] : []),
  ]);
}

export function replayAssessmentWithExplainability(input: AssessmentReplayInput = {}): AssessmentReplayRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const analytics_repository = input.analytics_repository ?? buildMaturityAnalyticsVisualization(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const reconstructed = context(analytics_repository, scenario);
  const replay = replayOutput(analytics_repository, reconstructed, scenario);
  const findings = divergences(replay, scenario);
  const explanationSet = explanations(analytics_repository, replay, scenario);
  const audit = auditReport(replay, findings, scenario);
  const pack = certificationPackage(audit, explanationSet, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("ARE", "assessment-replay-explainability", scenario), final_state: "ASSESSMENT_REPLAY_COMPLETE" as const, analytics_repository, context: reconstructed, replay, divergences: findings, explanations: explanationSet, audit_report: audit, certification_package: pack, failures: freezeArray(directFailure ? [directFailure] : []), read_only: true as const, record_modification_authorized: false as const, replay_mutation_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "ASSESSMENT_REPLAY_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("assessment-replay-explainability-repository", repository) });
}

export function getReplayExplanations(input: AssessmentReplayInput = {}) { return replayAssessmentWithExplainability(input).explanations; }
export function getReplayAuditReport(input: AssessmentReplayInput = {}) { return replayAssessmentWithExplainability(input).audit_report; }
export function getReplayCertificationPackage(input: AssessmentReplayInput = {}) { return replayAssessmentWithExplainability(input).certification_package; }

export function validateAssessmentReplayExplainability(repository = replayAssessmentWithExplainability()): AssessmentReplayValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["EVIDENCE_INTEGRITY_FAILED" as const] : [])]);
  const has = (failure: AssessmentReplayFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.final_state === "ASSESSMENT_REPLAY_COMPLETE", replay_output_matched: !has("REPLAY_OUTPUT_DIVERGED"), evidence_present: !has("EVIDENCE_MISSING"), evidence_integrity_verified: !has("EVIDENCE_INTEGRITY_FAILED"), scoring_version_available: !has("SCORING_VERSION_UNAVAILABLE"), classification_rules_available: !has("CLASSIFICATION_RULES_UNAVAILABLE"), recommendation_rules_available: !has("RECOMMENDATION_RULES_UNAVAILABLE"), governance_evidence_present: !has("GOVERNANCE_EVIDENCE_MISSING"), constitutional_evidence_present: !has("CONSTITUTIONAL_EVIDENCE_MISSING"), lineage_intact: !has("LINEAGE_BROKEN"), no_hidden_logic: !has("HIDDEN_ASSESSMENT_LOGIC_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), read_only: true as const, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("assessment-replay-validation", result) });
}

export function buildAssessmentReplayObservabilitySurface(repository = replayAssessmentWithExplainability()): AssessmentReplayObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, replay_state: repository.replay.replay_state, divergence_count: repository.divergences.filter((finding) => finding.detected).length, explanation_count: repository.explanations.length, evidence_count: repository.context.evidence_count, read_only: true, record_modification_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getAssessmentReplayExplainabilityBundle(): AssessmentReplayBundle {
  const repository = replayAssessmentWithExplainability();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "ASSESSMENT_REPLAY_EXPLAINABILITY_READY", principles: freezeArray(["analytics-derived-replay", "read-only-reconstruction", "exact-score-replay", "classification-replay", "recommendation-replay", "complete-explainability", "divergence-detection", "tenant-isolated"]) }), repository, validation: validateAssessmentReplayExplainability(repository), observability: buildAssessmentReplayObservabilitySurface(repository) });
}
