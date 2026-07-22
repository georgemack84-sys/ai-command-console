import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  arbitrateClassifiedConflicts,
  computeArbitrationIntegrityHash,
} from "@/services/decision-arbitration-rules-engine";
import type {
  ArbitrationOutcome,
  ArbitrationResult,
} from "@/types/decision-arbitration-rules-engine";
import type {
  DecisionComparisonReport,
  TradeoffExplanation,
  TradeoffExplanationFailureReason,
  TradeoffExplanationGeneratorFoundation,
  TradeoffExplanationGeneratorInput,
  TradeoffExplanationGeneratorResult,
  TradeoffExplanationObservability,
  TradeoffExplanationReplay,
  TradeoffExplanationSection,
  TradeoffExplanationSectionName,
  TradeoffExplanationValidation,
  TradeoffLedgerRecord,
} from "@/types/decision-tradeoff-explanation-generator";

const NOW = "2026-07-03T23:40:00.000Z";
const GENERATOR_VERSION = "tradeoff-explanation-generator/v1" as const;
const AUTHORIZED_COMPONENT = "decision-tradeoff-explanation-generator";

export const REQUIRED_TRADEOFF_SECTIONS: readonly TradeoffExplanationSectionName[] = Object.freeze([
  "Executive Summary",
  "Conflict Overview",
  "Evidence Analysis",
  "Risk Assessment",
  "Confidence Assessment",
  "Governance Analysis",
  "Constitutional Analysis",
  "Mission Analysis",
  "Forecast Analysis",
  "Recovery Analysis",
  "Final Arbitration Outcome",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function selectedDecision(arbitration: ArbitrationResult): string {
  if (arbitration.selected_candidate_refs.length > 0) return arbitration.selected_candidate_refs.join(",");
  if (arbitration.arbitration_outcome === "REJECT") return "none_rejected_by_constitution_or_boundary";
  if (arbitration.escalation_required) return "none_pending_escalation";
  return arbitration.evaluated_candidates[0] ?? "none_available";
}

function rejectedDecisions(arbitration: ArbitrationResult): readonly string[] {
  if (arbitration.rejected_candidate_refs.length > 0) return arbitration.rejected_candidate_refs;
  if (arbitration.selected_candidate_refs.length > 0) {
    return Object.freeze(arbitration.evaluated_candidates.filter((candidate) => !arbitration.selected_candidate_refs.includes(candidate)));
  }
  return Object.freeze(arbitration.evaluated_candidates);
}

function supportingEvidence(arbitration: ArbitrationResult): readonly string[] {
  return Object.freeze(normalizeStrings([
    `evidence_arbitration_${arbitration.arbitration_id}`,
    ...arbitration.evaluated_candidates.map((candidate) => `evidence_${candidate}`),
    ...arbitration.rules_applied.map((rule) => `evidence_rule_${rule}`),
  ]));
}

function rejectedEvidence(arbitration: ArbitrationResult): readonly string[] {
  const rejected = rejectedDecisions(arbitration);
  const refs = rejected.length > 0
    ? rejected.map((candidate) => `rejected_evidence_${candidate}`)
    : [`rejected_evidence_none_${arbitration.arbitration_id}`];
  return Object.freeze(normalizeStrings(refs));
}

function outcomePhrase(outcome: ArbitrationOutcome): string {
  return outcome.toLowerCase().replaceAll("_", " ");
}

function riskComparison(arbitration: ArbitrationResult): string {
  if (arbitration.arbitration_outcome === "DEFER") return "Risk weighting prevented deterministic resolution; operational risk remains unresolved.";
  if (arbitration.arbitration_outcome === "REJECT") return "Rejected path carried unacceptable constitutional, tenant, or authority risk.";
  return `Risk comparison followed ${arbitration.resolution_priority_path.join(" > ")} and preserved advisory review.`;
}

function confidenceComparison(arbitration: ArbitrationResult): string {
  if (arbitration.arbitration_outcome === "REQUIRE_SIMULATION") return "Confidence was insufficient for deterministic arbitration; simulation is required.";
  return "Confidence comparison used evaluated candidate evidence and did not authorize autonomous execution.";
}

function missionImpact(arbitration: ArbitrationResult): string {
  if (arbitration.arbitration_outcome === "SPLIT_DECISION") return "Mission impact contains competing valid objectives; both paths remain visible for review.";
  return `Mission impact follows the ${outcomePhrase(arbitration.arbitration_outcome)} outcome with escalation state ${arbitration.escalation_required}.`;
}

function forecastComparison(arbitration: ArbitrationResult): string {
  if (arbitration.arbitration_outcome === "REQUIRE_SIMULATION") return "Forecast divergence or confidence degradation requires simulation before advancement.";
  return "Forecast comparison found no higher-priority forecast requirement overriding the arbitration outcome.";
}

function recoveryImplications(arbitration: ArbitrationResult): string {
  if (arbitration.arbitration_outcome === "REQUIRE_CERTIFICATION") return "Recovery and certification implications require certified readiness before advancement.";
  return "Recovery implications remain advisory and subordinate to constitution, governance, authority, and safety.";
}

function sectionContent(section: TradeoffExplanationSectionName, arbitration: ArbitrationResult): string {
  const selected = selectedDecision(arbitration);
  const rejected = rejectedDecisions(arbitration).join(",") || "none";
  if (section === "Executive Summary") return `Arbitration ${arbitration.arbitration_id} produced ${arbitration.arbitration_outcome} for conflict ${arbitration.conflict_id}.`;
  if (section === "Conflict Overview") return `Compared decisions ${arbitration.evaluated_candidates.join(",")} with selected decision ${selected} and rejected decisions ${rejected}.`;
  if (section === "Evidence Analysis") return `Supporting evidence ${supportingEvidence(arbitration).join(",")} and rejected evidence ${rejectedEvidence(arbitration).join(",")} are preserved.`;
  if (section === "Risk Assessment") return riskComparison(arbitration);
  if (section === "Confidence Assessment") return confidenceComparison(arbitration);
  if (section === "Governance Analysis") return arbitration.governance_summary;
  if (section === "Constitutional Analysis") return arbitration.constitutional_summary;
  if (section === "Mission Analysis") return missionImpact(arbitration);
  if (section === "Forecast Analysis") return forecastComparison(arbitration);
  if (section === "Recovery Analysis") return recoveryImplications(arbitration);
  return `Final outcome ${arbitration.arbitration_outcome}; operator summary: ${arbitration.operator_summary}`;
}

function buildSection(section_name: TradeoffExplanationSectionName, arbitration: ArbitrationResult): TradeoffExplanationSection {
  const base: Omit<TradeoffExplanationSection, "integrity_hash"> = {
    section_name,
    content: sectionContent(section_name, arbitration),
    evidence_refs: section_name === "Evidence Analysis" ? supportingEvidence(arbitration) : Object.freeze([`section_evidence_${section_name.toLowerCase().replaceAll(" ", "_")}`]),
    replay_ref: `${arbitration.replay_ref}_section_${section_name.toLowerCase().replaceAll(" ", "_")}`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function generateTradeoffExplanation(arbitration: ArbitrationResult): TradeoffExplanation {
  const supporting = supportingEvidence(arbitration);
  const rejected = rejectedEvidence(arbitration);
  const sections = Object.freeze(REQUIRED_TRADEOFF_SECTIONS.map((section) => buildSection(section, arbitration)));
  const base: Omit<TradeoffExplanation, "integrity_hash"> = {
    explanation_id: `tradeoff_explanation_${arbitration.arbitration_id}`,
    arbitration_id: arbitration.arbitration_id,
    conflict_id: arbitration.conflict_id,
    selected_decision: selectedDecision(arbitration),
    rejected_decisions: rejectedDecisions(arbitration),
    tradeoff_summary: `Outcome ${arbitration.arbitration_outcome} accepted tradeoffs ${arbitration.tradeoff_metadata.join(",") || "none"} while preserving all evaluated alternatives.`,
    explanation_sections: sections,
    supporting_evidence_refs: supporting,
    rejected_evidence_refs: rejected,
    risk_comparison: riskComparison(arbitration),
    confidence_comparison: confidenceComparison(arbitration),
    governance_reasoning: arbitration.governance_summary,
    constitutional_reasoning: arbitration.constitutional_summary,
    mission_impact: missionImpact(arbitration),
    forecast_comparison: forecastComparison(arbitration),
    recovery_implications: recoveryImplications(arbitration),
    advisory_only: true,
    replay_ref: `${arbitration.replay_ref}_tradeoff_explanation`,
    lineage_ref: `${arbitration.lineage_ref}_tradeoff_explanation`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function computeTradeoffExplanationIntegrityHash(explanation: Omit<TradeoffExplanation, "integrity_hash"> | TradeoffExplanation): string {
  return hashWithoutIntegrity(explanation);
}

export function generateDecisionComparisonReport(arbitration: ArbitrationResult, explanation: TradeoffExplanation): DecisionComparisonReport {
  const base: Omit<DecisionComparisonReport, "integrity_hash"> = {
    report_id: `decision_comparison_${arbitration.arbitration_id}`,
    arbitration_id: arbitration.arbitration_id,
    compared_decisions: arbitration.evaluated_candidates,
    evidence_analysis: sectionContent("Evidence Analysis", arbitration),
    risk_analysis: explanation.risk_comparison,
    confidence_analysis: explanation.confidence_comparison,
    governance_analysis: explanation.governance_reasoning,
    constitutional_analysis: explanation.constitutional_reasoning,
    mission_analysis: explanation.mission_impact,
    forecast_analysis: explanation.forecast_comparison,
    recovery_analysis: explanation.recovery_implications,
    selected_outcome: arbitration.arbitration_outcome,
    replay_ref: `${explanation.replay_ref}_comparison_report`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationResult(failures: readonly TradeoffExplanationFailureReason[]): TradeoffExplanationValidation {
  const unique = Object.freeze([...new Set(failures)] as TradeoffExplanationFailureReason[]);
  const has = (failure: TradeoffExplanationFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      arbitration_present: !has("MISSING_ARBITRATION_RECORDS"),
      evidence_complete: !has("INCOMPLETE_EVIDENCE"),
      rejected_evidence_present: !has("OMITTED_REJECTED_EVIDENCE"),
      governance_reasoning_present: !has("MISSING_GOVERNANCE_REASONING"),
      constitutional_reasoning_present: !has("MISSING_CONSTITUTIONAL_REASONING"),
      mandatory_sections_present: !has("MISSING_MANDATORY_SECTION"),
      replay_valid: !has("REPLAY_CORRUPTION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("CROSS_TENANT_EXPLANATION_LEAKAGE"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function validateTradeoffExplanation(arbitration: ArbitrationResult | undefined, explanation: unknown, report?: DecisionComparisonReport): TradeoffExplanationValidation {
  const failures: TradeoffExplanationFailureReason[] = [];
  if (!arbitration) failures.push("MISSING_ARBITRATION_RECORDS");
  if (!explanation || typeof explanation !== "object" || Array.isArray(explanation)) return validationResult([...failures, "INCOMPLETE_EXPLANATION_REPORT"]);
  const typed = explanation as TradeoffExplanation;
  const sectionNames = typed.explanation_sections?.map((section) => section.section_name) ?? [];
  if (!typed.supporting_evidence_refs?.length) failures.push("INCOMPLETE_EVIDENCE");
  if (!typed.rejected_evidence_refs?.length) failures.push("OMITTED_REJECTED_EVIDENCE");
  if (!typed.governance_reasoning) failures.push("MISSING_GOVERNANCE_REASONING");
  if (!typed.constitutional_reasoning) failures.push("MISSING_CONSTITUTIONAL_REASONING");
  if (!REQUIRED_TRADEOFF_SECTIONS.every((section) => sectionNames.includes(section))) failures.push("MISSING_MANDATORY_SECTION");
  if (!typed.replay_ref) failures.push("REPLAY_CORRUPTION");
  if (typed.advisory_only !== true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (arbitration && computeArbitrationIntegrityHash(arbitration) !== arbitration.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (typed.integrity_hash && computeTradeoffExplanationIntegrityHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (typed.explanation_sections?.some((section) => hashWithoutIntegrity(section) !== section.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH");
  if (JSON.stringify(typed).includes("tenant_beta") && !typed.conflict_id.includes("tenant_beta")) failures.push("CROSS_TENANT_EXPLANATION_LEAKAGE");
  if (report) {
    if (!report.evidence_analysis || !report.governance_analysis || !report.constitutional_analysis || !report.risk_analysis || !report.confidence_analysis || !report.mission_analysis || !report.forecast_analysis || !report.recovery_analysis) failures.push("INCOMPLETE_EXPLANATION_REPORT");
    if (hashWithoutIntegrity(report) !== report.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  }
  return validationResult(failures);
}

function ledgerHash(record: Omit<TradeoffLedgerRecord, "integrity_hash"> | TradeoffLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeTradeoffLedger(arbitration: ArbitrationResult, explanation: TradeoffExplanation, report: DecisionComparisonReport): TradeoffLedgerRecord {
  const base: Omit<TradeoffLedgerRecord, "integrity_hash"> = {
    ledger_id: `tradeoff_ledger_${explanation.explanation_id}`,
    explanation_id: explanation.explanation_id,
    arbitration_id: arbitration.arbitration_id,
    arbitration_outcome: arbitration.arbitration_outcome,
    compared_decisions: arbitration.evaluated_candidates,
    evidence_refs: Object.freeze(normalizeStrings([...explanation.supporting_evidence_refs, ...explanation.rejected_evidence_refs])),
    tradeoffs: arbitration.tradeoff_metadata,
    governance_reasoning: explanation.governance_reasoning,
    constitutional_reasoning: explanation.constitutional_reasoning,
    replay_ref: explanation.replay_ref,
    lineage_ref: explanation.lineage_ref,
    explanation_hash: explanation.integrity_hash,
    report_hash: report.integrity_hash,
    ledger_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function replayHash(result: Omit<TradeoffExplanationGeneratorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    explanations: result.explanations,
    reports: result.reports,
    validations: result.validations,
    ledger_records: result.ledger_records,
    failures: result.failures,
  });
}

function failResult(failures: readonly TradeoffExplanationFailureReason[]): TradeoffExplanationGeneratorResult {
  const base: Omit<TradeoffExplanationGeneratorResult, "integrity_hash" | "replay_hash"> = {
    explanation_status: "FAIL",
    fail_closed: true,
    explanations: Object.freeze([]),
    reports: Object.freeze([]),
    validations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    failures: Object.freeze([...new Set(failures)]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function generateTradeoffExplanations(input: TradeoffExplanationGeneratorInput = {}): TradeoffExplanationGeneratorResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_ACCESS"]);
  const arbitrations = Object.freeze([...(input.arbitrations ?? input.arbitration_result?.arbitrations ?? arbitrateClassifiedConflicts().arbitrations)]);
  if (arbitrations.length === 0) return failResult(["MISSING_ARBITRATION_RECORDS"]);
  const explanations = Object.freeze(arbitrations.map(generateTradeoffExplanation));
  const reports = Object.freeze(explanations.map((explanation) => {
    const arbitration = arbitrations.find((item) => item.arbitration_id === explanation.arbitration_id)!;
    return generateDecisionComparisonReport(arbitration, explanation);
  }));
  const validations = Object.freeze(explanations.map((explanation) => {
    const arbitration = arbitrations.find((item) => item.arbitration_id === explanation.arbitration_id);
    const report = reports.find((item) => item.arbitration_id === explanation.arbitration_id);
    return validateTradeoffExplanation(arbitration, explanation, report);
  }));
  if (validations.some((validation) => validation.validation_state !== "VALID")) return failResult(validations.flatMap((validation) => validation.failures));
  const ledger_records = Object.freeze(explanations.map((explanation) => {
    const arbitration = arbitrations.find((item) => item.arbitration_id === explanation.arbitration_id)!;
    const report = reports.find((item) => item.arbitration_id === explanation.arbitration_id)!;
    return writeTradeoffLedger(arbitration, explanation, report);
  }));
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) return failResult(["TRADEOFF_LEDGER_FAILED"]);
  const base: Omit<TradeoffExplanationGeneratorResult, "integrity_hash" | "replay_hash"> = {
    explanation_status: "PASS",
    fail_closed: false,
    explanations,
    reports,
    validations,
    ledger_records,
    failures: Object.freeze([]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_CORRUPTION"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayTradeoffExplanations(result: TradeoffExplanationGeneratorResult): TradeoffExplanationReplay {
  const reconstructed = replayHash(result);
  const ledgerValid = result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const replay_valid = result.replay_hash === reconstructed && ledgerValid;
  const failures: TradeoffExplanationFailureReason[] = replay_valid ? [] : ["REPLAY_CORRUPTION"];
  const base: Omit<TradeoffExplanationReplay, "integrity_hash"> = {
    replay_id: "replay_tradeoff_explanation_generator",
    replay_valid,
    explanation_refs: Object.freeze(result.explanations.map((explanation) => explanation.explanation_id)),
    report_refs: Object.freeze(result.reports.map((report) => report.report_id)),
    ledger_refs: Object.freeze(result.ledger_records.map((record) => record.ledger_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildTradeoffExplanationObservability(result: TradeoffExplanationGeneratorResult): TradeoffExplanationObservability {
  return Object.freeze({
    explanations_generated: result.explanations.length,
    reports_generated: result.reports.length,
    evidence_comparisons_completed: result.explanations.filter((explanation) => explanation.supporting_evidence_refs.length > 0 && explanation.rejected_evidence_refs.length > 0).length,
    governance_explanations_generated: result.explanations.filter((explanation) => explanation.governance_reasoning.length > 0).length,
    constitutional_explanations_generated: result.explanations.filter((explanation) => explanation.constitutional_reasoning.length > 0).length,
    risk_comparisons: result.explanations.filter((explanation) => explanation.risk_comparison.length > 0).length,
    confidence_comparisons: result.explanations.filter((explanation) => explanation.confidence_comparison.length > 0).length,
    forecast_analyses: result.explanations.filter((explanation) => explanation.forecast_comparison.length > 0).length,
    recovery_analyses: result.explanations.filter((explanation) => explanation.recovery_implications.length > 0).length,
    replay_success_rate: replayTradeoffExplanations(result).replay_valid ? 1 : 0,
    validation_failures: result.validations.filter((validation) => validation.validation_state !== "VALID").length,
    integrity_failures: result.validations.filter((validation) => !validation.checks.integrity_valid).length,
  });
}

export function getTradeoffExplanationGeneratorFoundation(): TradeoffExplanationGeneratorFoundation {
  const result = generateTradeoffExplanations();
  const replay = replayTradeoffExplanations(result);
  return Object.freeze({
    generator_version: GENERATOR_VERSION,
    required_sections: REQUIRED_TRADEOFF_SECTIONS,
    result,
    replay,
    observability: buildTradeoffExplanationObservability(result),
  });
}

export const TradeoffExplanationGenerator = Object.freeze({
  generateOne: generateTradeoffExplanation,
  generate: generateTradeoffExplanations,
  report: generateDecisionComparisonReport,
  validate: validateTradeoffExplanation,
  replay: replayTradeoffExplanations,
});
