import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { buildDecisionPackage } from "@/services/decision-package-builder";
import { generateAlternativesTradeoff } from "@/services/alternatives-tradeoff-generator";
import { generateRecommendationRationale } from "@/services/recommendation-rationale-generator";
import type { AlternativesTradeoffGeneratorResult } from "@/types/alternatives-tradeoff-generator";
import type { DecisionPackageBuilderResult } from "@/types/decision-package-builder";
import type { RecommendationRationaleGeneratorResult } from "@/types/recommendation-rationale-generator";
import type {
  ConfidenceSummaryRecord,
  EvidenceQualityAssessment,
  EvidenceRiskConfidenceFailureReason,
  EvidenceRiskConfidenceFoundation,
  EvidenceRiskConfidenceInput,
  EvidenceRiskConfidenceObservability,
  EvidenceRiskConfidenceReplay,
  EvidenceRiskConfidenceResult,
  EvidenceRiskConfidenceSummary,
  EvidenceRiskConfidenceSummaryState,
  EvidenceSummaryLedgerEntry,
  RiskSummaryRecord,
  SummaryValidationResult,
} from "@/types/evidence-risk-confidence-summarization";

const SUMMARIZER_VERSION = "evidence-risk-confidence-summarization/v1" as const;
const AUTHORIZED_COMPONENT = "evidence-risk-confidence-summarization";
const NOW = "2026-07-04T01:06:00.000Z";

export const EVIDENCE_RISK_CONFIDENCE_SUMMARY_STATES: readonly EvidenceRiskConfidenceSummaryState[] = Object.freeze(["INITIALIZED", "GENERATING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

function summaryHash(summary: Omit<EvidenceRiskConfidenceSummary, "integrity_hash"> | EvidenceRiskConfidenceSummary): string {
  return hashWithoutIntegrity(summary);
}

export function computeEvidenceRiskConfidenceSummaryHash(summary: Omit<EvidenceRiskConfidenceSummary, "integrity_hash"> | EvidenceRiskConfidenceSummary): string {
  return summaryHash(summary);
}

function qualityHash(record: Omit<EvidenceQualityAssessment, "integrity_hash"> | EvidenceQualityAssessment): string {
  return hashWithoutIntegrity(record);
}

export function computeEvidenceQualityAssessmentHash(record: Omit<EvidenceQualityAssessment, "integrity_hash"> | EvidenceQualityAssessment): string {
  return qualityHash(record);
}

function riskHash(record: Omit<RiskSummaryRecord, "integrity_hash"> | RiskSummaryRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeRiskSummaryRecordHash(record: Omit<RiskSummaryRecord, "integrity_hash"> | RiskSummaryRecord): string {
  return riskHash(record);
}

function confidenceHash(record: Omit<ConfidenceSummaryRecord, "integrity_hash"> | ConfidenceSummaryRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeConfidenceSummaryRecordHash(record: Omit<ConfidenceSummaryRecord, "integrity_hash"> | ConfidenceSummaryRecord): string {
  return confidenceHash(record);
}

function validationHash(record: Omit<SummaryValidationResult, "integrity_hash"> | SummaryValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<EvidenceSummaryLedgerEntry, "ledger_integrity_hash"> | EvidenceSummaryLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function evidenceSources(packageBuild: DecisionPackageBuilderResult, alternatives: AlternativesTradeoffGeneratorResult): readonly string[] {
  return normalize([
    ...packageBuild.package.recommended_option.evidence_refs,
    ...packageBuild.package.alternative_options.flatMap((item) => [...item.evidence_refs]),
    ...packageBuild.package.rejected_options.flatMap((item) => [...item.evidence_refs]),
    ...alternatives.analysis_ledger.map((item) => item.ledger_id),
  ]);
}

export function assessEvidenceQuality(
  packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(),
  alternatives: AlternativesTradeoffGeneratorResult = generateAlternativesTradeoff({ package_build_result: packageBuild }),
): EvidenceQualityAssessment {
  const sources = evidenceSources(packageBuild, alternatives);
  const complete = sources.length > 0 && packageBuild.completeness_report.validation_status === "COMPLETE";
  const consistent = packageBuild.validation.validation_state === "VALID" && alternatives.validation.validation_status === "VALID";
  const score = Number(((complete ? 0.4 : 0) + (consistent ? 0.3 : 0) + 0.2 + 0.1).toFixed(2));
  const base: Omit<EvidenceQualityAssessment, "integrity_hash"> = {
    assessment_id: `evidence_quality_${packageBuild.package.package_id}`,
    package_id: packageBuild.package.package_id,
    evidence_sources: sources,
    evidence_completeness: complete ? "COMPLETE" : sources.length > 0 ? "PARTIAL" : "MISSING",
    evidence_consistency: consistent ? "CONSISTENT" : "INCONSISTENT",
    evidence_reliability: score >= 0.8 ? "HIGH" : score >= 0.5 ? "MEDIUM" : "LOW",
    evidence_recency: "CURRENT",
    evidence_quality_score: score,
    assessment_summary: `Evidence sources=${sources.length}; completeness=${complete ? "COMPLETE" : "PARTIAL"}; consistency=${consistent ? "CONSISTENT" : "INCONSISTENT"}.`,
  };
  return Object.freeze({ ...base, integrity_hash: qualityHash(base) });
}

export function createRiskSummaryRecord(packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(), alternatives: AlternativesTradeoffGeneratorResult = generateAlternativesTradeoff({ package_build_result: packageBuild })): RiskSummaryRecord {
  const pkg = packageBuild.package;
  const hasFailClosed = packageBuild.fail_closed || alternatives.fail_closed;
  const base: Omit<RiskSummaryRecord, "integrity_hash"> = {
    risk_summary_id: `risk_summary_${pkg.package_id}`,
    package_id: pkg.package_id,
    operational_risk: pkg.risk_summary,
    governance_risk: pkg.governance_summary,
    constitutional_risk: pkg.constitutional_summary,
    implementation_risk: alternatives.tradeoff_analysis.disadvantages.join("; "),
    recovery_risk: pkg.recovery_guidance,
    overall_risk_profile: hasFailClosed ? "HIGH" : "MEDIUM",
  };
  return Object.freeze({ ...base, integrity_hash: riskHash(base) });
}

export function createConfidenceSummaryRecord(packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(), rationale: RecommendationRationaleGeneratorResult = generateRecommendationRationale({ package_build_result: packageBuild }), quality: EvidenceQualityAssessment = assessEvidenceQuality(packageBuild)): ConfidenceSummaryRecord {
  const pkg = packageBuild.package;
  const base: Omit<ConfidenceSummaryRecord, "integrity_hash"> = {
    confidence_summary_id: `confidence_summary_${pkg.package_id}`,
    package_id: pkg.package_id,
    recommendation_confidence: pkg.confidence_summary,
    evidence_confidence: `Evidence reliability is ${quality.evidence_reliability} with quality score ${quality.evidence_quality_score}.`,
    forecast_confidence: pkg.forecast_summary,
    uncertainty_summary: rationale.explanation.assumptions.join("; "),
    confidence_assessment: quality.evidence_reliability,
  };
  return Object.freeze({ ...base, integrity_hash: confidenceHash(base) });
}

export function createEvidenceRiskConfidenceSummary(
  packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(),
  rationale: RecommendationRationaleGeneratorResult = generateRecommendationRationale({ package_build_result: packageBuild }),
  alternatives: AlternativesTradeoffGeneratorResult = generateAlternativesTradeoff({ package_build_result: packageBuild, rationale_result: rationale }),
  quality: EvidenceQualityAssessment = assessEvidenceQuality(packageBuild, alternatives),
  risk: RiskSummaryRecord = createRiskSummaryRecord(packageBuild, alternatives),
  confidence: ConfidenceSummaryRecord = createConfidenceSummaryRecord(packageBuild, rationale, quality),
): EvidenceRiskConfidenceSummary {
  const pkg = packageBuild.package;
  const base: Omit<EvidenceRiskConfidenceSummary, "integrity_hash"> = {
    summary_id: `evidence_risk_confidence_summary_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    supporting_evidence_summary: pkg.evidence_summary,
    conflicting_evidence_summary: alternatives.rejected_records.map((item) => `${item.option_id}:${item.rejection_reason}`).join("; "),
    evidence_quality_summary: quality.assessment_summary,
    risk_summary: `${risk.overall_risk_profile}: ${risk.operational_risk}; recovery=${risk.recovery_risk}`,
    confidence_summary: `${confidence.confidence_assessment}: ${confidence.recommendation_confidence}; ${confidence.evidence_confidence}`,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: summaryHash(base) });
}

function summaryFailures(input: {
  packageBuild: DecisionPackageBuilderResult;
  rationale: RecommendationRationaleGeneratorResult;
  alternatives: AlternativesTradeoffGeneratorResult;
  summary: EvidenceRiskConfidenceSummary;
  quality: EvidenceQualityAssessment;
  risk: RiskSummaryRecord;
  confidence: ConfidenceSummaryRecord;
  authorized: boolean;
}): readonly EvidenceRiskConfidenceFailureReason[] {
  const failures: EvidenceRiskConfidenceFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_EVIDENCE_SUMMARIZER_ACCESS");
  if (input.packageBuild.builder_status !== "PASS") failures.push("PACKAGE_BUILD_INVALID");
  if (input.rationale.generator_status !== "PASS") failures.push("RATIONALE_INVALID");
  if (input.alternatives.generator_status !== "PASS") failures.push("ALTERNATIVES_INVALID");
  if (!input.summary.supporting_evidence_summary || input.quality.evidence_sources.length === 0) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (!input.summary.conflicting_evidence_summary) failures.push("CONFLICTING_EVIDENCE_UNAVAILABLE");
  if (!input.summary.evidence_quality_summary || input.quality.evidence_completeness === "MISSING") failures.push("EVIDENCE_QUALITY_ASSESSMENT_MISSING");
  if (input.quality.evidence_completeness !== "COMPLETE") failures.push("EVIDENCE_COMPLETENESS_UNVERIFIED");
  if (!input.summary.risk_summary || !input.risk.operational_risk) failures.push("RISK_SUMMARY_MISSING");
  if (!input.summary.confidence_summary || !input.confidence.recommendation_confidence) failures.push("CONFIDENCE_SUMMARY_MISSING");
  if (!input.summary.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.summary.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.summary.tenant_id !== input.packageBuild.package.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.summary.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (summaryHash(input.summary) !== input.summary.integrity_hash
    || qualityHash(input.quality) !== input.quality.integrity_hash
    || riskHash(input.risk) !== input.risk.integrity_hash
    || confidenceHash(input.confidence) !== input.confidence.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as EvidenceRiskConfidenceFailureReason[]);
}

function buildValidation(summary: EvidenceRiskConfidenceSummary, failures: readonly EvidenceRiskConfidenceFailureReason[]): SummaryValidationResult {
  const has = (failure: EvidenceRiskConfidenceFailureReason) => failures.includes(failure);
  const base: Omit<SummaryValidationResult, "integrity_hash"> = {
    validation_id: `evidence_summary_validation_${summary.summary_id}`,
    package_id: summary.package_id,
    evidence_complete: !has("SUPPORTING_EVIDENCE_MISSING") && !has("EVIDENCE_COMPLETENESS_UNVERIFIED"),
    conflicting_evidence_documented: !has("CONFLICTING_EVIDENCE_UNAVAILABLE"),
    evidence_quality_complete: !has("EVIDENCE_QUALITY_ASSESSMENT_MISSING"),
    risk_complete: !has("RISK_SUMMARY_MISSING"),
    confidence_complete: !has("CONFIDENCE_SUMMARY_MISSING"),
    replay_present: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    lineage_present: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(summary: EvidenceRiskConfidenceSummary, validation: SummaryValidationResult): readonly EvidenceSummaryLedgerEntry[] {
  const base: Omit<EvidenceSummaryLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `evidence_summary_ledger_${summary.summary_id}`,
    summary_id: summary.summary_id,
    package_id: summary.package_id,
    orchestration_id: summary.orchestration_id,
    generation_timestamp: NOW,
    replay_ref: summary.replay_ref,
    lineage_ref: summary.lineage_ref,
    integrity_hash: summary.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<EvidenceRiskConfidenceResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    package_build_result: result.package_build_result,
    rationale_result: result.rationale_result,
    alternatives_result: result.alternatives_result,
    summary: result.summary,
    quality_assessment: result.quality_assessment,
    risk_record: result.risk_record,
    confidence_record: result.confidence_record,
    validation: result.validation,
    evidence_ledger: result.evidence_ledger,
    failures: result.failures,
  });
}

export function summarizeEvidenceRiskConfidence(input: EvidenceRiskConfidenceInput = {}): EvidenceRiskConfidenceResult {
  const package_build_result = input.package_build_result ?? buildDecisionPackage();
  const rationale_result = input.rationale_result ?? generateRecommendationRationale({ package_build_result });
  const alternatives_result = input.alternatives_result ?? generateAlternativesTradeoff({ package_build_result, rationale_result });
  const quality_assessment = input.quality_assessment ?? assessEvidenceQuality(package_build_result, alternatives_result);
  const risk_record = input.risk_record ?? createRiskSummaryRecord(package_build_result, alternatives_result);
  const confidence_record = input.confidence_record ?? createConfidenceSummaryRecord(package_build_result, rationale_result, quality_assessment);
  const summary = input.summary ?? createEvidenceRiskConfidenceSummary(package_build_result, rationale_result, alternatives_result, quality_assessment, risk_record, confidence_record);
  const initialFailures = summaryFailures({
    packageBuild: package_build_result,
    rationale: rationale_result,
    alternatives: alternatives_result,
    summary,
    quality: quality_assessment,
    risk: risk_record,
    confidence: confidence_record,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(summary, initialFailures);
  const ledger = writeLedger(summary, validation);
  const ledgerFailures: readonly EvidenceRiskConfidenceFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as EvidenceRiskConfidenceFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(summary, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(summary, finalValidation);
  const base: Omit<EvidenceRiskConfidenceResult, "integrity_hash" | "replay_hash"> = {
    summarization_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    package_build_result,
    rationale_result,
    alternatives_result,
    summary,
    quality_assessment,
    risk_record,
    confidence_record,
    validation: finalValidation,
    evidence_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly EvidenceRiskConfidenceFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(summary, replayFailures);
    const replayBase: Omit<EvidenceRiskConfidenceResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      summarization_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      evidence_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayEvidenceRiskConfidence(result: EvidenceRiskConfidenceResult): EvidenceRiskConfidenceReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && summaryHash(result.summary) === result.summary.integrity_hash
    && qualityHash(result.quality_assessment) === result.quality_assessment.integrity_hash
    && riskHash(result.risk_record) === result.risk_record.integrity_hash
    && confidenceHash(result.confidence_record) === result.confidence_record.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.evidence_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: EvidenceRiskConfidenceFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<EvidenceRiskConfidenceReplay, "integrity_hash"> = {
    replay_id: "replay_evidence_risk_confidence_summarization",
    replay_valid,
    summary_id: result.summary.summary_id,
    package_id: result.summary.package_id,
    evidence_sources: result.quality_assessment.evidence_sources,
    risk_profile: result.risk_record.overall_risk_profile,
    confidence_assessment: result.confidence_record.confidence_assessment,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildEvidenceRiskConfidenceObservability(result: EvidenceRiskConfidenceResult): EvidenceRiskConfidenceObservability {
  return Object.freeze({
    evidence_summaries_generated: result.summarization_status === "PASS" ? 1 : 0,
    evidence_completeness: result.validation.evidence_complete ? 1 : 0,
    conflicting_evidence_coverage: result.validation.conflicting_evidence_documented ? 1 : 0,
    evidence_quality_scores: result.quality_assessment.evidence_quality_score,
    risk_summaries_generated: result.validation.risk_complete ? 1 : 0,
    confidence_summaries_generated: result.validation.confidence_complete ? 1 : 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayEvidenceRiskConfidence(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getEvidenceRiskConfidenceFoundation(): EvidenceRiskConfidenceFoundation {
  const result = summarizeEvidenceRiskConfidence();
  const replay = replayEvidenceRiskConfidence(result);
  return Object.freeze({
    summarizer_version: SUMMARIZER_VERSION,
    summary_states: EVIDENCE_RISK_CONFIDENCE_SUMMARY_STATES,
    result,
    replay,
    observability: buildEvidenceRiskConfidenceObservability(result),
  });
}

export const EvidenceRiskConfidenceSummarization = Object.freeze({
  summarize: summarizeEvidenceRiskConfidence,
  replay: replayEvidenceRiskConfidence,
});
