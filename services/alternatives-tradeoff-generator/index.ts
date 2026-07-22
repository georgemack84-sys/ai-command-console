import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { buildDecisionPackage } from "@/services/decision-package-builder";
import { generateRecommendationRationale } from "@/services/recommendation-rationale-generator";
import type { DecisionPackageBuilderResult } from "@/types/decision-package-builder";
import type { RecommendationRationaleGeneratorResult } from "@/types/recommendation-rationale-generator";
import type {
  AlternativeAnalysisLedgerEntry,
  AlternativeAnalysisState,
  AlternativeDecisionAnalysis,
  AlternativeOptionRecord,
  AlternativeValidationResult,
  AlternativesTradeoffFailureReason,
  AlternativesTradeoffFoundation,
  AlternativesTradeoffGeneratorInput,
  AlternativesTradeoffGeneratorResult,
  AlternativesTradeoffObservability,
  AlternativesTradeoffReplay,
  ComparativeDecisionReport,
  OpportunityCostCategory,
  RejectedOptionRecord,
  TradeoffAnalysis,
  TradeoffCategory,
} from "@/types/alternatives-tradeoff-generator";

const GENERATOR_VERSION = "alternatives-tradeoff-generator/v1" as const;
const AUTHORIZED_COMPONENT = "alternatives-tradeoff-generator";
const NOW = "2026-07-04T01:02:00.000Z";

export const ALTERNATIVE_ANALYSIS_STATES: readonly AlternativeAnalysisState[] = Object.freeze(["INITIALIZED", "GENERATING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);
export const TRADEOFF_CATEGORIES: readonly TradeoffCategory[] = Object.freeze([
  "mission effectiveness",
  "operational efficiency",
  "implementation complexity",
  "governance impact",
  "constitutional considerations",
  "authority implications",
  "confidence",
  "uncertainty",
  "timing",
  "resource utilization",
  "scalability",
  "recoverability",
]);
export const OPPORTUNITY_COST_CATEGORIES: readonly OpportunityCostCategory[] = Object.freeze([
  "delayed mission objectives",
  "foregone operational gains",
  "additional governance reviews",
  "resource consumption",
  "reduced future flexibility",
  "increased recovery effort",
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

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

function altHash(record: Omit<AlternativeOptionRecord, "integrity_hash"> | AlternativeOptionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeAlternativeOptionHash(record: Omit<AlternativeOptionRecord, "integrity_hash"> | AlternativeOptionRecord): string {
  return altHash(record);
}

function rejectedHash(record: Omit<RejectedOptionRecord, "integrity_hash"> | RejectedOptionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeRejectedOptionHash(record: Omit<RejectedOptionRecord, "integrity_hash"> | RejectedOptionRecord): string {
  return rejectedHash(record);
}

function tradeoffHash(record: Omit<TradeoffAnalysis, "integrity_hash"> | TradeoffAnalysis): string {
  return hashWithoutIntegrity(record);
}

export function computeTradeoffAnalysisHash(record: Omit<TradeoffAnalysis, "integrity_hash"> | TradeoffAnalysis): string {
  return tradeoffHash(record);
}

function reportHash(report: Omit<ComparativeDecisionReport, "integrity_hash"> | ComparativeDecisionReport): string {
  return hashWithoutIntegrity(report);
}

export function computeComparativeDecisionReportHash(report: Omit<ComparativeDecisionReport, "integrity_hash"> | ComparativeDecisionReport): string {
  return reportHash(report);
}

function analysisHash(analysis: Omit<AlternativeDecisionAnalysis, "integrity_hash"> | AlternativeDecisionAnalysis): string {
  return hashWithoutIntegrity(analysis);
}

export function computeAlternativeDecisionAnalysisHash(analysis: Omit<AlternativeDecisionAnalysis, "integrity_hash"> | AlternativeDecisionAnalysis): string {
  return analysisHash(analysis);
}

function validationHash(validation: Omit<AlternativeValidationResult, "integrity_hash"> | AlternativeValidationResult): string {
  return hashWithoutIntegrity(validation);
}

function ledgerHash(entry: Omit<AlternativeAnalysisLedgerEntry, "ledger_integrity_hash"> | AlternativeAnalysisLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

export function renderAlternativeOptions(packageBuild: DecisionPackageBuilderResult = buildDecisionPackage()): readonly AlternativeOptionRecord[] {
  const pkg = packageBuild.package;
  return Object.freeze(pkg.alternative_options.map((option, index) => {
    const base: Omit<AlternativeOptionRecord, "integrity_hash"> = {
      option_id: option.option_id,
      candidate_id: `candidate_alternative_${String(index + 1).padStart(2, "0")}_${pkg.orchestration_id}`,
      option_summary: option.summary,
      advantages: normalize(["preserves operator discretion", "supports additional evidence review", ...option.governance_notes]),
      disadvantages: normalize(["delays final operator presentation", "requires additional review effort"]),
      confidence_summary: pkg.confidence_summary,
      risk_summary: pkg.risk_summary,
      governance_status: pkg.governance_summary,
      replay_ref: option.replay_ref,
    };
    return Object.freeze({ ...base, integrity_hash: altHash(base) });
  }));
}

export function analyzeRejectedOptions(packageBuild: DecisionPackageBuilderResult = buildDecisionPackage()): readonly RejectedOptionRecord[] {
  const pkg = packageBuild.package;
  return Object.freeze(pkg.rejected_options.map((option) => {
    const base: Omit<RejectedOptionRecord, "integrity_hash"> = {
      option_id: option.option_id,
      rejection_reason: option.summary,
      evidence_summary: pkg.evidence_summary,
      governance_constraints: normalize([pkg.governance_summary, ...option.governance_notes]),
      constitutional_constraints: normalize([pkg.constitutional_summary, "constitutional controls preserved"]),
      risk_factors: normalize([pkg.risk_summary, "governance bypass risk"]),
      replay_ref: option.replay_ref,
    };
    return Object.freeze({ ...base, integrity_hash: rejectedHash(base) });
  }));
}

export function generateTradeoffAnalysis(
  packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(),
  alternatives: readonly AlternativeOptionRecord[] = renderAlternativeOptions(packageBuild),
  rejected: readonly RejectedOptionRecord[] = analyzeRejectedOptions(packageBuild),
): TradeoffAnalysis {
  const pkg = packageBuild.package;
  const compared = normalize([pkg.recommended_option.option_id, ...alternatives.map((item) => item.option_id), ...rejected.map((item) => item.option_id)]);
  const advantages = normalize([
    `recommended:${pkg.recommended_option.summary}`,
    ...alternatives.flatMap((item) => [...item.advantages]),
  ]);
  const disadvantages = normalize([
    ...alternatives.flatMap((item) => [...item.disadvantages]),
    ...rejected.flatMap((item) => [...item.risk_factors]),
  ]);
  const opportunityCosts = normalize([
    "additional governance review may delay presentation",
    "requesting more evidence may defer near-term mission progress",
    "rejecting governance bypass preserves safety at the cost of speed",
  ]);
  const base: Omit<TradeoffAnalysis, "integrity_hash"> = {
    tradeoff_id: `tradeoff_analysis_${pkg.package_id}`,
    compared_options: compared,
    advantages,
    disadvantages,
    tradeoff_categories: TRADEOFF_CATEGORIES,
    tradeoff_summary: `Compared ${compared.length} options without changing ranking; recommendation remains ${pkg.recommended_option.option_id}.`,
    opportunity_costs: opportunityCosts,
    opportunity_cost_categories: OPPORTUNITY_COST_CATEGORIES,
  };
  return Object.freeze({ ...base, integrity_hash: tradeoffHash(base) });
}

export function generateComparativeDecisionReport(
  packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(),
  alternatives: readonly AlternativeOptionRecord[] = renderAlternativeOptions(packageBuild),
  rejected: readonly RejectedOptionRecord[] = analyzeRejectedOptions(packageBuild),
  tradeoff: TradeoffAnalysis = generateTradeoffAnalysis(packageBuild, alternatives, rejected),
): ComparativeDecisionReport {
  const pkg = packageBuild.package;
  const matrix = normalize([
    `recommended|${pkg.recommended_option.option_id}|${pkg.recommended_option.summary}|${pkg.governance_summary}`,
    ...alternatives.map((item) => `alternative|${item.option_id}|${item.option_summary}|${item.governance_status}`),
    ...rejected.map((item) => `rejected|${item.option_id}|${item.rejection_reason}|${item.governance_constraints.join("+")}`),
  ]);
  const base: Omit<ComparativeDecisionReport, "integrity_hash"> = {
    report_id: `comparative_decision_report_${pkg.package_id}`,
    recommended_option: pkg.recommended_option.option_id,
    comparison_matrix: matrix,
    operator_summary: `${tradeoff.tradeoff_summary} Opportunity costs: ${tradeoff.opportunity_costs.join("; ")}.`,
    replay_ref: pkg.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function createAlternativeDecisionAnalysis(
  packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(),
  alternatives: readonly AlternativeOptionRecord[] = renderAlternativeOptions(packageBuild),
  rejected: readonly RejectedOptionRecord[] = analyzeRejectedOptions(packageBuild),
  tradeoff: TradeoffAnalysis = generateTradeoffAnalysis(packageBuild, alternatives, rejected),
  report: ComparativeDecisionReport = generateComparativeDecisionReport(packageBuild, alternatives, rejected, tradeoff),
): AlternativeDecisionAnalysis {
  const pkg = packageBuild.package;
  const base: Omit<AlternativeDecisionAnalysis, "integrity_hash"> = {
    analysis_id: `alternative_decision_analysis_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    recommended_option: pkg.recommended_option.option_id,
    alternative_options: alternatives.map((item) => item.option_id),
    rejected_options: rejected.map((item) => item.option_id),
    tradeoff_summary: tradeoff.tradeoff_summary,
    opportunity_cost_summary: tradeoff.opportunity_costs.join("; "),
    comparative_decision_report: report.report_id,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: analysisHash(base) });
}

function failuresFor(input: {
  packageBuild: DecisionPackageBuilderResult;
  rationale: RecommendationRationaleGeneratorResult;
  analysis: AlternativeDecisionAnalysis;
  alternatives: readonly AlternativeOptionRecord[];
  rejected: readonly RejectedOptionRecord[];
  tradeoff: TradeoffAnalysis;
  report: ComparativeDecisionReport;
  authorized: boolean;
}): readonly AlternativesTradeoffFailureReason[] {
  const failures: AlternativesTradeoffFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_TRADEOFF_GENERATOR_ACCESS");
  if (input.packageBuild.builder_status !== "PASS") failures.push("PACKAGE_BUILD_INVALID");
  if (input.rationale.generator_status !== "PASS") failures.push("RATIONALE_GENERATION_INVALID");
  if (input.alternatives.length === 0) failures.push("ALTERNATIVES_MISSING");
  if (input.rejected.length === 0) failures.push("REJECTED_OPTIONS_UNAVAILABLE");
  if (input.rejected.some((item) => !item.rejection_reason)) failures.push("REJECTION_RATIONALE_ABSENT");
  if (!input.tradeoff.tradeoff_summary || input.tradeoff.advantages.length === 0 || input.tradeoff.disadvantages.length === 0) failures.push("TRADEOFF_SUMMARY_MISSING");
  if (input.tradeoff.opportunity_costs.length === 0 || !input.analysis.opportunity_cost_summary) failures.push("OPPORTUNITY_COSTS_UNAVAILABLE");
  if (!input.report.operator_summary || input.report.comparison_matrix.length === 0 || !input.analysis.comparative_decision_report) failures.push("COMPARATIVE_REPORT_INCOMPLETE");
  if (!input.analysis.replay_ref || !input.report.replay_ref || input.alternatives.some((item) => !item.replay_ref) || input.rejected.some((item) => !item.replay_ref)) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.analysis.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.analysis.tenant_id !== input.packageBuild.package.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.analysis.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (analysisHash(input.analysis) !== input.analysis.integrity_hash
    || input.alternatives.some((item) => altHash(item) !== item.integrity_hash)
    || input.rejected.some((item) => rejectedHash(item) !== item.integrity_hash)
    || tradeoffHash(input.tradeoff) !== input.tradeoff.integrity_hash
    || reportHash(input.report) !== input.report.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as AlternativesTradeoffFailureReason[]);
}

function buildValidation(analysis: AlternativeDecisionAnalysis, failures: readonly AlternativesTradeoffFailureReason[]): AlternativeValidationResult {
  const has = (failure: AlternativesTradeoffFailureReason) => failures.includes(failure);
  const base: Omit<AlternativeValidationResult, "integrity_hash"> = {
    validation_id: `alternative_validation_${analysis.analysis_id}`,
    analysis_id: analysis.analysis_id,
    alternatives_available: !has("ALTERNATIVES_MISSING"),
    rejections_explained: !has("REJECTED_OPTIONS_UNAVAILABLE") && !has("REJECTION_RATIONALE_ABSENT"),
    tradeoffs_complete: !has("TRADEOFF_SUMMARY_MISSING"),
    opportunity_costs_documented: !has("OPPORTUNITY_COSTS_UNAVAILABLE"),
    comparative_report_complete: !has("COMPARATIVE_REPORT_INCOMPLETE"),
    replay_present: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    lineage_present: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(analysis: AlternativeDecisionAnalysis, validation: AlternativeValidationResult): readonly AlternativeAnalysisLedgerEntry[] {
  const base: Omit<AlternativeAnalysisLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `alternative_analysis_ledger_${analysis.analysis_id}`,
    analysis_id: analysis.analysis_id,
    package_id: analysis.package_id,
    orchestration_id: analysis.orchestration_id,
    generation_timestamp: NOW,
    replay_ref: analysis.replay_ref,
    lineage_ref: analysis.lineage_ref,
    integrity_hash: analysis.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<AlternativesTradeoffGeneratorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    package_build_result: result.package_build_result,
    rationale_result: result.rationale_result,
    analysis: result.analysis,
    alternative_records: result.alternative_records,
    rejected_records: result.rejected_records,
    tradeoff_analysis: result.tradeoff_analysis,
    comparative_report: result.comparative_report,
    validation: result.validation,
    analysis_ledger: result.analysis_ledger,
    failures: result.failures,
  });
}

export function generateAlternativesTradeoff(input: AlternativesTradeoffGeneratorInput = {}): AlternativesTradeoffGeneratorResult {
  const package_build_result = input.package_build_result ?? buildDecisionPackage();
  const rationale_result = input.rationale_result ?? generateRecommendationRationale({ package_build_result });
  const alternative_records = input.alternative_records ?? renderAlternativeOptions(package_build_result);
  const rejected_records = input.rejected_records ?? analyzeRejectedOptions(package_build_result);
  const tradeoff_analysis = input.tradeoff_analysis ?? generateTradeoffAnalysis(package_build_result, alternative_records, rejected_records);
  const comparative_report = input.comparative_report ?? generateComparativeDecisionReport(package_build_result, alternative_records, rejected_records, tradeoff_analysis);
  const analysis = input.analysis ?? createAlternativeDecisionAnalysis(package_build_result, alternative_records, rejected_records, tradeoff_analysis, comparative_report);
  const initialFailures = failuresFor({
    packageBuild: package_build_result,
    rationale: rationale_result,
    analysis,
    alternatives: alternative_records,
    rejected: rejected_records,
    tradeoff: tradeoff_analysis,
    report: comparative_report,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(analysis, initialFailures);
  const ledger = writeLedger(analysis, validation);
  const ledgerFailures: readonly AlternativesTradeoffFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as AlternativesTradeoffFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(analysis, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(analysis, finalValidation);
  const base: Omit<AlternativesTradeoffGeneratorResult, "integrity_hash" | "replay_hash"> = {
    generator_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    package_build_result,
    rationale_result,
    analysis,
    alternative_records,
    rejected_records,
    tradeoff_analysis,
    comparative_report,
    validation: finalValidation,
    analysis_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly AlternativesTradeoffFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(analysis, replayFailures);
    const replayBase: Omit<AlternativesTradeoffGeneratorResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      generator_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      analysis_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAlternativesTradeoff(result: AlternativesTradeoffGeneratorResult): AlternativesTradeoffReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && analysisHash(result.analysis) === result.analysis.integrity_hash
    && result.alternative_records.every((item) => altHash(item) === item.integrity_hash)
    && result.rejected_records.every((item) => rejectedHash(item) === item.integrity_hash)
    && tradeoffHash(result.tradeoff_analysis) === result.tradeoff_analysis.integrity_hash
    && reportHash(result.comparative_report) === result.comparative_report.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.analysis_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: AlternativesTradeoffFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<AlternativesTradeoffReplay, "integrity_hash"> = {
    replay_id: "replay_alternatives_tradeoff_generator",
    replay_valid,
    analysis_id: result.analysis.analysis_id,
    package_id: result.analysis.package_id,
    alternative_refs: result.alternative_records.map((item) => item.option_id),
    rejected_refs: result.rejected_records.map((item) => item.option_id),
    report_ref: result.comparative_report.report_id,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildAlternativesTradeoffObservability(result: AlternativesTradeoffGeneratorResult): AlternativesTradeoffObservability {
  return Object.freeze({
    alternatives_rendered: result.alternative_records.length,
    rejected_options_analyzed: result.rejected_records.length,
    tradeoff_summaries_generated: result.tradeoff_analysis.tradeoff_summary ? 1 : 0,
    opportunity_costs_documented: result.tradeoff_analysis.opportunity_costs.length,
    comparison_completeness: result.validation.comparative_report_complete ? 1 : 0,
    analysis_generation_latency_ms: 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayAlternativesTradeoff(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getAlternativesTradeoffFoundation(): AlternativesTradeoffFoundation {
  const result = generateAlternativesTradeoff();
  const replay = replayAlternativesTradeoff(result);
  return Object.freeze({
    generator_version: GENERATOR_VERSION,
    analysis_states: ALTERNATIVE_ANALYSIS_STATES,
    tradeoff_categories: TRADEOFF_CATEGORIES,
    opportunity_cost_categories: OPPORTUNITY_COST_CATEGORIES,
    result,
    replay,
    observability: buildAlternativesTradeoffObservability(result),
  });
}

export const AlternativesTradeoffGenerator = Object.freeze({
  generate: generateAlternativesTradeoff,
  replay: replayAlternativesTradeoff,
});
