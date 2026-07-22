import { runDeterministicReplay } from "@/services/decision-deterministic-replay-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { DeterministicReplayEngineResult, ReplayEqualityDomain } from "@/types/decision-deterministic-replay-engine";
import type {
  DiffLedgerEntry,
  DivergenceDashboardModel,
  DriftReport,
  ReplayDiffResult,
  ReplayDifferenceCategory,
  ReplayDifferenceDetectorFoundation,
  ReplayDifferenceDetectorResult,
  ReplayDifferenceOutcome,
  ReplayDifferenceRecord,
  ReplayDifferenceRootCause,
  ReplayDifferenceSeverity,
} from "@/types/decision-replay-difference-detector";

const DETECTOR_VERSION = "decision-replay-difference-detector/v1" as const;

export const REPLAY_DIFFERENCE_CATEGORIES: readonly ReplayDifferenceCategory[] = Object.freeze(["CANDIDATE_MISMATCH", "CONTEXT_MISMATCH", "PRIORITY_MISMATCH", "CONFLICT_MISMATCH", "GOVERNANCE_MISMATCH", "PACKAGE_MISMATCH", "OPERATOR_MISMATCH", "OUTCOME_MISMATCH", "INTEGRITY_MISMATCH"]);
export const REPLAY_DIFFERENCE_OUTCOMES: readonly ReplayDifferenceOutcome[] = Object.freeze(["IDENTICAL", "MINOR_DIFFERENCE", "GOVERNANCE_DIFFERENCE", "REPLAY_FAILURE", "INTEGRITY_FAILURE"]);
export const REPLAY_DIFFERENCE_SEVERITIES: readonly ReplayDifferenceSeverity[] = Object.freeze(["LOW", "MODERATE", "HIGH", "CRITICAL"]);

type DiffScenario =
  | "BASELINE"
  | "CANDIDATE_MISMATCH"
  | "CONTEXT_MISMATCH"
  | "PRIORITY_MISMATCH"
  | "CONFLICT_MISMATCH"
  | "GOVERNANCE_MISMATCH"
  | "PACKAGE_MISMATCH"
  | "OPERATOR_MISMATCH"
  | "OUTCOME_MISMATCH"
  | "INTEGRITY_MISMATCH"
  | "MINOR_DIFFERENCE"
  | "UNKNOWN_CAUSE"
  | "CROSS_TENANT"
  | "BROKEN_LINEAGE"
  | "UNSUPPORTED_VERSION";

type DiffInput = Readonly<{
  replay_result?: DeterministicReplayEngineResult;
  scenario?: DiffScenario;
}>;

const DOMAIN_CATEGORY: Record<ReplayEqualityDomain, ReplayDifferenceCategory> = {
  input_candidate_set: "CANDIDATE_MISMATCH",
  normalized_candidate_set: "CANDIDATE_MISMATCH",
  context_set: "CONTEXT_MISMATCH",
  dependency_graph: "CONFLICT_MISMATCH",
  priority_scores: "PRIORITY_MISMATCH",
  priority_order: "PRIORITY_MISMATCH",
  conflict_classifications: "CONFLICT_MISMATCH",
  governance_outcomes: "GOVERNANCE_MISMATCH",
  decision_packages: "PACKAGE_MISMATCH",
  operator_actions: "OPERATOR_MISMATCH",
  final_decision_state: "OUTCOME_MISMATCH",
};

const SCENARIO_DOMAIN: Partial<Record<DiffScenario, ReplayEqualityDomain | "integrity">> = {
  CANDIDATE_MISMATCH: "input_candidate_set",
  CONTEXT_MISMATCH: "context_set",
  PRIORITY_MISMATCH: "priority_order",
  CONFLICT_MISMATCH: "conflict_classifications",
  GOVERNANCE_MISMATCH: "governance_outcomes",
  PACKAGE_MISMATCH: "decision_packages",
  OPERATOR_MISMATCH: "operator_actions",
  OUTCOME_MISMATCH: "final_decision_state",
  INTEGRITY_MISMATCH: "integrity",
};

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

function categoryFor(domain: ReplayEqualityDomain | "integrity", scenario: DiffScenario): ReplayDifferenceCategory {
  if (domain === "integrity" || scenario === "INTEGRITY_MISMATCH") return "INTEGRITY_MISMATCH";
  return DOMAIN_CATEGORY[domain];
}

function rootCauseFor(category: ReplayDifferenceCategory, scenario: DiffScenario): ReplayDifferenceRootCause {
  if (scenario === "UNKNOWN_CAUSE") return "UNKNOWN_CAUSE";
  if (scenario === "CROSS_TENANT") return "TENANT_BOUNDARY_VIOLATION";
  if (scenario === "BROKEN_LINEAGE") return "LINEAGE_BREAK";
  if (scenario === "UNSUPPORTED_VERSION") return "UNSUPPORTED_VERSION";
  if (category === "INTEGRITY_MISMATCH") return "HASH_MISMATCH";
  if (category === "CANDIDATE_MISMATCH") return "NORMALIZATION_CHANGE";
  if (category === "CONTEXT_MISMATCH") return "CONTEXT_CHANGE";
  if (category === "PRIORITY_MISMATCH") return "SCORING_CHANGE";
  if (category === "GOVERNANCE_MISMATCH") return "GOVERNANCE_CHANGE";
  if (category === "OPERATOR_MISMATCH") return "OPERATOR_ACTION_CHANGE";
  if (category === "OUTCOME_MISMATCH") return "FINAL_STATE_CHANGE";
  return "ORDERING_CHANGE";
}

function outcomeFor(category: ReplayDifferenceCategory, scenario: DiffScenario): ReplayDifferenceOutcome {
  if (scenario === "MINOR_DIFFERENCE") return "MINOR_DIFFERENCE";
  if (category === "INTEGRITY_MISMATCH") return "INTEGRITY_FAILURE";
  if (category === "GOVERNANCE_MISMATCH") return "GOVERNANCE_DIFFERENCE";
  return "REPLAY_FAILURE";
}

function severityFor(outcome: ReplayDifferenceOutcome, rootCause: ReplayDifferenceRootCause): ReplayDifferenceSeverity {
  if (outcome === "IDENTICAL") return "LOW";
  if (outcome === "MINOR_DIFFERENCE") return "LOW";
  if (outcome === "INTEGRITY_FAILURE" || rootCause === "UNKNOWN_CAUSE" || rootCause === "TENANT_BOUNDARY_VIOLATION") return "CRITICAL";
  if (outcome === "GOVERNANCE_DIFFERENCE" || outcome === "REPLAY_FAILURE") return "HIGH";
  return "MODERATE";
}

function phaseFor(category: ReplayDifferenceCategory): string {
  const map: Record<ReplayDifferenceCategory, string> = {
    CANDIDATE_MISMATCH: "INTAKE",
    CONTEXT_MISMATCH: "CONTEXT_BUILDING",
    PRIORITY_MISMATCH: "PRIORITIZATION",
    CONFLICT_MISMATCH: "ARBITRATION",
    GOVERNANCE_MISMATCH: "GOVERNANCE_VALIDATION",
    PACKAGE_MISMATCH: "PACKAGE_GENERATION",
    OPERATOR_MISMATCH: "OPERATOR_WORKFLOW",
    OUTCOME_MISMATCH: "FINALIZATION",
    INTEGRITY_MISMATCH: "INTEGRITY_VERIFICATION",
  };
  return map[category];
}

function buildDifferenceRecord(replay: DeterministicReplayEngineResult, domain: ReplayEqualityDomain | "integrity", scenario: DiffScenario): ReplayDifferenceRecord {
  const replayContract = replay.trace_builder_result.snapshot_capture.replay_contract;
  const category = categoryFor(domain, scenario);
  const rootCause = rootCauseFor(category, scenario);
  const outcome = outcomeFor(category, scenario);
  const severity = severityFor(outcome, rootCause);
  const base: Omit<ReplayDifferenceRecord, "integrity_hash"> = {
    difference_id: `difference_${category.toLowerCase()}_${replayContract.replay_id}`,
    replay_id: replayContract.replay_id,
    orchestration_id: replayContract.orchestration_id,
    mission_id: replayContract.mission_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : replayContract.tenant_id,
    difference_category: category,
    difference_outcome: outcome,
    severity,
    original_artifact_ref: domain === "integrity" ? replay.execution_record.integrity_verification_ref : `original_${domain}`,
    replayed_artifact_ref: domain === "integrity" ? replay.execution_record.replay_report_ref : `replayed_${domain}`,
    original_value_ref: `original_value_${domain}`,
    replayed_value_ref: `replayed_value_${domain}`,
    affected_domain: domain,
    affected_phase: phaseFor(category),
    affected_field: domain,
    root_cause_classification: rootCause,
    governance_impact: category === "GOVERNANCE_MISMATCH" || rootCause === "GOVERNANCE_CHANGE",
    constitutional_impact: category === "GOVERNANCE_MISMATCH",
    operator_impact: category === "OPERATOR_MISMATCH",
    certification_impact: outcome !== "MINOR_DIFFERENCE",
    explanation: outcome === "MINOR_DIFFERENCE"
      ? "Replay contains an explicitly allowed non-material metadata difference."
      : `Replay difference detected in ${domain}; classified as ${category} with root cause ${rootCause}.`,
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : replay.execution_record.lineage_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function differenceDomains(replay: DeterministicReplayEngineResult, scenario: DiffScenario): readonly (ReplayEqualityDomain | "integrity")[] {
  if (scenario === "BASELINE" && replay.validation.divergence_refs.length === 0 && replay.failures.length === 0) return freezeArray([]);
  if (scenario === "MINOR_DIFFERENCE") return freezeArray(["input_candidate_set"]);
  if (scenario === "UNKNOWN_CAUSE") return freezeArray(["final_decision_state"]);
  if (scenario === "CROSS_TENANT") return freezeArray(["context_set"]);
  if (scenario === "BROKEN_LINEAGE") return freezeArray(["integrity"]);
  if (scenario === "UNSUPPORTED_VERSION") return freezeArray(["integrity"]);
  const explicit = SCENARIO_DOMAIN[scenario];
  if (explicit) return freezeArray([explicit]);
  if (replay.failures.includes("ARTIFACT_INTEGRITY_MISMATCH")) return freezeArray(["integrity"]);
  return freezeArray(replay.validation.divergence_refs);
}

function overallOutcome(records: readonly ReplayDifferenceRecord[]): ReplayDifferenceOutcome {
  if (records.length === 0) return "IDENTICAL";
  if (records.some((record) => record.difference_outcome === "INTEGRITY_FAILURE")) return "INTEGRITY_FAILURE";
  if (records.some((record) => record.difference_outcome === "GOVERNANCE_DIFFERENCE")) return "GOVERNANCE_DIFFERENCE";
  if (records.some((record) => record.difference_outcome === "REPLAY_FAILURE")) return "REPLAY_FAILURE";
  return "MINOR_DIFFERENCE";
}

function buildDriftReport(replay: DeterministicReplayEngineResult, records: readonly ReplayDifferenceRecord[], outcome: ReplayDifferenceOutcome): DriftReport {
  const contract = replay.trace_builder_result.snapshot_capture.replay_contract;
  const base: Omit<DriftReport, "integrity_hash"> = {
    drift_report_id: `drift_report_${contract.replay_id}`,
    replay_id: contract.replay_id,
    orchestration_id: contract.orchestration_id,
    mission_id: contract.mission_id,
    tenant_id: contract.tenant_id,
    replay_match_summary: outcome === "IDENTICAL" ? "Replay is identical to original orchestration." : "Replay divergence detected.",
    difference_summary: `${records.length} difference(s) detected.`,
    affected_domains: freezeArray(records.map((record) => record.affected_domain)),
    severity_summary: freezeArray([...new Set(records.map((record) => record.severity))]),
    root_cause_summary: freezeArray([...new Set(records.map((record) => record.root_cause_classification))]),
    governance_summary: records.some((record) => record.governance_impact) ? "governance impact detected" : "governance preserved",
    constitutional_summary: records.some((record) => record.constitutional_impact) ? "constitutional impact detected" : "constitutional preserved",
    operator_summary: records.some((record) => record.operator_impact) ? "operator workflow impact detected" : "operator workflow preserved",
    integrity_summary: outcome === "INTEGRITY_FAILURE" ? "integrity failure detected" : "integrity verified",
    certification_disposition: outcome === "IDENTICAL" || outcome === "MINOR_DIFFERENCE" ? "CERTIFICATION_READY" : "CERTIFICATION_BLOCKED",
    explanation: records.length === 0 ? "No replay differences were detected." : records.map((record) => record.explanation).join(" "),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboard(replay: DeterministicReplayEngineResult, records: readonly ReplayDifferenceRecord[], outcome: ReplayDifferenceOutcome): DivergenceDashboardModel {
  const contract = replay.trace_builder_result.snapshot_capture.replay_contract;
  const maxSeverity = records.some((record) => record.severity === "CRITICAL") ? "CRITICAL" : records.some((record) => record.severity === "HIGH") ? "HIGH" : records.some((record) => record.severity === "MODERATE") ? "MODERATE" : "LOW";
  const base: Omit<DivergenceDashboardModel, "integrity_hash"> = {
    dashboard_id: `divergence_dashboard_${contract.replay_id}`,
    replay_id: contract.replay_id,
    replay_comparison_status: outcome,
    difference_categories: freezeArray([...new Set(records.map((record) => record.difference_category))]),
    affected_artifacts: freezeArray(records.map((record) => record.replayed_artifact_ref)),
    root_cause_map: freezeArray(records.map((record) => `${record.difference_category}:${record.root_cause_classification}`)),
    severity: maxSeverity,
    governance_impact: records.some((record) => record.governance_impact),
    integrity_status: outcome === "INTEGRITY_FAILURE" ? "FAILED" : "VERIFIED",
    certification_ready: outcome === "IDENTICAL" || outcome === "MINOR_DIFFERENCE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDiffResult(replay: DeterministicReplayEngineResult, records: readonly ReplayDifferenceRecord[], report: DriftReport, dashboard: DivergenceDashboardModel, outcome: ReplayDifferenceOutcome): ReplayDiffResult {
  const contract = replay.trace_builder_result.snapshot_capture.replay_contract;
  const base: Omit<ReplayDiffResult, "integrity_hash"> = {
    replay_diff_id: `replay_diff_${contract.replay_id}`,
    replay_id: contract.replay_id,
    orchestration_id: contract.orchestration_id,
    mission_id: contract.mission_id,
    tenant_id: contract.tenant_id,
    diff_status: dashboard.certification_ready ? "PASS" : "BLOCKED",
    difference_outcome: outcome,
    difference_count: records.length,
    critical_difference_count: records.filter((record) => record.severity === "CRITICAL").length,
    difference_records: records,
    root_cause_summary: freezeArray([...new Set(records.map((record) => record.root_cause_classification))]),
    governance_impact_summary: records.some((record) => record.governance_impact),
    constitutional_impact_summary: records.some((record) => record.constitutional_impact),
    operator_impact_summary: records.some((record) => record.operator_impact),
    certification_impact_summary: records.some((record) => record.certification_impact),
    drift_report_ref: report.drift_report_id,
    dashboard_ref: dashboard.dashboard_id,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerHash(entry: Omit<DiffLedgerEntry, "integrity_hash"> | DiffLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function buildLedger(diffResult: ReplayDiffResult): readonly DiffLedgerEntry[] {
  return freezeArray(diffResult.difference_records.map((record, index) => {
    const base: Omit<DiffLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `diff_ledger_${String(index + 1).padStart(2, "0")}_${record.difference_id}`,
      replay_diff_id: diffResult.replay_diff_id,
      sequence: index + 1,
      difference_record_ref: record.difference_id,
      record_hash: record.integrity_hash,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
  }));
}

export function detectReplayDifferences(input: DiffInput = {}): ReplayDifferenceDetectorResult {
  const scenario = input.scenario ?? "BASELINE";
  const replay_result = input.replay_result ?? runDeterministicReplay(
    scenario === "INTEGRITY_MISMATCH" ? { scenario: "ARTIFACT_CORRUPTION" }
      : scenario === "GOVERNANCE_MISMATCH" ? { scenario: "MISSING_GOVERNANCE" }
        : scenario === "OPERATOR_MISMATCH" ? { scenario: "MISSING_OPERATOR_WORKFLOW" }
          : scenario === "OUTCOME_MISMATCH" ? { scenario: "DIVERGENCE" }
            : scenario === "CROSS_TENANT" ? { scenario: "CROSS_TENANT" }
              : scenario === "BROKEN_LINEAGE" ? { scenario: "LINEAGE_BROKEN" }
                : {},
  );
  const records = freezeArray(differenceDomains(replay_result, scenario).map((domain) => buildDifferenceRecord(replay_result, domain, scenario)));
  const outcome = overallOutcome(records);
  const drift_report = buildDriftReport(replay_result, records, outcome);
  const dashboard = buildDashboard(replay_result, records, outcome);
  const diff_result = buildDiffResult(replay_result, records, drift_report, dashboard, outcome);
  const ledger = buildLedger(diff_result);
  const certification_ready = dashboard.certification_ready && !records.some((record) => record.root_cause_classification === "UNKNOWN_CAUSE");
  const finalDiff = certification_ready === dashboard.certification_ready ? diff_result : Object.freeze({ ...diff_result, diff_status: "BLOCKED" as const, certification_impact_summary: true, integrity_hash: hashWithoutIntegrity({ ...diff_result, diff_status: "BLOCKED" as const, certification_impact_summary: true }) });
  const base: Omit<ReplayDifferenceDetectorResult, "integrity_hash"> = {
    detector_version: DETECTOR_VERSION,
    replay_result,
    diff_result: finalDiff,
    drift_report,
    dashboard: certification_ready === dashboard.certification_ready ? dashboard : Object.freeze({ ...dashboard, certification_ready: false, integrity_hash: hashWithoutIntegrity({ ...dashboard, certification_ready: false }) }),
    ledger,
    deterministic: true,
    advisory_only: true,
    mutates_original_records: false,
    certification_ready,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getReplayDifferenceDetectorFoundation(): ReplayDifferenceDetectorFoundation {
  return Object.freeze({
    detector_version: DETECTOR_VERSION,
    categories: REPLAY_DIFFERENCE_CATEGORIES,
    outcomes: REPLAY_DIFFERENCE_OUTCOMES,
    severities: REPLAY_DIFFERENCE_SEVERITIES,
    result: detectReplayDifferences(),
  });
}

export const ReplayDifferenceDetector = Object.freeze({
  detect: detectReplayDifferences,
});
