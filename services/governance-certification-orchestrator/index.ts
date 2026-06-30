import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceReplayCertification } from "@/services/governance-replay-certification";
import { runGovernanceIntegrityCertification } from "@/services/governance-integrity-certification";
import { runGovernanceQueryCertification } from "@/services/governance-query-certification";
import { runGovernanceVisibilityCertification } from "@/services/governance-visibility-certification";
import type { GovernanceReplayCertificationReport } from "@/types/governance-replay-certification";
import type { GovernanceIntegrityCertificationReport } from "@/types/governance-integrity-certification";
import type { GovernanceQueryCertificationResponse } from "@/types/governance-query-certification";
import type { GovernanceVisibilityCertificationReport } from "@/types/governance-visibility-certification";
import type {
  GovernanceCertificationExecutionMode,
  GovernanceCertificationExecutionState,
  GovernanceCertificationIsolationContext,
  GovernanceCertificationLedgerRecord,
  GovernanceCertificationOrchestrationFailure,
  GovernanceCertificationOrchestratorInput,
  GovernanceCertificationOrchestratorObservabilitySurface,
  GovernanceCertificationOrchestratorReport,
  GovernanceCertificationOrchestratorScenario,
  GovernanceCertificationOverallResult,
  GovernanceCertificationRun,
  GovernanceCertificationScenarioDefinition,
  GovernanceCertificationScenarioResult,
  GovernanceCertificationState,
  GovernanceCertificationTimelineEvent,
} from "@/types/governance-certification-orchestrator";

const NOW = "2026-06-27T17:30:00.000Z";
const END = "2026-06-27T17:30:12.000Z";
const SCHEMA_VERSION = "governance-certification-orchestrator/v7L.1" as const;
const SUITE_VERSION = "governance-intelligence-certification-suite/v7L.1" as const;
const replayCache = new Map<string, GovernanceReplayCertificationReport>();
const integrityCache = new Map<string, GovernanceIntegrityCertificationReport>();
const queryCache = new Map<string, GovernanceQueryCertificationResponse>();
const visibilityCache = new Map<string, GovernanceVisibilityCertificationReport>();

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function scenarioMode(scenario: GovernanceCertificationOrchestratorScenario | undefined, mode?: GovernanceCertificationExecutionMode): GovernanceCertificationExecutionMode {
  if (mode) return mode;
  if (scenario === "SCHEDULED_BASELINE") return "SCHEDULED_CERTIFICATION";
  if (scenario === "PRE_RELEASE_BASELINE") return "PRE_RELEASE_CERTIFICATION";
  if (scenario === "REGRESSION_BASELINE") return "REGRESSION_CERTIFICATION";
  if (scenario === "INCREMENTAL_BASELINE") return "INCREMENTAL_CERTIFICATION";
  if (scenario === "REPLAY_BASELINE") return "REPLAY_CERTIFICATION";
  return "FULL_SYSTEM_CERTIFICATION";
}

function scenarioFailure(scenario: GovernanceCertificationOrchestratorScenario): GovernanceCertificationOrchestrationFailure | null {
  const map: Partial<Record<GovernanceCertificationOrchestratorScenario, GovernanceCertificationOrchestrationFailure>> = {
    REQUEST_INVALID: "REQUEST_VALIDATION_FAILED",
    EXECUTION_ORDER_CHANGED: "EXECUTION_ORDER_CHANGED",
    ISOLATION_BROKEN: "ISOLATION_VIOLATION",
    REPLAY_FAILED: "REPLAY_VALIDATION_FAILED",
    INTEGRITY_FAILED: "INTEGRITY_VALIDATION_FAILED",
    AGGREGATION_NONDETERMINISTIC: "AGGREGATION_NONDETERMINISTIC",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    AUTHORITY_BOUNDARY_EXCEEDED: "AUTHORITY_BOUNDARY_EXCEEDED",
    MINOR_VISIBILITY_WARNING: "MINOR_VISIBILITY_WARNING",
  };
  return map[scenario] ?? null;
}

function executionStateForFailure(failure: GovernanceCertificationOrchestrationFailure | null): GovernanceCertificationExecutionState {
  if (!failure || failure === "MINOR_VISIBILITY_WARNING") return "CERTIFIED";
  if (failure === "REQUEST_VALIDATION_FAILED") return "VALIDATION_FAILED";
  if (failure === "ISOLATION_VIOLATION" || failure === "TENANT_ISOLATION_VIOLATION") return "ISOLATION_FAILED";
  if (failure === "REPLAY_VALIDATION_FAILED") return "REPLAY_FAILED";
  if (failure === "INTEGRITY_VALIDATION_FAILED") return "INTEGRITY_FAILED";
  if (failure === "AGGREGATION_NONDETERMINISTIC") return "AGGREGATION_FAILED";
  return "EXECUTION_FAILED";
}

function schedule(scenario: GovernanceCertificationOrchestratorScenario): readonly GovernanceCertificationScenarioDefinition[] {
  const definitions: Omit<GovernanceCertificationScenarioDefinition, "scenario_hash">[] = [
    {
      scenario_id: "cert-scenario:7h5:replay",
      scenario_name: "REPLAY_CERTIFICATION",
      phase: "7H.5",
      component: "governance-replay-certification",
      execution_order: scenario === "EXECUTION_ORDER_CHANGED" ? 2 : 1,
      priority: "CRITICAL",
      required: true,
      timeout_ms: 30000,
      expected_result: "PASS",
      dependencies: freezeArray([]),
      replay_enabled: true,
    },
    {
      scenario_id: "cert-scenario:7i5:integrity",
      scenario_name: "INTEGRITY_CERTIFICATION",
      phase: "7I.5",
      component: "governance-integrity-certification",
      execution_order: scenario === "EXECUTION_ORDER_CHANGED" ? 1 : 2,
      priority: "CRITICAL",
      required: true,
      timeout_ms: 30000,
      expected_result: "PASS",
      dependencies: freezeArray(["cert-scenario:7h5:replay"]),
      replay_enabled: true,
    },
    {
      scenario_id: "cert-scenario:7j5:query",
      scenario_name: "QUERY_CERTIFICATION",
      phase: "7J.5",
      component: "governance-query-certification",
      execution_order: 3,
      priority: "HIGH",
      required: true,
      timeout_ms: 30000,
      expected_result: "PASS",
      dependencies: freezeArray(["cert-scenario:7i5:integrity"]),
      replay_enabled: true,
    },
    {
      scenario_id: "cert-scenario:7k5:visibility",
      scenario_name: "VISIBILITY_CERTIFICATION",
      phase: "7K.5",
      component: "governance-visibility-certification",
      execution_order: 4,
      priority: "HIGH",
      required: true,
      timeout_ms: 30000,
      expected_result: "PASS",
      dependencies: freezeArray(["cert-scenario:7j5:query"]),
      replay_enabled: true,
    },
  ];
  return freezeArray(definitions
    .map((definition) => Object.freeze({ ...definition, scenario_hash: hashValue("governance-certification-scenario-definition", definition) }))
    .sort((a, b) => a.execution_order - b.execution_order || a.scenario_id.localeCompare(b.scenario_id)));
}

function isolation(tenant_id: string, mission_id: string, failure: GovernanceCertificationOrchestrationFailure | null): GovernanceCertificationIsolationContext {
  const isolatedTenantContext = failure !== "ISOLATION_VIOLATION" && failure !== "TENANT_ISOLATION_VIOLATION";
  const source = {
    isolation_id: `GCI-7L1-${hashValue("governance-certification-isolation-id", { tenant_id, mission_id }).slice(0, 10).toUpperCase()}`,
    isolated_runtime: true as const,
    isolated_datasets: true as const,
    isolated_replay_state: true as const,
    isolated_governance_state: true as const,
    isolated_evidence_cache: true as const,
    isolated_logging: true as const,
    isolated_tenant_context: isolatedTenantContext,
    tenant_id,
    mission_id,
  };
  return Object.freeze({ ...source, isolation_hash: hashValue("governance-certification-isolation", source) }) as GovernanceCertificationIsolationContext;
}

function cachedReplay(tenant_id: string, mission_id: string, initiated_by: string): GovernanceReplayCertificationReport {
  const key = `${tenant_id}:${mission_id}:${initiated_by}`;
  const cached = replayCache.get(key);
  if (cached) return cached;
  const report = runGovernanceReplayCertification({ tenant_id, mission_id, replay_requestor: initiated_by });
  replayCache.set(key, report);
  return report;
}

function cachedIntegrity(tenant_id: string, mission_id: string, initiated_by: string): GovernanceIntegrityCertificationReport {
  const key = `${tenant_id}:${mission_id}:${initiated_by}`;
  const cached = integrityCache.get(key);
  if (cached) return cached;
  const report = runGovernanceIntegrityCertification({ tenant_id, mission_id, created_by: initiated_by });
  integrityCache.set(key, report);
  return report;
}

function cachedQuery(): GovernanceQueryCertificationResponse {
  const key = "baseline";
  const cached = queryCache.get(key);
  if (cached) return cached;
  const report = runGovernanceQueryCertification();
  queryCache.set(key, report);
  return report;
}

function cachedVisibility(tenant_id: string, mission_id: string, initiated_by: string): GovernanceVisibilityCertificationReport {
  const key = `${tenant_id}:${mission_id}:${initiated_by}`;
  const cached = visibilityCache.get(key);
  if (cached) return cached;
  const report = runGovernanceVisibilityCertification({ tenant_id, mission_id, operator_id: initiated_by });
  visibilityCache.set(key, report);
  return report;
}

function confidenceFor(result: Exclude<GovernanceCertificationState, "SKIPPED">): number {
  if (result === "PASS") return 0.99;
  if (result === "CONDITIONAL_PASS") return 0.74;
  return 0.08;
}

function resultForDefinition(
  definition: GovernanceCertificationScenarioDefinition,
  scenario: GovernanceCertificationOrchestratorScenario,
  tenant_id: string,
  mission_id: string,
  initiated_by: string,
): GovernanceCertificationScenarioResult {
  const failure = scenarioFailure(scenario);
  const forcedFailure =
    failure === "REPLAY_VALIDATION_FAILED" && definition.scenario_name === "REPLAY_CERTIFICATION" ? failure :
      failure === "INTEGRITY_VALIDATION_FAILED" && definition.scenario_name === "INTEGRITY_CERTIFICATION" ? failure :
        failure === "AGGREGATION_NONDETERMINISTIC" && definition.scenario_name === "VISIBILITY_CERTIFICATION" ? failure :
          failure && !["MINOR_VISIBILITY_WARNING", "REPLAY_VALIDATION_FAILED", "INTEGRITY_VALIDATION_FAILED", "AGGREGATION_NONDETERMINISTIC"].includes(failure) ? failure : null;
  const warning = failure === "MINOR_VISIBILITY_WARNING" && definition.scenario_name === "VISIBILITY_CERTIFICATION" ? failure : null;
  const report = (() => {
    if (definition.scenario_name === "REPLAY_CERTIFICATION") {
      const replay = cachedReplay(tenant_id, mission_id, initiated_by);
      return {
        state: replay.certification_state,
        evidence: replay.certification_evidence.evidence_hash,
        replay: replay.output_verification_report.replay_state_package.replay_input_package.replay_contract.governance_replay_id,
        integrity: replay.report_hash,
        lineage: replay.certification_evidence.truth_ledger_references[0] ?? replay.truth_ledger_record_reference,
      };
    }
    if (definition.scenario_name === "INTEGRITY_CERTIFICATION") {
      const integrity = cachedIntegrity(tenant_id, mission_id, initiated_by);
      return {
        state: integrity.certification_state,
        evidence: integrity.certification_evidence.evidence_hash,
        replay: integrity.certification_evidence.replay_references[0] ?? integrity.verification_report.source_chain.replay_chain.replay_id,
        integrity: integrity.report_hash,
        lineage: integrity.certification_evidence.lineage_references[0] ?? integrity.truth_ledger_certification_reference,
      };
    }
    if (definition.scenario_name === "QUERY_CERTIFICATION") {
      const query = cachedQuery();
      return {
        state: query.status,
        evidence: query.report.certification_hash,
        replay: query.historical_response?.replay_validation?.replay_id ?? "replay:7j5:query-certification",
        integrity: query.report.certification_hash,
        lineage: query.correlation_response?.correlations[0]?.lineage_reference ?? query.report.truth_ledger_record.truth_record_id,
      };
    }
    const visibility = cachedVisibility(tenant_id, mission_id, initiated_by);
    return {
      state: visibility.certification_state,
      evidence: visibility.evidence_package.evidence_hash,
      replay: visibility.evidence_package.replay_viewer_hash,
      integrity: visibility.report_hash,
      lineage: visibility.evidence_package.lineage_explorer_hash,
    };
  })();
  const result: Exclude<GovernanceCertificationState, "SKIPPED"> = forcedFailure ? "FAIL" : warning ? "CONDITIONAL_PASS" : report.state;
  const source = {
    scenario_result_id: `GCSR-7L1-${hashValue("governance-certification-scenario-result-id", { scenario: definition.scenario_id, run: scenario }).slice(0, 10).toUpperCase()}`,
    scenario_id: definition.scenario_id,
    execution_timestamp: `2026-06-27T17:30:0${definition.execution_order}.000Z`,
    execution_duration_ms: 250 + definition.execution_order * 25,
    result,
    confidence: confidenceFor(result),
    evidence_reference: report.evidence,
    replay_reference: report.replay,
    integrity_hash: report.integrity,
    failure_reason: forcedFailure,
    warnings: freezeArray(warning ? [warning] : []),
  };
  return Object.freeze({ ...source, result_hash: hashValue("governance-certification-scenario-result", source) });
}

function aggregate(runId: string, results: readonly GovernanceCertificationScenarioResult[], failure: GovernanceCertificationOrchestrationFailure | null): GovernanceCertificationOverallResult {
  const pass_count = results.filter((result) => result.result === "PASS").length;
  const conditional_pass_count = results.filter((result) => result.result === "CONDITIONAL_PASS").length;
  const fail_count = results.filter((result) => result.result === "FAIL").length;
  const blocking_failures = unique([
    ...results.map((result) => result.failure_reason).filter((item): item is GovernanceCertificationOrchestrationFailure => Boolean(item)),
    ...(failure && failure !== "MINOR_VISIBILITY_WARNING" ? [failure] : []),
  ]);
  const overall_state: Exclude<GovernanceCertificationState, "SKIPPED"> = fail_count > 0 || blocking_failures.length > 0 ? "FAIL" : conditional_pass_count > 0 ? "CONDITIONAL_PASS" : "PASS";
  const overall_confidence = Number((results.reduce((sum, result) => sum + result.confidence, 0) / results.length).toFixed(4));
  const source = {
    overall_result_id: `GCOR-7L1-${hashValue("governance-certification-overall-id", { runId, results: results.map((result) => result.result_hash) }).slice(0, 10).toUpperCase()}`,
    certification_run_id: runId,
    overall_state,
    pass_count,
    conditional_pass_count,
    fail_count,
    blocking_failures,
    overall_confidence: blocking_failures.length > 0 ? Math.min(overall_confidence, 0.1) : overall_confidence,
    recommendations: freezeArray(overall_state === "PASS" ? ["Publish final certification and archive immutable evidence."] : overall_state === "CONDITIONAL_PASS" ? ["Resolve warnings before production approval."] : ["Block progression and remediate orchestration failures."]),
    approval_status: overall_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : overall_state === "CONDITIONAL_PASS" ? "LIMITED_CERTIFICATION_MODE" as const : "BLOCKED" as const,
  };
  return Object.freeze({ ...source, overall_hash: hashValue("governance-certification-overall-result", source) });
}

function timeline(state: GovernanceCertificationExecutionState): readonly GovernanceCertificationTimelineEvent[] {
  const stages: readonly GovernanceCertificationTimelineEvent["stage"][] = ["REQUEST_INITIALIZATION", "SCENARIO_PREPARATION", "SCENARIO_EXECUTION", "AGGREGATION", "CERTIFICATION_PUBLICATION"];
  return freezeArray(stages.map((stage, index) => {
    const source = {
      event_id: `GCTL-7L1-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T17:30:${String(index * 3).padStart(2, "0")}.000Z`,
      execution_state: index === stages.length - 1 ? state : ["VALIDATING", "PREPARING", "EXECUTING", "AGGREGATING"][index] as GovernanceCertificationExecutionState,
      summary: `${stage.replace(/_/g, " ").toLowerCase()} completed by deterministic certification orchestrator.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-certification-timeline-event", source) });
  }));
}

export function runGovernanceCertificationOrchestrator(input: GovernanceCertificationOrchestratorInput = {}): GovernanceCertificationOrchestratorReport {
  const scenario = input.scenario ?? "BASELINE";
  const failure = scenarioFailure(scenario);
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_lineage";
  const initiated_by = input.initiated_by ?? "governance_replay_operator";
  const execution_mode = scenarioMode(scenario, input.execution_mode);
  const execution_plan = schedule(scenario);
  const isolation_context = isolation(tenant_id, mission_id, failure);
  const certification_run_id = `GCORUN-7L1-${hashValue("governance-certification-run-id", { tenant_id, mission_id, execution_mode, scenario }).slice(0, 10).toUpperCase()}`;
  const scenario_results = freezeArray(execution_plan.map((definition) => resultForDefinition(definition, scenario, tenant_id, mission_id, initiated_by)));
  const overall_result = aggregate(certification_run_id, scenario_results, failure);
  const execution_state = executionStateForFailure(failure);
  const evidence_package_source = {
    evidence_package_id: `GCOE-7L1-${hashValue("governance-certification-evidence-package-id", certification_run_id).slice(0, 10).toUpperCase()}`,
    certification_evidence_refs: unique(scenario_results.map((result) => result.evidence_reference)),
    replay_refs: unique(scenario_results.map((result) => result.replay_reference)),
    integrity_hashes: unique(scenario_results.map((result) => result.integrity_hash)),
    lineage_refs: unique(scenario_results.map((result) => result.scenario_id)),
  };
  const evidence_package = Object.freeze({ ...evidence_package_source, evidence_hash: hashValue("governance-certification-evidence-package", evidence_package_source) });
  const runSource = {
    certification_run_id,
    tenant_id,
    mission_id,
    suite_version: SUITE_VERSION,
    execution_mode,
    initiated_by,
    start_timestamp: NOW,
    end_timestamp: END,
    execution_state,
    overall_result: overall_result.overall_state,
    confidence: overall_result.overall_confidence,
    scenario_count: scenario_results.length,
    successful_scenarios: scenario_results.filter((result) => result.result === "PASS").length,
    failed_scenarios: scenario_results.filter((result) => result.result === "FAIL").length,
    warning_count: scenario_results.reduce((sum, result) => sum + result.warnings.length, 0),
    replay_reference: evidence_package.replay_refs[0] ?? "replay:7l1:orchestrator",
    integrity_hash: evidence_package.evidence_hash,
  };
  const run: GovernanceCertificationRun = Object.freeze({ ...runSource, run_hash: hashValue("governance-certification-run", runSource) });
  const ledgerSource = {
    ledger_record_id: `GCOL-7L1-${hashValue("governance-certification-ledger-id", certification_run_id).slice(0, 10).toUpperCase()}`,
    certification_run_id,
    tenant_id,
    mission_id,
    scenario_result_hashes: freezeArray(scenario_results.map((result) => result.result_hash)),
    overall_hash: overall_result.overall_hash,
    evidence_hash: evidence_package.evidence_hash,
    replay_reference: run.replay_reference,
    integrity_hash: run.integrity_hash,
    append_only: true as const,
    recorded_at: END,
  };
  const truth_ledger_record: GovernanceCertificationLedgerRecord = Object.freeze({ ...ledgerSource, ledger_hash: hashValue("governance-certification-ledger-record", ledgerSource) });
  const observability = Object.freeze({
    certification_duration_ms: 12000,
    scenario_throughput: Number((scenario_results.length / 12).toFixed(4)),
    replay_success_rate: Number((scenario_results.filter((result) => Boolean(result.replay_reference) && result.result !== "FAIL").length / scenario_results.length).toFixed(4)),
    integrity_verification_rate: Number((scenario_results.filter((result) => Boolean(result.integrity_hash) && result.result !== "FAIL").length / scenario_results.length).toFixed(4)),
    isolation_violations: failure === "ISOLATION_VIOLATION" || failure === "TENANT_ISOLATION_VIOLATION" ? 1 : 0,
    orchestration_failures: overall_result.blocking_failures.length,
    certification_success_rate: Number((scenario_results.filter((result) => result.result === "PASS").length / scenario_results.length).toFixed(4)),
  });
  const source = {
    orchestrator_id: `GCO-7L1-${hashValue("governance-certification-orchestrator-id", certification_run_id).slice(0, 10).toUpperCase()}`,
    phase_version: "7L.1" as const,
    schema_version: SCHEMA_VERSION,
    generated_at: END,
    read_only: true as const,
    advisory_only: true as const,
    governance_execution_allowed: false as const,
    mutation_allowed: false as const,
    tenant_isolated: failure !== "TENANT_ISOLATION_VIOLATION",
    authority_protected: failure !== "AUTHORITY_BOUNDARY_EXCEEDED",
    run,
    execution_plan,
    isolation_context,
    scenario_results,
    overall_result,
    timeline: timeline(execution_state),
    truth_ledger_record,
    evidence_package,
    observability,
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-certification-orchestrator-report", source) });
}

export function buildGovernanceCertificationOrchestratorObservabilitySurface(input: GovernanceCertificationOrchestratorInput = {}): GovernanceCertificationOrchestratorObservabilitySurface {
  const report = runGovernanceCertificationOrchestrator(input);
  return Object.freeze({
    certification_run_id: report.run.certification_run_id,
    execution_mode: report.run.execution_mode,
    execution_state: report.run.execution_state,
    overall_result: report.run.overall_result,
    scenario_count: report.run.scenario_count,
    failed_scenarios: report.run.failed_scenarios,
    warning_count: report.run.warning_count,
    isolation_violations: report.observability.isolation_violations,
    orchestration_failures: report.observability.orchestration_failures,
    report_hash: report.report_hash,
  });
}

export function getGovernanceCertificationOrchestratorContract() {
  const report = runGovernanceCertificationOrchestrator();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-sequencing", "isolated-execution", "append-only-results", "replay-compatible", "tenant-isolated", "authority-protected", "fail-closed", "advisory-only", "truth-ledger-recorded"]),
      schema_version: SCHEMA_VERSION,
      execution_modes: freezeArray(["MANUAL_CERTIFICATION", "SCHEDULED_CERTIFICATION", "PRE_RELEASE_CERTIFICATION", "REGRESSION_CERTIFICATION", "FULL_SYSTEM_CERTIFICATION", "INCREMENTAL_CERTIFICATION", "REPLAY_CERTIFICATION"] as const),
      lifecycle_states: freezeArray(["REQUESTED", "VALIDATING", "PREPARING", "EXECUTING", "COLLECTING_RESULTS", "AGGREGATING", "CERTIFIED", "ARCHIVED"] as const),
      failure_states: freezeArray(["VALIDATION_FAILED", "EXECUTION_FAILED", "AGGREGATION_FAILED", "REPLAY_FAILED", "INTEGRITY_FAILED", "ISOLATION_FAILED"] as const),
    }),
    report,
    observability: buildGovernanceCertificationOrchestratorObservabilitySurface(),
  });
}
