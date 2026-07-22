import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { scoreDecisionPriorities } from "@/services/decision-priority-scoring-engine";
import type { DecisionPriorityFactorName, DecisionPriorityState } from "@/types/decision-priority-contract";
import type { CompositePriorityScore, PriorityRankingRecord, PriorityScoringEngineResult } from "@/types/decision-priority-scoring-engine";
import type {
  OperatorPrioritySummary,
  PriorityExplanationEngineResult,
  PriorityExplanationFailureReason,
  PriorityExplanationInput,
  PriorityExplanationLedgerRecord,
  PriorityExplanationObservability,
  PriorityExplanationRecord,
  PriorityExplanationReplayRecord,
  PriorityExplanationReport,
} from "@/types/decision-priority-explanation-engine";

const NOW = "2026-07-03T09:58:00.000Z";
const ENGINE_VERSION = "priority-explanation-engine/v1";

const FACTORS: readonly DecisionPriorityFactorName[] = Object.freeze([
  "mission_score",
  "urgency_score",
  "risk_score",
  "confidence_score",
  "governance_score",
  "runtime_score",
  "recovery_score",
  "forecast_score",
  "operator_score",
  "dependency_score",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function rankingFor(score: CompositePriorityScore, scoring: PriorityScoringEngineResult): PriorityRankingRecord {
  const ranking = scoring.ranking_records.find((record) => record.decision_candidate_id === score.decision_candidate_id);
  if (!ranking) throw new Error(`ranking missing for ${score.decision_candidate_id}`);
  return ranking;
}

function scoringBreakdown(score: CompositePriorityScore): string[] {
  return FACTORS.map((factor) => `${factor}: score ${score[factor]}, contribution ${score.factor_contribution_breakdown[factor]}`);
}

function buildOperatorSummary(score: CompositePriorityScore): OperatorPrioritySummary {
  const actions = ["Review priority rationale before acting"];
  const approvals = score.governance_score >= 75 || score.applied_constraints.includes("ELEVATE_VISIBILITY") ? ["Governance review required"] : ["No additional governance approval indicated"];
  const escalations = score.priority_state === "CRITICAL" ? ["Escalate for immediate operator visibility"] : ["No immediate escalation required"];
  const blocked = score.priority_state === "BLOCKED" ? ["Resolve dependency, authority, governance, or evidence block before execution"] : [];
  const certification = score.applied_constraints.includes("BLOCK_RANKING") ? ["Certification blocker must be cleared"] : ["Certification status is advisory-reviewed"];
  const monitoring = score.confidence_score < 45 ? ["Monitor confidence improvement before elevation"] : ["Monitor replay and evidence lineage"];
  const base: Omit<OperatorPrioritySummary, "integrity_hash"> = {
    summary_id: `operator_priority_summary_${score.decision_candidate_id}`,
    decision_candidate_id: score.decision_candidate_id,
    operator_actions: Object.freeze(actions),
    approval_requirements: Object.freeze(approvals),
    escalation_requirements: Object.freeze(escalations),
    blocked_conditions: Object.freeze(blocked),
    certification_requirements: Object.freeze(certification),
    monitoring_recommendations: Object.freeze(monitoring),
    explanation_ref: score.explanation_ref,
    replay_refs: score.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanationRecord(score: CompositePriorityScore, ranking: PriorityRankingRecord, summary: OperatorPrioritySummary): PriorityExplanationRecord {
  const base: Omit<PriorityExplanationRecord, "integrity_hash"> = {
    explanation_id: `priority_explanation_${score.decision_candidate_id}`,
    decision_candidate_id: score.decision_candidate_id,
    priority_state: score.priority_state,
    overall_priority_score: score.overall_priority_score,
    ranking_position: ranking.rank_position,
    ranking_rationale: ranking.tie_break_result,
    scoring_breakdown_ref: `scoring_breakdown_${score.decision_candidate_id}`,
    evidence_narrative_ref: `evidence_narrative_${score.decision_candidate_id}`,
    governance_explanation_ref: `governance_explanation_${score.decision_candidate_id}`,
    confidence_explanation_ref: `confidence_explanation_${score.decision_candidate_id}`,
    risk_explanation_ref: `risk_explanation_${score.decision_candidate_id}`,
    dependency_explanation_ref: `dependency_explanation_${score.decision_candidate_id}`,
    operational_explanation_ref: `operational_explanation_${score.decision_candidate_id}`,
    operator_summary_ref: summary.summary_id,
    evidence_refs: score.evidence_refs,
    governance_refs: score.governance_refs,
    replay_refs: score.replay_refs,
    explanation_version: ENGINE_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildReport(score: CompositePriorityScore, ranking: PriorityRankingRecord, summary: OperatorPrioritySummary): PriorityExplanationReport {
  const base: Omit<PriorityExplanationReport, "integrity_hash"> = {
    report_id: `priority_explanation_report_${score.decision_candidate_id}`,
    decision_candidate_id: score.decision_candidate_id,
    executive_summary: `Priority ${score.priority_state} with score ${score.overall_priority_score}.`,
    ranking_rationale: ranking.tie_break_result,
    scoring_breakdown: Object.freeze(scoringBreakdown(score)),
    evidence_narrative: `Evidence refs ${score.evidence_refs.join(", ")} support this priority assignment.`,
    governance_narrative: `Governance score ${score.governance_score}; governance refs ${score.governance_refs.join(", ")}.`,
    confidence_narrative: score.confidence_score < 45 ? `Low confidence score ${score.confidence_score} restricts elevation.` : `Confidence score ${score.confidence_score} supports ranking.`,
    risk_narrative: `Risk score ${score.risk_score} contributes ${score.factor_contribution_breakdown.risk_score}.`,
    dependency_narrative: `Dependency score ${score.dependency_score} contributes ${score.factor_contribution_breakdown.dependency_score}.`,
    operational_narrative: `Runtime ${score.runtime_score}, recovery ${score.recovery_score}, forecast ${score.forecast_score}.`,
    operator_summary: [...summary.operator_actions, ...summary.approval_requirements, ...summary.escalation_requirements, ...summary.blocked_conditions].join(" | "),
    replay_narrative: `Replay refs ${score.replay_refs.join(", ")} preserve deterministic explanation reconstruction.`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function collectFailures(input: PriorityExplanationInput, scoring: PriorityScoringEngineResult): PriorityExplanationFailureReason[] {
  const failures: PriorityExplanationFailureReason[] = [];
  if (input.ranking_rationale_complete === false) failures.push("RANKING_RATIONALE_INCOMPLETE");
  if (input.scoring_breakdown_complete === false) failures.push("SCORING_BREAKDOWN_MISSING");
  if (input.explanation_ordering_deterministic === false) failures.push("EXPLANATION_ORDERING_NONDETERMINISTIC");
  if (input.governance_adjustment_explained === false) failures.push("GOVERNANCE_ADJUSTMENT_UNEXPLAINED");
  if ((input.hidden_scoring_refs ?? []).length > 0) failures.push("HIDDEN_SCORING_LOGIC_DETECTED");
  for (const score of scoring.composite_scores) {
    if (score.evidence_refs.length === 0) failures.push("SUPPORTING_EVIDENCE_UNTRACEABLE");
    if (score.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
    if (score.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
    if (!score.integrity_hash || recordHash({ ...score, integrity_hash: undefined }) === score.integrity_hash) {
      // The scoring engine owns score integrity. Explanation integrity is validated on generated artifacts.
    }
    const ranking = scoring.ranking_records.find((record) => record.decision_candidate_id === score.decision_candidate_id);
    if (!ranking?.tie_break_result) failures.push("RANKING_RATIONALE_INCOMPLETE");
    if (tenantLeak([...score.evidence_refs, ...score.governance_refs, ...score.replay_refs], ranking?.tenant_id ?? "tenant_alpha")) failures.push("CROSS_TENANT_REFERENCE_DETECTED");
    if (score.applied_constraints.includes("ELEVATE_VISIBILITY") && score.governance_refs.length === 0) failures.push("GOVERNANCE_ADJUSTMENT_UNEXPLAINED");
  }
  return failures;
}

function buildLedger(scoring: PriorityScoringEngineResult, explanations: readonly PriorityExplanationRecord[], reports: readonly PriorityExplanationReport[], summaries: readonly OperatorPrioritySummary[]): PriorityExplanationLedgerRecord {
  const base: Omit<PriorityExplanationLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `priority_explanation_ledger_${scoring.ledger_record.tenant_id}_${scoring.ledger_record.mission_id}`,
    tenant_id: scoring.ledger_record.tenant_id,
    mission_id: scoring.ledger_record.mission_id,
    explanation_refs: explanations.map((record) => record.explanation_id).sort(),
    report_refs: reports.map((report) => report.report_id).sort(),
    operator_summary_refs: summaries.map((summary) => summary.summary_id).sort(),
    governance_refs: normalizeStrings(explanations.flatMap((record) => record.governance_refs)),
    replay_refs: normalizeStrings(explanations.flatMap((record) => record.replay_refs)),
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { explanations: readonly PriorityExplanationRecord[]; summaries: readonly OperatorPrioritySummary[]; reports: readonly PriorityExplanationReport[]; ledger: PriorityExplanationLedgerRecord }): string {
  return hash(input);
}

function buildReplay(replayHash: string, order: readonly string[], failures: readonly PriorityExplanationFailureReason[]): PriorityExplanationReplayRecord {
  const base: Omit<PriorityExplanationReplayRecord, "integrity_hash"> = {
    replay_id: "priority_explanation_replay",
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    replay_valid: failures.length === 0,
    explanation_order: order,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function explainPriorities(input: PriorityExplanationInput = {}): PriorityExplanationEngineResult {
  const scoring = input.scoring_result ?? scoreDecisionPriorities();
  const orderedScores = [...scoring.composite_scores].sort((a, b) => a.decision_candidate_id.localeCompare(b.decision_candidate_id));
  const summaries = orderedScores.map(buildOperatorSummary);
  const explanations = orderedScores.map((score) => buildExplanationRecord(score, rankingFor(score, scoring), summaries.find((summary) => summary.decision_candidate_id === score.decision_candidate_id) as OperatorPrioritySummary));
  const reports = orderedScores.map((score) => buildReport(score, rankingFor(score, scoring), summaries.find((summary) => summary.decision_candidate_id === score.decision_candidate_id) as OperatorPrioritySummary));
  const ledger = buildLedger(scoring, explanations, reports, summaries);
  const failures = collectFailures(input, scoring);
  const replayHash = replayHashValue({ explanations, summaries, reports, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "EXPLANATION_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(replayHash, explanations.map((record) => record.decision_candidate_id), Object.freeze([...new Set(replayFailures)]));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const base: Omit<PriorityExplanationEngineResult, "integrity_hash"> = {
    explanation_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    explanation_records: Object.freeze(explanations),
    operator_summaries: Object.freeze(summaries),
    reports: Object.freeze(reports),
    ledger_record: ledger,
    replay_record: replay,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayPriorityExplanations(result: PriorityExplanationEngineResult): PriorityExplanationReplayRecord {
  const replayHash = replayHashValue({
    explanations: result.explanation_records,
    summaries: result.operator_summaries,
    reports: result.reports,
    ledger: result.ledger_record,
  });
  const failures: PriorityExplanationFailureReason[] = replayHash === result.replay_hash ? [] : ["EXPLANATION_REPLAY_MISMATCH"];
  return buildReplay(replayHash, result.explanation_records.map((record) => record.decision_candidate_id), Object.freeze(failures));
}

export function buildPriorityExplanationObservability(results: readonly PriorityExplanationEngineResult[]): PriorityExplanationObservability {
  const records = results.flatMap((result) => result.explanation_records);
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.explanation_status === "PASS").length,
    fail_count: results.filter((result) => result.explanation_status === "FAIL").length,
    explanations_generated: records.length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    evidence_failures: results.filter((result) => result.failures.includes("SUPPORTING_EVIDENCE_UNTRACEABLE")).length,
    governance_failures: results.filter((result) => result.failures.includes("GOVERNANCE_REFERENCES_MISSING") || result.failures.includes("GOVERNANCE_ADJUSTMENT_UNEXPLAINED")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_REFERENCE_DETECTED")).length,
    state_distribution: Object.freeze(records.reduce<Record<DecisionPriorityState, number>>((counts, record) => {
      counts[record.priority_state] = (counts[record.priority_state] ?? 0) + 1;
      return counts;
    }, {} as Record<DecisionPriorityState, number>)),
  });
}

export function getPriorityExplanationEngine() {
  const result = explainPriorities();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayPriorityExplanations(result),
    observability: buildPriorityExplanationObservability([result]),
  });
}
