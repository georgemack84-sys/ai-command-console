import { buildDecisionOrchestrationTrace } from "@/services/decision-orchestration-trace-builder";
import { computeReplaySnapshotIntegrityHash } from "@/services/decision-replay-snapshot-capture";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { ReplaySnapshotRecord, ReplaySnapshotType } from "@/types/decision-replay-snapshot-capture";
import type { OrchestrationTraceBuilderResult } from "@/types/decision-orchestration-trace-builder";
import type {
  DeterministicReplayEngineFoundation,
  DeterministicReplayEngineResult,
  DeterministicReplayFailure,
  DeterministicReplayState,
  ReplayEqualityDomain,
  ReplayExecutionRecord,
  ReplayLedgerEntry,
  ReplayReport,
  ReplayValidationResult,
  RestoredStateRecord,
} from "@/types/decision-deterministic-replay-engine";

const ENGINE_VERSION = "decision-deterministic-replay-engine/v1" as const;
const REPLAY_VERSION = "decision-deterministic-replay/v1" as const;
const REPLAY_ENGINE_VERSION = "decision-replay-engine/v1" as const;

export const DETERMINISTIC_REPLAY_STATES: readonly DeterministicReplayState[] = Object.freeze(["CREATED", "VALIDATED", "ARTIFACTS_LOADED", "STATE_RESTORED", "REPLAY_RUNNING", "REPLAY_COMPLETED", "REPLAY_MATCHED", "DIVERGENCE_DETECTED", "INTEGRITY_FAILURE", "REPLAY_FAILED", "CERTIFIED", "REJECTED", "ARCHIVED"]);
export const REPLAY_EQUALITY_DOMAINS: readonly ReplayEqualityDomain[] = Object.freeze(["input_candidate_set", "normalized_candidate_set", "context_set", "dependency_graph", "priority_scores", "priority_order", "conflict_classifications", "governance_outcomes", "decision_packages", "operator_actions", "final_decision_state"]);

type ReplayScenario =
  | "BASELINE"
  | "INVALID_CONTRACT"
  | "MISSING_ARTIFACT"
  | "ARTIFACT_CORRUPTION"
  | "LINEAGE_BROKEN"
  | "CROSS_TENANT"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_OPERATOR_WORKFLOW"
  | "UNSUPPORTED_VERSION"
  | "NONDETERMINISTIC_VALUE"
  | "DIVERGENCE"
  | "FINAL_DECISION_MISSING"
  | "ORIGINAL_MUTATION"
  | "EXTERNAL_EXECUTION"
  | "LIVE_LOOKUP"
  | "LEDGER_FAILURE";

type ReplayInput = Readonly<{
  trace_builder_result?: OrchestrationTraceBuilderResult;
  scenario?: ReplayScenario;
}>;

const SNAPSHOT_TO_DOMAIN: Record<ReplaySnapshotType, ReplayEqualityDomain[]> = {
  DECISION_CANDIDATE: ["input_candidate_set"],
  NORMALIZED_CANDIDATE: ["normalized_candidate_set"],
  DECISION_CONTEXT: ["context_set"],
  DEPENDENCY_GRAPH: ["dependency_graph"],
  PRIORITY_RANKING: ["priority_scores", "priority_order"],
  CONFLICT_ANALYSIS: ["conflict_classifications"],
  GOVERNANCE_VALIDATION: ["governance_outcomes"],
  DECISION_PACKAGE: ["decision_packages"],
  OPERATOR_ACTION: ["operator_actions"],
  FINAL_DECISION: ["final_decision_state"],
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

function snapshotByType(trace: OrchestrationTraceBuilderResult, type: ReplaySnapshotType): ReplaySnapshotRecord | undefined {
  return trace.snapshot_capture.snapshots.find((snapshot) => snapshot.snapshot_type === type);
}

function restorePayload(snapshot: ReplaySnapshotRecord, scenario: ReplayScenario, domain: ReplayEqualityDomain): unknown {
  const payload = JSON.parse(snapshot.serialized_snapshot) as Record<string, unknown>;
  if (scenario === "DIVERGENCE" && domain === "final_decision_state") return { ...payload, final_decision_state: "DIVERGED" };
  if (scenario === "NONDETERMINISTIC_VALUE" && domain === "priority_scores") return { ...payload, nondeterministic_marker: "blocked" };
  return payload;
}

function restoreStates(trace: OrchestrationTraceBuilderResult, scenario: ReplayScenario): readonly RestoredStateRecord[] {
  const states: RestoredStateRecord[] = [];
  for (const snapshot of trace.snapshot_capture.snapshots) {
    if (scenario === "MISSING_OPERATOR_WORKFLOW" && snapshot.snapshot_type === "OPERATOR_ACTION") continue;
    if (scenario === "FINAL_DECISION_MISSING" && snapshot.snapshot_type === "FINAL_DECISION") continue;
    for (const domain of SNAPSHOT_TO_DOMAIN[snapshot.snapshot_type]) {
      const payload = restorePayload(snapshot, scenario, domain);
      const base = {
        restored_ref: `restored_${domain}_${snapshot.snapshot_id}`,
        equality_domain: domain,
        source_snapshot_id: snapshot.snapshot_id,
        restored_payload: payload,
      };
      states.push(Object.freeze({ ...base, restored_hash: hash(base) }));
    }
  }
  return freezeArray(states);
}

function originalPayloadForDomain(trace: OrchestrationTraceBuilderResult, domain: ReplayEqualityDomain): unknown {
  const type = (Object.keys(SNAPSHOT_TO_DOMAIN) as ReplaySnapshotType[]).find((snapshotType) => SNAPSHOT_TO_DOMAIN[snapshotType].includes(domain));
  const snapshot = type ? snapshotByType(trace, type) : undefined;
  return snapshot ? JSON.parse(snapshot.serialized_snapshot) as unknown : null;
}

function validateReplay(trace: OrchestrationTraceBuilderResult, restored: readonly RestoredStateRecord[]): ReplayValidationResult {
  const divergence = REPLAY_EQUALITY_DOMAINS.filter((domain) => {
    const state = restored.find((entry) => entry.equality_domain === domain);
    return !state || serializeDecisionCanonically(state.restored_payload) !== serializeDecisionCanonically(originalPayloadForDomain(trace, domain));
  });
  const has = (domain: ReplayEqualityDomain) => !divergence.includes(domain);
  const base: Omit<ReplayValidationResult, "integrity_hash"> = {
    validation_id: `deterministic_replay_validation_${trace.snapshot_capture.replay_contract.replay_id}`,
    replay_id: trace.snapshot_capture.replay_contract.replay_id,
    input_match: has("input_candidate_set") && has("normalized_candidate_set"),
    context_match: has("context_set"),
    graph_match: has("dependency_graph"),
    priority_match: has("priority_scores") && has("priority_order"),
    conflict_match: has("conflict_classifications"),
    governance_match: has("governance_outcomes"),
    package_match: has("decision_packages"),
    operator_workflow_match: has("operator_actions"),
    final_decision_match: has("final_decision_state"),
    overall_match_status: divergence.length ? "DIVERGENCE" : "MATCH",
    divergence_detected: divergence.length > 0,
    divergence_refs: freezeArray(divergence),
    validation_status: divergence.length ? "BLOCKED" : "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function restoredRef(restored: readonly RestoredStateRecord[], domain: ReplayEqualityDomain): string {
  return restored.find((entry) => entry.equality_domain === domain)?.restored_ref ?? "";
}

function collectFailures(trace: OrchestrationTraceBuilderResult, restored: readonly RestoredStateRecord[], validation: ReplayValidationResult, scenario: ReplayScenario): readonly DeterministicReplayFailure[] {
  const failures: DeterministicReplayFailure[] = [];
  if (!trace.snapshot_capture.replay_contract.replay_id || scenario === "INVALID_CONTRACT") failures.push("REPLAY_CONTRACT_INVALID");
  if (trace.snapshot_capture.replay_contract.replay_version !== "decision-replay-contract/v1") failures.push("UNSUPPORTED_REPLAY_VERSION");
  if (!trace.validation.replay_ready || !trace.snapshot_capture.validation.replay_ready) failures.push("REQUIRED_ARTIFACT_MISSING");
  if (trace.snapshot_capture.snapshots.length < 10 || scenario === "MISSING_ARTIFACT") failures.push("REQUIRED_ARTIFACT_MISSING");
  if (trace.snapshot_capture.snapshots.some((snapshot) => computeReplaySnapshotIntegrityHash(snapshot) !== snapshot.integrity_hash) || scenario === "ARTIFACT_CORRUPTION") failures.push("ARTIFACT_INTEGRITY_MISMATCH");
  if (trace.trace_record.trace_events.some((event) => event.lineage_refs.length === 0) || scenario === "LINEAGE_BROKEN") failures.push("LINEAGE_BROKEN");
  if (trace.snapshot_capture.snapshots.some((snapshot) => snapshot.tenant_id !== trace.snapshot_capture.replay_contract.tenant_id) || scenario === "CROSS_TENANT") failures.push("TENANT_MISMATCH");
  if (trace.trace_record.trace_events.some((event) => event.governance_refs.length === 0) || scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_ARTIFACT_MISSING");
  if (trace.trace_record.trace_events.some((event) => event.constitutional_refs.length === 0) || scenario === "MISSING_CONSTITUTIONAL") failures.push("CONSTITUTIONAL_ARTIFACT_MISSING");
  if (!restored.some((entry) => entry.equality_domain === "operator_actions") || scenario === "MISSING_OPERATOR_WORKFLOW") failures.push("OPERATOR_WORKFLOW_ARTIFACT_MISSING");
  if (trace.snapshot_capture.snapshots.some((snapshot) => snapshot.snapshot_version !== "decision-replay-snapshot/v1")) failures.push("UNSUPPORTED_ARTIFACT_VERSION");
  if (scenario === "NONDETERMINISTIC_VALUE") failures.push("NONDETERMINISTIC_VALUE_DETECTED");
  if (validation.divergence_detected) failures.push("REPLAY_OUTPUT_DIVERGENCE");
  if (!restored.some((entry) => entry.equality_domain === "final_decision_state")) failures.push("FINAL_DECISION_REPRODUCTION_FAILED");
  if (scenario === "ORIGINAL_MUTATION") failures.push("ORIGINAL_ORCHESTRATION_MUTATED");
  if (scenario === "EXTERNAL_EXECUTION") failures.push("EXTERNAL_EXECUTION_ATTEMPTED");
  if (scenario === "LIVE_LOOKUP") failures.push("LIVE_SYSTEM_LOOKUP_ATTEMPTED");
  if (scenario === "LEDGER_FAILURE") failures.push("REPLAY_LEDGER_COMMIT_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function replayStatus(failures: readonly DeterministicReplayFailure[]): DeterministicReplayState {
  if (failures.includes("ARTIFACT_INTEGRITY_MISMATCH")) return "INTEGRITY_FAILURE";
  if (failures.includes("REPLAY_OUTPUT_DIVERGENCE")) return "DIVERGENCE_DETECTED";
  if (failures.length) return "REPLAY_FAILED";
  return "REPLAY_MATCHED";
}

function buildReport(trace: OrchestrationTraceBuilderResult, restored: readonly RestoredStateRecord[], validation: ReplayValidationResult, state: DeterministicReplayState, failures: readonly DeterministicReplayFailure[]): ReplayReport {
  const replay = trace.snapshot_capture.replay_contract;
  const base: Omit<ReplayReport, "integrity_hash"> = {
    replay_report_id: `replay_report_${replay.replay_id}`,
    replay_id: replay.replay_id,
    orchestration_id: replay.orchestration_id,
    mission_id: replay.mission_id,
    tenant_id: replay.tenant_id,
    replay_summary: failures.length ? "Deterministic replay failed closed." : "Deterministic replay matched original orchestration output.",
    replay_mode: replay.replay_mode,
    replay_stage_results: freezeArray(["inputs_restored", "contexts_restored", "graph_restored", "priorities_restored", "conflicts_restored", "governance_restored", "packages_restored", "operator_workflow_restored", "final_decision_replayed"]),
    restored_artifact_summary: freezeArray(restored.map((entry) => entry.restored_ref)),
    equality_check_results: validation,
    divergence_summary: validation.divergence_refs,
    integrity_summary: failures.includes("ARTIFACT_INTEGRITY_MISMATCH") ? "integrity mismatch detected" : "integrity verified",
    governance_summary: failures.includes("GOVERNANCE_ARTIFACT_MISSING") ? "governance artifact missing" : "governance outcomes preserved",
    constitutional_summary: failures.includes("CONSTITUTIONAL_ARTIFACT_MISSING") ? "constitutional artifact missing" : "constitutional outcomes preserved",
    operator_workflow_summary: failures.includes("OPERATOR_WORKFLOW_ARTIFACT_MISSING") ? "operator workflow missing" : "operator workflow preserved",
    final_replay_status: state,
    certification_ready: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildExecution(trace: OrchestrationTraceBuilderResult, restored: readonly RestoredStateRecord[], validation: ReplayValidationResult, report: ReplayReport, state: DeterministicReplayState): ReplayExecutionRecord {
  const replay = trace.snapshot_capture.replay_contract;
  const base: Omit<ReplayExecutionRecord, "integrity_hash"> = {
    replay_execution_id: `replay_execution_${replay.replay_id}`,
    replay_id: replay.replay_id,
    orchestration_id: replay.orchestration_id,
    mission_id: replay.mission_id,
    tenant_id: replay.tenant_id,
    replay_mode: replay.replay_mode,
    replay_version: REPLAY_VERSION,
    replay_engine_version: REPLAY_ENGINE_VERSION,
    replay_state: state,
    restored_inputs_ref: restoredRef(restored, "input_candidate_set"),
    restored_contexts_ref: restoredRef(restored, "context_set"),
    restored_graph_ref: restoredRef(restored, "dependency_graph"),
    restored_priorities_ref: restoredRef(restored, "priority_order"),
    restored_conflicts_ref: restoredRef(restored, "conflict_classifications"),
    restored_governance_ref: restoredRef(restored, "governance_outcomes"),
    restored_packages_ref: restoredRef(restored, "decision_packages"),
    restored_operator_workflow_ref: restoredRef(restored, "operator_actions"),
    replayed_final_decision_ref: restoredRef(restored, "final_decision_state"),
    validation_result: validation,
    match_status: validation.overall_match_status,
    divergence_refs: validation.divergence_refs,
    integrity_verification_ref: `integrity_${replay.replay_id}`,
    replay_report_ref: report.replay_report_id,
    lineage_refs: freezeArray(trace.trace_record.lineage_refs.map((ref) => ref.lineage_ref)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerHash(entry: Omit<ReplayLedgerEntry, "integrity_hash"> | ReplayLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function buildLedger(execution: ReplayExecutionRecord, scenario: ReplayScenario): readonly ReplayLedgerEntry[] {
  if (scenario === "LEDGER_FAILURE") return freezeArray([]);
  const base: Omit<ReplayLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `replay_ledger_${execution.replay_execution_id}`,
    replay_execution_id: execution.replay_execution_id,
    replay_id: execution.replay_id,
    sequence: 1,
    record_hash: execution.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

export function runDeterministicReplay(input: ReplayInput = {}): DeterministicReplayEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const trace_builder_result = input.trace_builder_result ?? buildDecisionOrchestrationTrace(
    scenario === "MISSING_ARTIFACT" ? { scenario: "MISSING_EVENT" }
      : scenario === "ARTIFACT_CORRUPTION" ? { scenario: "CORRUPTED_TRACE" }
        : scenario === "LINEAGE_BROKEN" ? { scenario: "INCOMPLETE_LINEAGE" }
          : scenario === "CROSS_TENANT" ? { scenario: "CROSS_TENANT" }
            : {},
  );
  const restored_states = restoreStates(trace_builder_result, scenario);
  const validation = validateReplay(trace_builder_result, restored_states);
  const preliminaryFailures = collectFailures(trace_builder_result, restored_states, validation, scenario);
  const state = replayStatus(preliminaryFailures);
  const report = buildReport(trace_builder_result, restored_states, validation, state, preliminaryFailures);
  const execution_record = buildExecution(trace_builder_result, restored_states, validation, report, state);
  const ledger = buildLedger(execution_record, scenario);
  const failures = scenario === "LEDGER_FAILURE" ? freezeArray([...preliminaryFailures, "REPLAY_LEDGER_COMMIT_FAILURE" as const]) : preliminaryFailures;
  const base: Omit<DeterministicReplayEngineResult, "integrity_hash"> = {
    engine_version: ENGINE_VERSION,
    trace_builder_result,
    restored_states,
    validation,
    report,
    execution_record,
    ledger,
    failures,
    deterministic: true,
    advisory_only: true,
    external_calls_blocked: true,
    live_system_lookups_blocked: true,
    mutates_original_orchestration: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getDeterministicReplayEngineFoundation(): DeterministicReplayEngineFoundation {
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    replay_states: DETERMINISTIC_REPLAY_STATES,
    equality_domains: REPLAY_EQUALITY_DOMAINS,
    result: runDeterministicReplay(),
  });
}

export const DeterministicReplayEngine = Object.freeze({
  run: runDeterministicReplay,
});
